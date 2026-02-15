import React from 'react';
import { ReceiptData } from '../types';

interface ReceiptTableProps {
  data: ReceiptData[];
}

const ReceiptTable: React.FC<ReceiptTableProps> = ({ data }) => {
  if (data.length === 0) return null;

  const headers = [
    { label: 'Entity', key: 'entity' },
    { label: 'Paid by', key: 'paidBy' },
    { label: 'Month', key: 'month' },
    { label: 'Supplier', key: 'supplier' },
    { label: 'Description', key: 'description' },
    { label: 'Cat#', key: 'catNumber' },
    { label: 'Cat', key: 'cat' },
    { label: 'Invoice No', key: 'invoiceNo' },
    { label: 'USD', key: 'usd' },
    { label: 'HKD', key: 'hkd' },
    { label: 'CNY', key: 'cny' },
    { label: 'INR', key: 'inr' },
    { label: 'THB', key: 'thb' },
    { label: 'UK Pound', key: 'gbp' },
    { label: 'SGD', key: 'sgd' },
    { label: 'EUR', key: 'eur' },
    { label: 'AUD', key: 'aud' },
    { label: 'PIC', key: 'pic' },
    { label: 'Remarks', key: 'remarks' }
  ];

  const renderCell = (item: ReceiptData, headerKey: string) => {
    let value = (item as any)[headerKey];
    
    const currencyMap: Record<string, string> = {
      'usd': 'USD', 'hkd': 'HKD', 'cny': 'CNY', 'inr': 'INR', 'thb': 'THB', 
      'gbp': 'GBP', 'sgd': 'SGD', 'eur': 'EUR', 'aud': 'AUD'
    };
    
    const isOriginalCurrencyCell = item.originalCurrency?.toUpperCase() === currencyMap[headerKey];
    const isAlwaysRequiredCurrency = ['usd', 'hkd', 'cny'].includes(headerKey);

    // If it's a currency column but not the original one and not one of the always-required ones (USD/HKD/CNY), leave it blank.
    if (Object.keys(currencyMap).includes(headerKey) && !isOriginalCurrencyCell && !isAlwaysRequiredCurrency) {
      value = '';
    }
    
    // Highlight if it's the original currency
    const cellClass = `px-3 py-2 border border-gray-200 text-[11px] whitespace-nowrap transition-all
      ${isOriginalCurrencyCell ? 'bg-yellow-100 font-bold text-gray-900' : 'text-gray-700'}
    `;
    
    return (
      <td key={headerKey} className={cellClass}>
        {value === undefined || value === null || value === '' ? '' : 
          (typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value)}
      </td>
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl shadow-2xl border border-gray-200 mt-8 bg-white">
      <table className="w-full text-left border-collapse min-w-[2200px]">
        <thead>
          <tr className="bg-gray-100/50">
            {headers.map((header) => (
              <th key={header.key} className="px-3 py-4 border border-gray-200 text-[10px] font-black text-gray-600 uppercase tracking-widest min-w-[90px]">
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">
              {headers.map((h) => renderCell(item, h.key))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-4 bg-gray-50 text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center space-x-6">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 bg-yellow-100 border border-yellow-400 rounded-sm"></div>
          <span>Invoice Currency (Original)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
          <span>USD, HKD, CNY always filled</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
          <span>Others blank unless original currency</span>
        </div>
      </div>
    </div>
  );
};

export default ReceiptTable;