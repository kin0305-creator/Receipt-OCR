
import React, { useState, useCallback } from 'react';
import { FileWithState, ReceiptData } from './types';
import Dropzone from './components/Dropzone';
import ReceiptTable from './components/ReceiptTable';
import { processFileWithGemini } from './geminiService';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileWithState[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleFilesAdded = useCallback(async (newFiles: FileList) => {
    const fileArray = Array.from(newFiles);
    const initialFiles: FileWithState[] = fileArray.map(f => ({
      file: f,
      id: Math.random().toString(36).substr(2, 9),
      status: 'processing'
    }));

    setFiles(prev => [...prev, ...initialFiles]);

    initialFiles.forEach(async (fileState) => {
      try {
        const extractedData = await processFileWithGemini(fileState.file);
        setFiles(prev => prev.map(f => 
          f.id === fileState.id ? { ...f, status: 'completed' as const, data: extractedData } : f
        ));
      } catch (err: any) {
        setFiles(prev => prev.map(f => 
          f.id === fileState.id ? { ...f, status: 'error' as const, error: 'Could not parse' } : f
        ));
      }
    });
  }, []);

  const getTableDataAsTSV = (data: ReceiptData[]) => {
    const rows = data.map(item => {
      const orig = item.originalCurrency?.toUpperCase();
      return [
        item.entity || '', 
        item.paidBy || '', 
        item.month || '', 
        item.supplier || '', 
        item.description || '', 
        item.catNumber || '', 
        item.cat || '', 
        item.invoiceNo || '', 
        item.usd || 0, 
        item.hkd || 0, 
        item.cny || 0, 
        (orig === 'INR' ? item.inr : ''),
        (orig === 'THB' ? item.thb : ''),
        (orig === 'GBP' ? item.gbp : ''),
        (orig === 'SGD' ? item.sgd : ''),
        (orig === 'EUR' ? item.eur : ''),
        (orig === 'AUD' ? item.aud : ''),
        item.pic || '', 
        item.remarks || ''
      ].join('\t');
    });
    return rows.join('\n');
  };

  const handleCopyTable = async () => {
    const completedData = files.filter(f => f.status === 'completed' && f.data).map(f => f.data!);
    if (completedData.length === 0) return;

    const tsv = getTableDataAsTSV(completedData);
    const headers = [
      'Entity', 'Paid by', 'Month', 'Supplier', 'Description', 'Cat#', 'Cat', 'Invoice No', 
      'USD', 'HKD', 'CNY', 'INR', 'THB', 'UK Pound', 'SGD', 'EUR', 'AUD', 'PIC', 'Remarks'
    ];
    
    const currencyKeys = ['usd', 'hkd', 'cny', 'inr', 'thb', 'gbp', 'sgd', 'eur', 'aud'];
    const currencyMap: Record<string, string> = {
      'usd': 'USD', 'hkd': 'HKD', 'cny': 'CNY', 'inr': 'INR', 'thb': 'THB', 
      'gbp': 'GBP', 'sgd': 'SGD', 'eur': 'EUR', 'aud': 'AUD'
    };

    let html = `<table border="1" style="border-collapse: collapse; font-family: sans-serif; font-size: 11px;"><thead><tr>`;
    headers.forEach(h => {
      html += `<th style="background-color: #f3f4f6; padding: 6px; border: 1px solid #d1d5db; text-align: left;">${h}</th>`;
    });
    html += `</tr></thead><tbody>`;

    completedData.forEach(item => {
      html += `<tr>`;
      const orig = item.originalCurrency?.toUpperCase();
      const rowValues = [
        item.entity, item.paidBy, item.month, item.supplier, item.description, 
        item.catNumber, item.cat, item.invoiceNo, 
        item.usd, item.hkd, item.cny, 
        (orig === 'INR' ? item.inr : ''),
        (orig === 'THB' ? item.thb : ''),
        (orig === 'GBP' ? item.gbp : ''),
        (orig === 'SGD' ? item.sgd : ''),
        (orig === 'EUR' ? item.eur : ''),
        (orig === 'AUD' ? item.aud : ''),
        item.pic, item.remarks
      ];

      rowValues.forEach((val, idx) => {
        let style = 'padding: 6px; border: 1px solid #d1d5db;';
        if (idx >= 8 && idx <= 16) {
          const key = currencyKeys[idx - 8];
          if (orig === currencyMap[key]) {
            style += 'background-color: #fef9c3; font-weight: bold; color: #000;';
          }
        }
        const displayVal = (typeof val === 'number') ? val.toFixed(2) : (val || '');
        html += `<td style="${style}">${displayVal}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table>`;

    try {
      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobText = new Blob([tsv], { type: 'text/plain' });
      const clipboardData = [new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })];
      await navigator.clipboard.write(clipboardData);
      setToastMessage("Copied! Ready to paste into Doc.");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      await navigator.clipboard.writeText(tsv);
      setToastMessage("Copied (No Highlights).");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  const isProcessingAny = files.some(f => f.status === 'processing');
  const completedReceipts = files.filter(f => f.status === 'completed' && f.data).map(f => f.data!);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col p-4 md:p-12">
      <header className="max-w-7xl mx-auto w-full mb-10 flex flex-col lg:flex-row justify-between items-end lg:items-center gap-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
              RECEIPT<span className="text-blue-600">SCAN</span>
            </h1>
            <div className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Enterprise</span>
            </div>
          </div>
          <p className="text-gray-400 font-bold text-[10px] tracking-[0.3em] uppercase mt-2">Turbo Classification • Plaque logic updated</p>
        </div>
        
        <div className="flex items-center gap-4">
          {completedReceipts.length > 0 && (
            <button
              onClick={handleCopyTable}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-3 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              Copy For Google Doc
            </button>
          )}
          {files.length > 0 && (
            <button 
              onClick={() => setFiles([])} 
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 hover:border-red-100 transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full flex-grow">
        <div className="flex flex-col items-center">
          <Dropzone onFilesAdded={handleFilesAdded} isProcessing={isProcessingAny} />
          
          <div className="w-full mt-10">
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {files.map((f) => (
                  <div key={f.id} className={`
                    px-4 py-2 rounded-full border flex items-center gap-2 max-w-[280px] transition-all
                    ${f.status === 'processing' ? 'bg-blue-50 border-blue-200 animate-pulse' : 
                      f.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
                  `}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      f.status === 'processing' ? 'bg-blue-500' : 
                      f.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-[10px] font-black text-gray-600 truncate uppercase tracking-tight">{f.file.name}</span>
                    {f.status === 'error' && <span className="text-[9px] text-red-600 font-black uppercase">Failed</span>}
                  </div>
                ))}
              </div>
            )}

            <ReceiptTable data={completedReceipts} />
          </div>
        </div>
      </main>

      {showSuccessToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-10 py-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center space-x-4 z-50 border border-white/10 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-blue-500 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-black text-xs uppercase tracking-[0.2em]">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
