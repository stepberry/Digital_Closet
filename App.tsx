import React, { useState, useEffect, useRef } from 'react';
import { analyzeWardrobeImage, isolateClothingItem, suggestOutfit, generateVirtualTryOn, resizeImage, suggestShoppingAdditions, setGeminiApiKey, getGeminiApiKey, generateAvatar } from './services/geminiService';
import WardrobeGallery from './components/WardrobeGallery';
import ModelViewer from './components/ModelViewer';
import ShoppingSuggestions from './components/ShoppingSuggestions';
import ApiKeyModal from "./components/ApiKeyModal";
import DataManagementModal from "./components/DataManagementModal";
import MusicPlayer from "./components/MusicPlayer";
import { ClothingItem, ShoppingSuggestion, ModelSettings } from './types';

const App: React.FC = () => {
  // State
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [modelImage, setModelImage] = useState<string | null>(null);
  
  // Selection State
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  // Generated State
  const [generatedOutfitImage, setGeneratedOutfitImage] = useState<string | undefined>(undefined);
  const [currentlyWornIds, setCurrentlyWornIds] = useState<string[]>([]); // Tracks what is IN the generated image

  const [isProcessing, setIsProcessing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Suggestion State
  const [suggestions, setSuggestions] = useState<ShoppingSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // API Key State
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Data Management State
  const [showDataModal, setShowDataModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Safe LocalStorage Saving
  const saveToStorage = (key: string, data: string) => {
    try {
      localStorage.setItem(key, data);
    } catch (e) {
      console.error("Storage limit reached:", e);
      alert("Storage Quota Exceeded! Your wardrobe is too full for the browser's local memory. Please delete some items before adding more.");
    }
  };

  // Load Data
  useEffect(() => {
    try {
      const savedWardrobe = localStorage.getItem('digital_closet_wardrobe');
      if (savedWardrobe) {
        const parsed = JSON.parse(savedWardrobe);
        if (Array.isArray(parsed)) setWardrobe(parsed);
      }
      const savedModel = localStorage.getItem('digital_closet_model');
      if (savedModel) setModelImage(savedModel);
    } catch (e) {
      console.error("Failed to load data", e);
      setWardrobe([]); 
    }

    // Check for API Key
    if (!getGeminiApiKey()) {
      setShowApiKeyModal(true);
    }
  }, []);

  // Save Data
  useEffect(() => {
    if (wardrobe.length > 0) {
        saveToStorage('digital_closet_wardrobe', JSON.stringify(wardrobe));
    } else {
        localStorage.removeItem('digital_closet_wardrobe');
    }
    
    if (modelImage) {
        saveToStorage('digital_closet_model', modelImage);
    }
  }, [wardrobe, modelImage]);

  // --- Handlers ---

  const handleSaveApiKey = (key: string) => {
    setGeminiApiKey(key);
    setShowApiKeyModal(false);
  };

  const handleImportData = (data: { wardrobe: ClothingItem[], modelImage: string | null }) => {
      setWardrobe(data.wardrobe);
      setModelImage(data.modelImage);
      // Reset generated states
      setGeneratedOutfitImage(undefined);
      setSelectedItemIds([]);
      setCurrentlyWornIds([]);
      alert("Closet data restored successfully.");
  };

  const handleAddItem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!getGeminiApiKey()) { setShowApiKeyModal(true); return; }
    if (!e.target.files?.length) return;
    setIsProcessing(true);
    setStatusMessage("SCANNING_ASSETS...");
    setShowAddModal(false);

    try {
      // Step 1: Resize input image aggressively
      const base64 = await resizeImage(e.target.files[0]);
      
      // Step 2: Analyze
      const analysis = await analyzeWardrobeImage(base64);
      
      if (!analysis.items?.length) {
          alert("No items detected.");
          return;
      }

      const newItems: ClothingItem[] = [];
      for (const itemData of analysis.items) {
        setStatusMessage(`ISOLATING_${itemData.name.toUpperCase()}...`);
        let isolated = base64; 
        try { 
            isolated = await isolateClothingItem(base64, itemData.name); 
        } catch (e) {
            console.warn("Isolation failed, using original", e);
        }

        newItems.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          originalImage: base64,
          isolatedImage: isolated,
          name: itemData.name,
          category: itemData.category,
          color: itemData.color,
          colorName: itemData.colorName,
          pattern: itemData.pattern,
          style: itemData.style,
          vibe: itemData.vibe,
          dateAdded: new Date().toISOString()
        });
      }
      setWardrobe(prev => [...newItems, ...prev]);
    } catch (error: any) {
      console.error(error);
      alert(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setStatusMessage("");
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setWardrobe(prev => prev.filter(item => item.id !== itemId));
    setSelectedItemIds(prev => prev.filter(id => id !== itemId));
    // Clean up state if deleted item was currently being worn
    setCurrentlyWornIds(prev => prev.filter(id => id !== itemId));
  };

  const handleSelectItem = (item: ClothingItem) => {
    setSelectedItemIds(prev => {
      if (prev.includes(item.id)) return prev.filter(id => id !== item.id);
      return [...prev, item.id];
    });
  };

  const handleRenderLook = async () => {
    if (!getGeminiApiKey()) { setShowApiKeyModal(true); return; }
    if (!modelImage || selectedItemIds.length === 0) return;
    setIsProcessing(true);
    setStatusMessage("RENDERING_VIRTUAL_FIT...");
    
    try {
        const items = wardrobe.filter(i => selectedItemIds.includes(i.id));
        const vibe = prompt || items[0]?.vibe || "Editorial"; 
        
        const tryOnImage = await generateVirtualTryOn(modelImage, items, vibe);
        setGeneratedOutfitImage(tryOnImage);
        setCurrentlyWornIds(selectedItemIds);
    } catch (e: any) {
        console.error(e);
        alert(`Render failed: ${e.message}`);
    } finally {
        setIsProcessing(false);
        setStatusMessage("");
    }
  };

  const handleAIStylist = async () => {
    if (!getGeminiApiKey()) { setShowApiKeyModal(true); return; }
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setStatusMessage("COMPUTING_OUTFIT_DATA...");

    try {
      const suggestion = await suggestOutfit(wardrobe, prompt);
      setSelectedItemIds(suggestion.itemIds);
      
      if (modelImage) {
        setStatusMessage(`GENERATING_LOOK: ${suggestion.vibe.toUpperCase()}...`);
        const items = wardrobe.filter(i => suggestion.itemIds.includes(i.id));
        if (items.length) {
            const tryOnImage = await generateVirtualTryOn(modelImage, items, suggestion.vibe);
            setGeneratedOutfitImage(tryOnImage);
            setCurrentlyWornIds(suggestion.itemIds);
        }
      }
    } catch (error: any) {
      alert(`Styling failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setStatusMessage("");
    }
  };

  const handleGetShoppingSuggestions = async () => {
      if (!getGeminiApiKey()) { setShowApiKeyModal(true); return; }
      setIsProcessing(true);
      setStatusMessage("ANALYZING_WARDROBE_GAPS...");
      try {
          const results = await suggestShoppingAdditions(wardrobe);
          setSuggestions(results);
          setShowSuggestions(true);
      } catch (e) {
          alert("Could not get suggestions.");
      } finally {
          setIsProcessing(false);
          setStatusMessage("");
      }
  };

  const handleGenerateModel = async (settings: ModelSettings) => {
      if (!getGeminiApiKey()) { setShowApiKeyModal(true); return; }
      setIsProcessing(true);
      setStatusMessage("GENERATING_AVATAR...");
      try {
          const newAvatar = await generateAvatar(settings);
          setModelImage(newAvatar);
          setGeneratedOutfitImage(undefined);
          setCurrentlyWornIds([]);
      } catch (e: any) {
          alert("Avatar generation failed: " + e.message);
      } finally {
          setIsProcessing(false);
          setStatusMessage("");
      }
  };

  const handleModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const base64 = await resizeImage(e.target.files[0]);
      setModelImage(base64);
      setGeneratedOutfitImage(undefined);
      setCurrentlyWornIds([]);
    }
  };

  const hasPendingChanges = () => {
      if (selectedItemIds.length !== currentlyWornIds.length) return true;
      const sortedSelected = [...selectedItemIds].sort();
      const sortedWorn = [...currentlyWornIds].sort();
      return JSON.stringify(sortedSelected) !== JSON.stringify(sortedWorn);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-ink bg-stone-200">
      
      {/* --- HEADER --- */}
      <header className="bg-white border-b-2 border-black px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-hard-sm">
        <div className="flex items-center gap-4 overflow-hidden">
           <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-serif font-bold text-xl shrink-0">D</div>
           <div className="overflow-hidden">
             <h1 className="font-serif text-lg sm:text-2xl font-bold tracking-tight leading-none truncate">THE DIGITAL CLOSET</h1>
             <p className="font-mono text-[10px] tracking-widest text-stone-500 hidden sm:block">EST. 2025 // CURATE_ORGANIZE</p>
           </div>
        </div>
        
        <div className="flex gap-2 sm:gap-4 items-center shrink-0">
          {/* Desktop: Full buttons */}
          <div className="hidden sm:flex gap-4 items-center">
            <button 
              onClick={() => setShowApiKeyModal(true)}
              className={`font-mono text-[10px] uppercase border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors ${!getGeminiApiKey() ? 'bg-red-500 text-white animate-pulse border-red-500' : ''}`}
            >
              {getGeminiApiKey() ? 'API_KEY_SET' : '! SET_API_KEY'}
            </button>

            <button 
              onClick={() => setShowDataModal(true)}
              className="font-mono text-[10px] uppercase border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors"
            >
              [ SAVE / LOAD ]
            </button>

            <button onClick={handleGetShoppingSuggestions} className="flex items-center gap-2 font-mono text-xs hover:underline">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              AI_SHOPPING_ASSISTANT
            </button>
          </div>

          {/* Always Visible */}
          <div className="relative">
             <button 
               onClick={() => setShowAddModal(!showAddModal)}
               className="bg-black text-white px-5 py-2 font-mono text-xs font-bold hover:bg-stone-800 transition-all shadow-hard-sm hover:translate-y-0.5 hover:shadow-none active:translate-y-1"
             >
               + ADD_ITEM
             </button>
             
             {showAddModal && (
               <div className="absolute right-0 top-full mt-2 w-64 bg-white border-2 border-black shadow-hard z-50 p-2">
                 <button onClick={() => cameraInputRef.current?.click()} className="w-full text-left p-3 hover:bg-stone-100 font-mono text-xs border-b border-stone-200 mb-1">
                    [ CAMERA ]
                 </button>
                 <button onClick={() => galleryInputRef.current?.click()} className="w-full text-left p-3 hover:bg-stone-100 font-mono text-xs">
                    [ UPLOAD_FILE ]
                 </button>
                 <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAddItem} />
                 <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleAddItem} />
               </div>
             )}
          </div>
          
          <MusicPlayer />

          {/* Mobile: Kebab Menu */}
          <div className="relative sm:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="w-10 h-10 flex items-center justify-center bg-white border border-black hover:bg-black hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" /></svg>
            </button>

            {isMobileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border-2 border-black shadow-hard z-50 p-2">
                <button
                    onClick={() => { setShowApiKeyModal(true); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left p-3 hover:bg-stone-100 font-mono text-xs border-b border-stone-200 ${!getGeminiApiKey() ? 'text-red-500 font-bold' : ''}`}
                >
                  {getGeminiApiKey() ? 'API Key Set' : '! Set API Key'}
                </button>
                <button
                    onClick={() => { setShowDataModal(true); setIsMobileMenuOpen(false); }}
                    className="w-full text-left p-3 hover:bg-stone-100 font-mono text-xs border-b border-stone-200"
                >
                  Save / Load Closet
                </button>
                <button 
                    onClick={() => { handleGetShoppingSuggestions(); setIsMobileMenuOpen(false); }} 
                    className="w-full text-left p-3 hover:bg-stone-100 font-mono text-xs flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  AI Shopping Assistant
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <main className="flex-grow flex flex-col lg:flex-row lg:overflow-hidden lg:h-[calc(100vh-85px)]">
        
        {/* LEFT PANEL: Controls & Wardrobe */}
        <div className="w-full lg:w-[450px] flex flex-col bg-white border-r-2 border-black z-30 shadow-xl">
          
          {/* AI Prompter */}
          <div className="p-6 bg-paper border-b-2 border-black">
            <h2 className="font-serif text-xl mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI Stylist
            </h2>
            <div className="relative">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the occasion (e.g., 'Gallery opening in Tokyo, avant-garde style')..."
                    className="w-full p-4 pr-12 bg-white border-2 border-black font-mono text-xs focus:outline-none focus:shadow-hard transition-shadow resize-none h-24"
                />
                
                <button 
                    onClick={handleAIStylist}
                    disabled={isProcessing || !prompt}
                    className="absolute bottom-2 right-2 bg-black text-white px-3 py-1 font-mono text-[10px] hover:bg-stone-700 disabled:opacity-50"
                >
                    GENERATE_OUTFIT
                </button>
            </div>
            {statusMessage && <p className="mt-2 font-mono text-[10px] text-blue-600 animate-pulse">{statusMessage}</p>}
          </div>

          {/* Wardrobe List */}
          <div className="flex-grow overflow-hidden flex flex-col bg-white">
            <div className="px-4 py-2 border-b-2 border-black bg-stone-100 flex justify-between items-center shrink-0">
                <span className="font-mono text-xs font-bold">INVENTORY_GRID</span>
                <span className="font-mono text-[10px] bg-black text-white px-1">{wardrobe.length}</span>
            </div>
            <WardrobeGallery 
              items={wardrobe} 
              onSelectItem={handleSelectItem} 
              onDeleteItem={handleDeleteItem}
              selectedIds={selectedItemIds} 
            />
          </div>
        </div>

        {/* RIGHT PANEL: Model Viewport */}
        <div className="flex-grow bg-stone-200 p-4 lg:p-8 flex flex-col overflow-hidden relative h-screen lg:h-auto">
          <ModelViewer 
            modelImage={modelImage}
            generatedOutfitImage={generatedOutfitImage}
            isProcessing={isProcessing}
            onUploadModel={handleModelUpload}
            onGenerateModel={handleGenerateModel}
            itemsToWearNames={wardrobe.filter(i => selectedItemIds.includes(i.id)).map(i => i.name)}
            onManualRender={handleRenderLook}
            hasPendingChanges={hasPendingChanges()}
          />
        </div>
      </main>

      {/* MODALS */}
      {showSuggestions && (
          <ShoppingSuggestions 
            suggestions={suggestions} 
            onClose={() => setShowSuggestions(false)} 
          />
      )}
      
      <ApiKeyModal 
        isOpen={showApiKeyModal} 
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleSaveApiKey}
        initialKey={getGeminiApiKey()}
      />

      <DataManagementModal 
        isOpen={showDataModal}
        onClose={() => setShowDataModal(false)}
        wardrobe={wardrobe}
        modelImage={modelImage}
        onImport={handleImportData}
      />
    </div>
  );
};

export default App;
