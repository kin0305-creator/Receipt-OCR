
import React, { useState, useRef } from 'react';

interface DropzoneProps {
  onFilesAdded: (files: FileList) => void;
  isProcessing: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(e.target.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        relative w-full max-w-2xl mx-auto h-48 border-2 border-dashed rounded-3xl
        flex flex-col items-center justify-center cursor-pointer transition-all duration-300
        ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/10'}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.eml,.msg"
      />
      <div className={`p-3 rounded-full mb-3 transition-colors ${isProcessing ? 'bg-blue-600 animate-pulse' : 'bg-blue-100'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isProcessing ? 'text-white' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <p className="text-lg font-bold text-gray-800 tracking-tight">Add receipts or emails</p>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Drag & Drop or Click to Upload</p>
      
      {isProcessing && (
        <div className="mt-4 flex items-center space-x-1.5">
           <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
           <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-.3s]"></div>
           <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-.5s]"></div>
           <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest pl-1">Processing Batch...</span>
        </div>
      )}
    </div>
  );
};

export default Dropzone;
