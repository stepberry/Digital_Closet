import React, { useState, useRef, useEffect } from 'react';

const DEMO_TRACK_URL = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lo-fi-chill-medium-version-120-bpm-11634.mp3"; 

const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); // Start minimized by default for header placement
  const [volume, setVolume] = useState(0.5);
  const [trackName, setTrackName] = useState("INSERT_TAPE_OR_PLAY_DEMO");
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (!audioSrc) {
        handleLoadDemo();
        return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Playback failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleLoadDemo = () => {
      setAudioSrc(DEMO_TRACK_URL);
      setTrackName("DEMO_TAPE_01 // LO_FI_CHILL");
      setIsPlaying(true);
      setTimeout(() => {
          audioRef.current?.play();
      }, 100);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
      setTrackName(file.name.toUpperCase().replace(/\.[^/.]+$/, "")); 
      setIsPlaying(true);
      setTimeout(() => {
        audioRef.current?.play();
      }, 100);
    }
  };

  return (
    <div className="relative z-50 w-10 h-10 shrink-0">
        
        {/* Minimized State: Just the Button */}
        {isMinimized ? (
             <button 
                onClick={() => setIsMinimized(false)}
                className={`w-10 h-10 flex items-center justify-center bg-white border border-black hover:bg-black hover:text-white transition-all ${isPlaying ? 'text-green-600 animate-pulse' : 'text-black'}`}
                title="Open Audio Module"
             >
                 ♫
             </button>
        ) : (
            /* Expanded State: Absolute positioned card anchoring to top-right */
            <div className="absolute right-0 top-0 bg-white border-2 border-black shadow-hard p-2 w-64 flex flex-col gap-2 z-50">
                {/* Header / Minimize */}
                <div className="flex justify-between items-center pb-2 border-b border-stone-200 mb-1">
                    <span className="font-mono text-[10px] text-stone-500 font-bold">AUDIO_MODULE</span>
                    <button 
                        onClick={() => setIsMinimized(true)} 
                        className="w-4 h-4 flex items-center justify-center border border-transparent hover:bg-stone-100 font-mono text-xs font-bold leading-none"
                        title="Minimize"
                    >
                        _
                    </button>
                </div>

                {/* Display Screen */}
                <div className="bg-black text-green-500 font-mono text-[10px] p-2 overflow-hidden whitespace-nowrap border-b border-stone-700 relative h-8 flex items-center">
                    <div className={`absolute ${isPlaying ? 'animate-marquee' : ''} whitespace-nowrap`}>
                        {isPlaying ? '▶ ' : '❚❚ '} {trackName} {isPlaying ? '   ((( STEREO )))   ' : ''}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <button 
                            onClick={togglePlay}
                            className="w-8 h-8 flex items-center justify-center border border-black hover:bg-black hover:text-white transition-colors"
                        >
                            {isPlaying ? (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            ) : (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            )}
                        </button>
                        
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="h-8 px-2 border border-black font-mono text-[9px] hover:bg-black hover:text-white transition-colors flex items-center gap-1"
                            title="Upload MP3"
                        >
                            <span>⏏</span> LOAD
                        </button>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-1">
                        <span className="text-[8px] font-mono">VOL</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1" 
                            value={volume} 
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-16 h-1 bg-black appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        )}

        {/* Hidden Audio Element */}
        <audio ref={audioRef} src={audioSrc || undefined} loop onEnded={() => setIsPlaying(false)} className="hidden" />
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
        
        {/* Style helper for marquee animation */}
        <style dangerouslySetInnerHTML={{__html: `
            @keyframes marquee {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }
            .animate-marquee {
                animation: marquee 10s linear infinite;
            }
        `}} />
    </div>
  );
};

export default MusicPlayer;