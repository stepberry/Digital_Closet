import React, { useState, useRef, useEffect } from 'react';
import { ModelSettings } from '../types';

interface ModelViewerProps {
  modelImage: string | null;
  generatedOutfitImage?: string;
  isProcessing: boolean;
  onUploadModel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateModel: (settings: ModelSettings) => void;
  itemsToWearNames: string[];
  onManualRender: () => void;
  hasPendingChanges: boolean;
}

const RACES = ["Black / African", "White / Caucasian", "Native American", "Asian", "Pacific Islander", "Hispanic / Latino", "Middle Eastern", "South Asian", "Mixed Race"];
const HAIRSTYLES = ["Black", "Brown", "Blonde", "Red", "Grey", "White", "Bald"];

const ModelViewer: React.FC<ModelViewerProps> = ({ 
  modelImage, 
  generatedOutfitImage, 
  isProcessing, 
  onUploadModel,
  onGenerateModel,
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

  // Model Generator State
  const [showGenerator, setShowGenerator] = useState(!modelImage);
  const [settings, setSettings] = useState<ModelSettings>({
      gender: 'Female',
      race: 'Black / African',
      hair: 'Black'
  });

  const displayImage = generatedOutfitImage || modelImage;

  // Reset zoom when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    if (!modelImage) setShowGenerator(true);
  }, [displayImage, modelImage]);

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

  const handleDownload = () => {
    if (displayImage) {
        const link = document.createElement('a');
        link.href = displayImage;
        link.download = `digital_closet_render_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
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

  const handleGenerateClick = () => {
      onGenerateModel(settings);
      setShowGenerator(false);
  };

  return (
    <div className="h-full flex flex-col bg-white border-2 border-black shadow-hard relative">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center p-3 border-b-2 border-black bg-white z-10">
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'} border border-black`}></div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Dressing_Room_v2.0</h2>
        </div>
        <div className="flex gap-2 items-center">
            {displayImage && (
                <>
                {/* Download Button */}
                <button 
                    onClick={handleDownload}
                    className="h-10 w-10 flex items-center justify-center bg-white border border-black hover:bg-black hover:text-white transition-colors mr-2"
                    title="SAVE_IMAGE"
                >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>

                <div className="flex border border-black h-10 items-center mr-2">
                    <button onClick={handleZoomOut} className="px-2 h-full hover:bg-black hover:text-white font-mono text-xs border-r border-black">-</button>
                    <button onClick={handleResetZoom} className="px-2 h-full hover:bg-black hover:text-white font-mono text-xs border-r border-black">{Math.round(scale * 100)}%</button>
                    <button onClick={handleZoomIn} className="px-2 h-full hover:bg-black hover:text-white font-mono text-xs">+</button>
                </div>
                <button 
                    onClick={() => setShowGenerator(true)} 
                    className="h-10 px-3 bg-white border border-black hover:bg-black hover:text-white font-mono text-xs font-bold uppercase transition-colors"
                >
                    [ EDIT_AVATAR ]
                </button>
                </>
            )}
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
        
        {/* Model Generator Overlay/Form */}
        {(showGenerator || !modelImage) && !isProcessing && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-stone-200/90 backdrop-blur-sm p-4">
            <div className="bg-white border-2 border-black shadow-hard p-6 w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif text-xl font-bold">Configure Avatar</h3>
                    {modelImage && <button onClick={() => setShowGenerator(false)} className="text-xs font-mono hover:bg-black hover:text-white px-2">CANCEL</button>}
                </div>
                
                <div className="space-y-4 font-mono text-xs">
                    <div>
                        <label className="block mb-1 font-bold">GENDER / TYPE</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['Female', 'Male', 'Non-Binary', 'Mannequin'] as const).map(g => (
                                <button 
                                    key={g}
                                    onClick={() => setSettings(s => ({...s, gender: g}))}
                                    className={`py-2 border border-black ${settings.gender === g ? 'bg-black text-white' : 'bg-white hover:bg-stone-100'}`}
                                >
                                    {g.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {settings.gender !== 'Mannequin' && (
                        <>
                        <div>
                            <label className="block mb-1 font-bold">RACE / ETHNICITY</label>
                            <select 
                                value={settings.race}
                                onChange={(e) => setSettings(s => ({...s, race: e.target.value}))}
                                className="w-full p-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                            >
                                {RACES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold">HAIR COLOR</label>
                            <select 
                                value={settings.hair}
                                onChange={(e) => setSettings(s => ({...s, hair: e.target.value}))}
                                className="w-full p-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                            >
                                {HAIRSTYLES.map(h => <option key={h} value={h}>{h.toUpperCase()}</option>)}
                            </select>
                        </div>
                        </>
                    )}

                    <button 
                        onClick={handleGenerateClick}
                        className="w-full py-3 bg-black text-white font-bold text-sm hover:bg-stone-800 transition-transform active:scale-95 border-2 border-transparent"
                    >
                        GENERATE_MODEL
                    </button>
                    
                    <div className="text-center pt-2 border-t border-stone-200">
                         <span className="text-[10px] text-stone-500 mr-2">OR USE OWN IMAGE:</span>
                         <label className="inline-block cursor-pointer hover:underline text-[10px] font-bold">
                            UPLOAD_FILE
                            <input type="file" accept="image/*" className="hidden" onChange={onUploadModel} />
                        </label>
                    </div>
                </div>
            </div>
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
        {hasPendingChanges && !isProcessing && modelImage && !showGenerator && (
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
