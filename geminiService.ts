
import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const RECEIPT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    entity: { type: Type.STRING, description: "Default to 'GDC' if not specified" },
    paidBy: { type: Type.STRING, description: "Default to 'HK' if not specified" },
    month: { type: Type.STRING, description: "Format YYYYMM based on receipt date (e.g. 202602). Use current month if unknown." },
    supplier: { type: Type.STRING },
    description: { type: Type.STRING },
    catNumber: { type: Type.STRING, description: "The category number (e.g. 1, 4, 13)" },
    cat: { type: Type.STRING, description: "The category detail name" },
    invoiceNo: { type: Type.STRING },
    originalCurrency: { type: Type.STRING, description: "The currency code of the invoice (e.g. USD, EUR, GBP, HKD, CNY)" },
    usd: { type: Type.NUMBER, description: "REQUIRED. Calculate USD. Use 0 if cannot be found." },
    hkd: { type: Type.NUMBER, description: "REQUIRED. Calculate HKD. Use 0 if cannot be found." },
    cny: { type: Type.NUMBER, description: "REQUIRED. Calculate CNY. Use 0 if cannot be found." },
    inr: { type: Type.NUMBER },
    thb: { type: Type.NUMBER },
    gbp: { type: Type.NUMBER },
    sgd: { type: Type.NUMBER },
    eur: { type: Type.NUMBER },
    aud: { type: Type.NUMBER },
    pic: { type: Type.STRING, description: "Default to 'Ning' if not specified" },
    remarks: { type: Type.STRING },
  },
  required: ["catNumber", "cat", "originalCurrency", "usd", "hkd", "cny"],
};

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

/**
 * Helper to wrap functions with retry logic and exponential backoff.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isTransient = error?.status === 'UNKNOWN' || error?.code === 500 || error?.message?.includes('xhr error');
    if (retries > 0 && isTransient) {
      console.warn(`Transient error encountered. Retrying in ${delay}ms... (Attempts left: ${retries})`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function processFileWithGemini(file: File): Promise<ReceiptData> {
  const fileName = file.name.toLowerCase();
  const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');
  const isImage = file.type.startsWith('image/') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png');
  
  let contents: any;

  const instruction = `
    TASK: Financial OCR & Classification.
    
    CATEGORIES (STRICT):
    1 | Tradeshow & Events- (Event name)
    2 | Advertisement
    3 | Production of Video
    4 | Production of Marketing Materials (must do items e.g. Brochure / Envelope / Plaques / 授权牌)
    5 | Production of Giveaways (optional items)
    6 | Design Fee of Giveaways / Brochure / Ad
    7 | Photo taking of product/ staff
    8 | Translation of PR & Brohcure
    9-1 | Website (www.gdc-tech.com, Cine-Union)
    9-2 | Website (www.espedeo.com)
    10 | Social Media/ Online Tool (nearly must subscribe items)
    11 | Google Adwords (change budget flexibly based on ad performance)
    12 | Press Relationship: Aiwei (asking 3rd party to write for GDC e.g. Aiwei)
    13 | Membership (EU)
    14 | Membership (CN)
    15 | Ad hoc expenses/Miscellaneous/ Award (HK)
    16 | Ad hoc expenses/Miscellaneous/ Award (CN)
    17 | Ad hoc expenses/Miscellaneous/ Award (EU)
    18 | DTS:X for IAB +DTS Surround Cinema Marketing (exclude plaque)
    19 | Marketing Analysis
    20 | GoGoCinema Marketing

    PLAQUE RULE: Any mention of "Plaque", "授权牌", "Tricorne Plaque" MUST be Cat 4.
    
    EXCHANGE RATES:
    - 1 USD = 7.0 CNY
    - 1 USD = 7.7 HKD (Strict 1.1 HKD = 1 CNY ratio, based on 1 USD = 7.0 CNY)
    - 1 USD = 78.72 INR
    - 1 USD = 1.40 SGD
    - 1 USD = 35.0 THB
    - 1 EUR = 8.0 CNY
    - 1 AUD = 4.8 CNY
    - 1 GBP = 1.27 USD
    
    RATIO CHECK: HKD:CNY must be exactly 1.1:1.
    
    CURRENCY FILING:
    - ALWAYS fill USD, HKD, CNY. Use 0 if amount is missing.
    - Fill other columns ONLY if they match the original invoice currency. Otherwise leave null.
    
    FILE CONTEXT: 
    The file name is "${file.name}". Extract relevant data points from the provided document contents. 
    Ensure the date/month extracted is based on the INVOICE date, not the current system date unless no date is found.
  `;

  return withRetry(async () => {
    if (isPdf || isImage) {
      const base64Data = await fileToBase64(file);
      const mimeType = isPdf ? 'application/pdf' : (file.type || 'image/jpeg');
      contents = {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: instruction }
        ]
      };
    } else {
      const textContent = await file.text();
      contents = {
        parts: [{ text: `Analyze this document: \n\n ${textContent.substring(0, 30000)} \n\n ${instruction}` }]
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [contents],
      config: {
        responseMimeType: "application/json",
        responseSchema: RECEIPT_SCHEMA,
        temperature: 0.1,
      },
    });

    if (!response.text) throw new Error("Empty AI response");
    
    const parsed = JSON.parse(response.text);
    return { ...parsed, id: Math.random().toString(36).substr(2, 9) };
  });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
}
