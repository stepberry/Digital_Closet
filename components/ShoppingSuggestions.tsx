import React from 'react';
import { ShoppingSuggestion } from '../types';

interface Props {
    suggestions: ShoppingSuggestion[];
    onClose: () => void;
}

const ShoppingSuggestions: React.FC<Props> = ({ suggestions, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white border-2 border-black shadow-hard w-full max-w-2xl max-h-[80vh] overflow-y-auto flex flex-col">
                <div className="p-4 border-b-2 border-black flex justify-between items-center bg-paper">
                    <h2 className="font-serif text-xl font-bold">AI Stylist Recommendations</h2>
                    <button onClick={onClose} className="hover:bg-black hover:text-white p-1 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="p-6 grid gap-4">
                    {suggestions.map((item, idx) => (
                        <div key={idx} className="border border-stone-300 p-4 hover:border-black hover:shadow-hard-sm transition-all bg-stone-50">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-mono font-bold text-lg uppercase">{item.itemName}</h3>
                                <span className="text-[10px] font-mono bg-black text-white px-2 py-1">{item.category}</span>
                            </div>
                            <p className="font-serif text-stone-600 italic mb-3">"{item.reason}"</p>
                            <div className="flex gap-4 text-xs font-mono text-stone-500 border-t border-stone-200 pt-2">
                                <span>COLOR: {item.color}</span>
                                <span>STYLE: {item.style}</span>
                            </div>
                            <div className="mt-3 text-right">
                                <a 
                                    href={`https://www.google.com/search?q=${encodeURIComponent(item.color + ' ' + item.style + ' ' + item.itemName)}&tbm=shop`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline font-mono text-xs uppercase"
                                >
                                    Search Google Shopping &rarr;
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ShoppingSuggestions;