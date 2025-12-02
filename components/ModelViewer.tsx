import React, { useState, useRef, useEffect } from 'react';

interface ModelViewerProps {
  modelImage: string | null;
  generatedOutfitImage?: string;
  isProcessing: boolean;
  onUploadModel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  itemsToWearNames: string[];
  onManualRender: () => void;
  hasPendingChanges: boolean;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ 
  modelImage, 
  generatedOutfitImage, 
  isProcessing, 
  onUploadModel,
  itemsToWearNames,
  onManualRender,
  hasPendingChanges
}) => {
  // Zoom State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const displayImage = generatedOutfitImage || modelImage;

  // Reset zoom when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [displayImage]);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 4));
  const handleZoomOut = () => {
    setScale(s => {
        const newScale = Math.max(s - 0.5, 1);
        if (newScale === 1) setPosition({ x: 0, y: 0 }); // Reset pos if unzoomed
        return newScale;
    });
  };
  const handleResetZoom = () => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
  };

  const onMouseDown = (e: React.MouseEvent) => {
      if (scale > 1) {
          setIsDragging(true);
          dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
      }
  };

  const onMouseMove = (e: React.MouseEvent) => {
      if (isDragging && scale > 1) {
          setPosition({
              x: e.clientX - dragStart.current.x,
              y: e.clientY - dragStart.current.y
          });
      }
  };

  const onMouseUp = () => setIsDragging(false);

  return (
    <div className="h-full flex flex-col bg-white border-2 border-black shadow-hard relative">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center p-3 border-b-2 border-black bg-white z-10">
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'} border border-black`}></div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Dressing_Room_v2.0</h2>
        </div>
        <div className="flex gap-2">
            {displayImage && (
                <div className="flex border border-black">
                    <button onClick={handleZoomOut} className="px-2 hover:bg-black hover:text-white font-mono text-xs border-r border-black">-</button>
                    <button onClick={handleResetZoom} className="px-2 hover:bg-black hover:text-white font-mono text-xs border-r border-black">{Math.round(scale * 100)}%</button>
                    <button onClick={handleZoomIn} className="px-2 hover:bg-black hover:text-white font-mono text-xs">+</button>
                </div>
            )}
            <label className="text-xs font-mono underline hover:bg-black hover:text-white px-2 cursor-pointer transition-colors flex items-center">
            [LOAD_MODEL]
            <input type="file" accept="image/*" className="hidden" onChange={onUploadModel} />
            </label>
        </div>
      </div>

      {/* Viewport */}
      <div 
        ref={containerRef}
        className="relative flex-grow bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-stone-100 overflow-hidden flex items-center justify-center cursor-move"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        
        {!displayImage && (
          <div className="text-center p-8 border-2 border-dashed border-stone-400 m-8 bg-white/50 backdrop-blur-sm select-none">
            <h3 className="font-serif text-2xl text-black mb-2 italic">No Subject</h3>
            <p className="font-mono text-xs text-stone-600 mb-6 max-w-xs mx-auto">
              Initialize styling sequence by uploading a user model or mannequin.
            </p>
            <label className="inline-block px-6 py-3 bg-black text-white font-mono text-xs hover:bg-stone-800 cursor-pointer border-2 border-transparent hover:border-black transition-all shadow-hard-sm">
              UPLOAD_SOURCE_IMG
              <input type="file" accept="image/*" className="hidden" onChange={onUploadModel} />
            </label>
          </div>
        )}

        {/* Images with Pan/Zoom Transform */}
        {displayImage && (
          <div 
            style={{ 
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
            className="w-full h-full flex items-center justify-center"
          >
            <img 
                src={displayImage} 
                alt="Model" 
                className={`max-w-full max-h-full object-contain mix-blend-multiply transition-opacity duration-500 ${isProcessing ? 'opacity-50 blur-sm' : 'opacity-100'}`}
                draggable={false}
            />
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-white/50 backdrop-blur-sm pointer-events-none">
             <div className="bg-white border-2 border-black p-4 shadow-hard flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-t-black border-r-transparent border-b-black border-l-transparent rounded-full animate-spin mb-2"></div>
                <p className="font-mono text-xs animate-pulse">PROCESSING_ASSETS...</p>
             </div>
          </div>
        )}

        {/* Pending Changes Overlay/Action */}
        {hasPendingChanges && !isProcessing && modelImage && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                <button 
                    onClick={onManualRender}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-mono text-sm font-bold border-2 border-black shadow-hard hover:translate-y-1 hover:shadow-none transition-all"
                >
                    <span>VISUALIZE_CHANGES</span>
                    <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
            </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t-2 border-black p-4 bg-white min-h-[100px] relative z-10">
        <p className="font-mono text-[10px] text-stone-400 uppercase mb-2">Active_Configuration:</p>
        <div className="flex flex-wrap gap-2">
            {itemsToWearNames.length > 0 ? itemsToWearNames.map((name, idx) => (
                <span key={idx} className="px-2 py-1 bg-stone-100 border border-black font-mono text-xs">
                    {name}
                </span>
            )) : <span className="font-mono text-xs italic text-stone-400">No items selected</span>}
        </div>
      </div>
    </div>
  );
};

export default ModelViewer;