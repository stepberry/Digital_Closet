import React, { useRef, useState } from 'react';
import { ClothingItem } from '../types';

interface BackupData {
  version: number;
  timestamp: string;
  wardrobe: ClothingItem[];
  modelImage: string | null;
}

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardrobe: ClothingItem[];
  modelImage: string | null;
  onImport: (data: { wardrobe: ClothingItem[], modelImage: string | null }) => void;
}

const DataManagementModal: React.FC<DataManagementModalProps> = ({ 
  isOpen, 
  onClose, 
  wardrobe, 
  modelImage, 
  onImport 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleExport = () => {
    const data: BackupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      wardrobe,
      modelImage
    };

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `digital_closet_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('READING_DISK...');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json) as BackupData;
        
        // Basic validation
        if (Array.isArray(data.wardrobe)) {
           onImport({
             wardrobe: data.wardrobe,
             modelImage: data.modelImage || null
           });
           setImportStatus('SUCCESS');
           setTimeout(onClose, 1000);
        } else {
           setImportStatus('ERROR: CORRUPT_DATA');
        }
      } catch (err) {
        setImportStatus('ERROR: INVALID_FILE');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-black shadow-hard w-full max-w-md p-6 flex flex-col gap-6">
        <div className="border-b-2 border-black pb-2 flex justify-between items-center">
            <h2 className="font-mono text-xl font-bold uppercase tracking-tighter">Memory Card Management</h2>
            <button onClick={onClose} className="hover:bg-black hover:text-white px-2">X</button>
        </div>

        <div className="bg-stone-100 p-4 border border-stone-300 font-mono text-xs text-stone-600">
            <p className="mb-2"><strong>SYSTEM MESSAGE:</strong></p>
            <p>Use this module to backup your wardrobe to a file. Save this file to your Google Drive to access it on other devices.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            {/* EXPORT */}
            <button 
                onClick={handleExport}
                className="flex flex-col items-center justify-center p-6 border-2 border-black hover:bg-black hover:text-white transition-all group"
            >
                <svg className="w-8 h-8 mb-2 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span className="font-mono text-xs font-bold">WRITE_TO_DISK</span>
                <span className="font-mono text-[9px] opacity-60">(DOWNLOAD)</span>
            </button>

            {/* IMPORT */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border-2 border-black hover:bg-black hover:text-white transition-all group relative overflow-hidden"
            >
                {importStatus ? (
                    <span className="font-mono text-xs animate-pulse">{importStatus}</span>
                ) : (
                    <>
                        <svg className="w-8 h-8 mb-2 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span className="font-mono text-xs font-bold">READ_FROM_DISK</span>
                        <span className="font-mono text-[9px] opacity-60">(UPLOAD)</span>
                    </>
                )}
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
            </button>
        </div>

        <div className="text-center font-mono text-[10px] text-stone-400">
            CURRENT_SIZE: {wardrobe.length} ITEMS // {modelImage ? 'MODEL_LOADED' : 'NO_MODEL'}
        </div>
      </div>
    </div>
  );
};

export default DataManagementModal;