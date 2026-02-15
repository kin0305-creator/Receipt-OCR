
export interface ReceiptData {
  id: string;
  entity: string;
  paidBy: string;
  month: string; // YYYYMM format
  supplier: string;
  description: string;
  catNumber: string; // Cat #
  cat: string; // Cat (Detail)
  invoiceNo: string;
  originalCurrency: string; // e.g., 'USD', 'HKD', 'CNY'
  usd?: number;
  hkd?: number;
  cny?: number;
  inr?: number;
  thb?: number;
  gbp?: number; // UK Pound
  sgd?: number;
  eur?: number;
  aud?: number;
  pic: string;
  remarks: string;
}

export type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface FileWithState {
  file: File;
  id: string;
  status: ProcessingStatus;
  data?: ReceiptData;
  error?: string;
}
