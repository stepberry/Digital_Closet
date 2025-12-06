
import React, { useState } from 'react';
import { ClothingItem, CapsuleOutfit, Season } from '../types';

interface CapsuleBuilderProps {
  wardrobe: ClothingItem[];
  currentPlan: CapsuleOutfit[];
  season: Season;
  isProcessing: boolean;
  onSeasonChange: (season: Season) => void;
  onGenerate: () => void;
  onSelectOutfit: (outfit: CapsuleOutfit, index: number) => void;
  activeOutfitIndex: number | null;
}

const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];

const CapsuleBuilder: React.FC<CapsuleBuilderProps> = ({
  wardrobe,
  currentPlan,
  season,
  isProcessing,
  onSeasonChange,
  onGenerate,
  onSelectOutfit,
  activeOutfitIndex
}) => {
  const [carouselIndex, setCarouselIndex] = useState(0);

  const handleNext = () => {
    setCarouselIndex(prev => (prev + 1) % currentPlan.length);
  };

  const handlePrev = () => {
    setCarouselIndex(prev => (prev - 1 + currentPlan.length) % currentPlan.length);
  };

  const getItemsForOutfit = (outfit: CapsuleOutfit) => {
    return wardrobe.filter(item => outfit.itemIds.includes(item.id));
  };

  // Helper to get visible items for the carousel (3 items window)
  const getVisibleOutfits = () => {
      if (currentPlan.length === 0) return [];
      const prevIndex = (carouselIndex - 1 + currentPlan.length) % currentPlan.length;
      const nextIndex = (carouselIndex + 1) % currentPlan.length;
      return [
          { data: currentPlan[prevIndex], index: prevIndex, position: 'left' },
          { data: currentPlan[carouselIndex], index: carouselIndex, position: 'center' },
          { data: currentPlan[nextIndex], index: nextIndex, position: 'right' }
      ];
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-paper">
      {/* Season Tabs */}
      <div className="flex border-b-2 border-black bg-white">
        {SEASONS.map(s => (
          <button
            key={s}
            onClick={() => onSeasonChange(s)}
            className={`flex-1 py-3 font-mono text-xs uppercase tracking-wider border-r last:border-r-0 border-black transition-colors ${
              season === s ? 'bg-black text-white' : 'hover:bg-stone-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col p-4 overflow-hidden relative">
        
        {currentPlan.length === 0 ? (
           <div className="flex-grow flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-stone-300">
             <div className="font-mono text-stone-400 mb-4">NO_CAPSULE_DATA_FOUND</div>
             <button 
                onClick={onGenerate}
                disabled={isProcessing}
                className="bg-black text-white px-6 py-3 font-mono text-sm font-bold shadow-hard hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
             >
                {isProcessing ? 'COMPUTING_ALGORITHMS...' : 'GENERATE_7-DAY_PLAN'}
             </button>
           </div>
        ) : (
           <div className="flex-grow flex flex-col">
              
              {/* Carousel Controls */}
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-serif text-xl font-bold">{season} Capsule</h3>
                  <div className="flex gap-2">
                      <button onClick={handlePrev} className="w-8 h-8 border border-black hover:bg-black hover:text-white flex items-center justify-center">&lt;</button>
                      <button onClick={handleNext} className="w-8 h-8 border border-black hover:bg-black hover:text-white flex items-center justify-center">&gt;</button>
                  </div>
              </div>

              {/* 3D-ish Carousel Display */}
              <div className="flex-grow relative flex items-center justify-center perspective-1000">
                 {getVisibleOutfits().map((item) => {
                     const isCenter = item.position === 'center';
                     const outfitItems = getItemsForOutfit(item.data);
                     const isActive = activeOutfitIndex === item.index;

                     return (
                         <div 
                            key={`${season}-${item.index}`}
                            onClick={() => isCenter && onSelectOutfit(item.data, item.index)}
                            className={`
                                absolute transition-all duration-500 ease-in-out cursor-pointer
                                w-64 h-[400px] border-2 border-black bg-white shadow-hard flex flex-col
                                ${isCenter ? 'z-20 scale-100 opacity-100' : 'z-10 scale-90 opacity-60 blur-[1px]'}
                                ${isCenter ? '' : item.position === 'left' ? '-translate-x-[60%]' : 'translate-x-[60%]'}
                            `}
                         >
                            {/* Header */}
                            <div className="p-2 border-b-2 border-black bg-stone-100 flex justify-between items-center">
                                <span className="font-mono text-xs font-bold">DAY_{item.data.day}</span>
                                {isActive && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                            </div>

                            {/* Visualization Area */}
                            <div className="flex-grow relative overflow-hidden bg-white group">
                                {item.data.generatedImage ? (
                                    <img src={item.data.generatedImage} alt="Outfit Render" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="grid grid-cols-2 gap-1 p-2 w-full h-full content-start overflow-hidden">
                                        {outfitItems.slice(0, 4).map(cloth => (
                                            <img key={cloth.id} src={cloth.isolatedImage || cloth.originalImage} className="w-full aspect-square object-contain border border-stone-100" />
                                        ))}
                                        {outfitItems.length > 4 && (
                                            <div className="flex items-center justify-center bg-stone-100 text-[10px] font-mono">+{outfitItems.length - 4}</div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Hover Overlay for Action */}
                                {isCenter && (
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-black text-white px-3 py-1 font-mono text-xs">
                                            {item.data.generatedImage ? 'VIEW_LOOK' : 'VISUALIZE'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Info */}
                            <div className="p-3 border-t-2 border-black bg-white">
                                <h4 className="font-serif font-bold text-sm truncate">{item.data.title}</h4>
                                <p className="font-mono text-[10px] text-stone-500 truncate">{item.data.vibe}</p>
                            </div>
                         </div>
                     );
                 })}
              </div>

              {/* Status Bar */}
              <div className="mt-4 p-2 bg-stone-100 border-2 border-black font-mono text-[10px] flex justify-between">
                  <span>CAPSULE_STATUS: {currentPlan.length} OUTFITS</span>
                  <button onClick={onGenerate} className="underline hover:bg-black hover:text-white px-1">REGENERATE_PLAN</button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default CapsuleBuilder;
