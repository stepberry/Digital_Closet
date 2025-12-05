import React, { useState, useEffect } from 'react';
import { validateApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  initialKey?: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, initialKey = '' }) => {
  const [key, setKey] = useState(initialKey);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setKey(initialKey);
    setError('');
  }, [initialKey, isOpen]);

  const handleSaveClick = async () => {
    if (!key.trim()) {
        setError("This is not a valid API key.");
        return;
    }
    setError('');
    setIsValidating(true);

    // Strictly validate against Google's API to ensure it works
    const isValid = await validateApiKey(key.trim());
    
    setIsValidating(false);

    if (isValid) {
        onSave(key.trim());
    } else {
        setError("This is not a valid API key.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-black shadow-hard w-full max-w-md p-6 flex flex-col gap-4">
        <h2 className="font-serif text-xl font-bold">Configure API Access</h2>
        <p className="font-mono text-xs text-stone-600">
          To use The Digital Closet, you need a Google Gemini API Key. 
          Your key is stored locally in your browser.
        </p>
        
        <input 
          type="password" 
          value={key}
          onChange={(e) => {
              setKey(e.target.value);
              setError('');
          }}
          placeholder="Enter your AI Studio API Key"
          className={`w-full p-3 border-2 font-mono text-xs focus:outline-none focus:shadow-hard ${error ? 'border-red-500 bg-red-50' : 'border-black'}`}
        />

        {error && (
            <p className="font-mono text-[10px] text-red-600 font-bold animate-pulse">
                ! {error}
            </p>
        )}

        <div className="flex justify-between items-center mt-2">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer"
              className="text-[10px] font-mono underline text-blue-600 hover:text-blue-800"
            >
              {"GET_API_KEY ->"}
            </a>
            <div className="flex gap-2">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 font-mono text-xs hover:bg-stone-100 border border-transparent"
                  disabled={isValidating}
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleSaveClick}
                  disabled={isValidating}
                  className={`px-4 py-2 bg-black text-white font-mono text-xs font-bold shadow-hard-sm transition-all flex items-center gap-2 ${isValidating ? 'opacity-70 cursor-wait' : 'hover:translate-y-0.5 hover:shadow-none'}`}
                >
                  {isValidating ? (
                      <>
                        <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                        VALIDATING...
                      </>
                  ) : 'SAVE_KEY'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;