import React, { useState } from 'react';
import { ClothingItem } from '../types';

interface WardrobeGalleryProps {
  items: ClothingItem[];
  onSelectItem: (item: ClothingItem) => void;
  onDeleteItem: (itemId: string) => void;
  selectedIds: string[];
}

const CATEGORIES = ['All', 'Top', 'Bottom', 'Shoes', 'Outerwear', 'Accessory'];

const WardrobeGallery: React.FC<WardrobeGalleryProps> = ({ items, onSelectItem, onDeleteItem, selectedIds }) => {
  const [activeTab, setActiveTab] = useState('All');

  const filteredItems = activeTab === 'All' 
    ? items 
    : items.filter(i => i.category.toLowerCase().includes(activeTab.toLowerCase()) || (activeTab === 'Top' && i.category === 'Dress'));

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-paper">
      {/* Retro Tabs */}
      <div className="relative z-10 flex overflow-x-auto border-b-2 border-black bg-white no-scrollbar shrink-0">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-4 py-3 font-mono text-xs uppercase tracking-wider whitespace-nowrap border-r border-black hover:bg-stone-100 transition-colors ${
              activeTab === cat 
                ? 'bg-black text-white' 
                : 'text-black bg-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-grow overflow-y-auto p-4">
        {filteredItems.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-stone-400 font-mono text-xs text-center p-8 border-2 border-dashed border-stone-300">
             NO DATA_FOUND
             <br/>
             UPLOAD_CLOTHING_ITEMS
           </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div 
                  key={item.id} 
                  onClick={() => onSelectItem(item)}
                  className={`
                    relative cursor-pointer group border-2 border-black transition-all duration-100
                    ${isSelected ? 'bg-black shadow-hard translate-x-[-2px] translate-y-[-2px]' : 'bg-white hover:shadow-hard-sm'}
                  `}
                >
                  {/* Delete Button - Fixed: Direct click handling, no native confirm blocking */}
                  <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        onDeleteItem(item.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute z-40 top-1 left-1 w-8 h-8 bg-white text-stone-400 border border-stone-300 hover:bg-red-600 hover:text-white hover:border-red-600 hover:scale-110 flex items-center justify-center transition-all shadow-sm rounded-none"
                    title="Delete Item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>

                  {/* Image Container */}
                  <div className="aspect-[3/4] relative overflow-hidden bg-white">
                    <img 
                      src={item.isolatedImage || item.originalImage} 
                      alt={item.name} 
                      className={`w-full h-full object-contain p-2 mix-blend-multiply ${isSelected ? 'opacity-90' : ''}`}
                    />
                    
                    {/* Selected Overlay Checkmark */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 p-1 bg-black text-white border-l-2 border-b-2 border-white z-20">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </div>

                  {/* Tech Label */}
                  <div className={`p-2 border-t-2 border-black ${isSelected ? 'bg-black text-white' : 'bg-white text-black'}`}>
                    <p className="font-mono text-[10px] uppercase truncate leading-tight">{item.name}</p>
                    <div className="flex justify-between items-end mt-1">
                        <span className="text-[10px] opacity-60">{item.category}</span>
                        <div className="w-2 h-2 border border-current" style={{ backgroundColor: item.color }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WardrobeGallery;