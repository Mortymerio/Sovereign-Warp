import { useState, useEffect, useRef } from 'react';
import { Globe, RotateCw, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store';

export default function BrowserPreview() {
  const isOpen = useStore(s => s.isBrowserOpen);
  const toggle = useStore(s => s.toggleBrowser);
  const url = useStore(s => s.previewUrl);
  const setUrl = useStore(s => s.setPreviewUrl);
  
  const [inputUrl, setInputUrl] = useState(url);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setInputUrl(url);
  }, [url]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  };

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    let target = inputUrl;
    if (!target.startsWith('http')) target = 'http://' + target;
    setUrl(target);
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-[500px] glass-panel border-l border-white/10 flex flex-col panel-transition z-[120] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${isOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'}`}>

      {/* Browser Header */}

      <div className="h-12 flex items-center px-4 gap-3 border-b border-white/5 bg-white/5">
        <div className="flex gap-1.5 mr-2">
           <button className="p-1 hover:bg-white/5 rounded text-white/20 hover:text-white transition-colors">
             <ChevronLeft size={14} />
           </button>
           <button className="p-1 hover:bg-white/5 rounded text-white/20 hover:text-white transition-colors">
             <ChevronRight size={14} />
           </button>
           <button onClick={handleRefresh} className="p-1 hover:bg-white/5 rounded text-white/20 hover:text-white transition-colors ml-1">
             <RotateCw size={14} />
           </button>
        </div>

        <form onSubmit={handleGo} className="flex-1">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors">
              <Globe size={12} />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-full py-1.5 pl-8 pr-4 text-[11px] text-white/60 focus:text-white focus:border-cyan-500/30 outline-none transition-all font-mono"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.open(url, '_blank')}
            className="p-2 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors"
          >
            <ExternalLink size={16} />
          </button>
          <button onClick={toggle} className="p-2 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 bg-white relative">
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-none"
          title="Preview"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
        
        {/* Connection Overlay (optional indicator) */}
        <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 pointer-events-none">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
           <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Live Bridge Active</span>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-white/5 bg-black/20 text-[9px] text-white/20 flex justify-between">
        <span>RENDER ENGINE: WEBKIT/BLINK</span>
        <span className="font-bold text-cyan-500/40">M3WARP v0.6</span>
      </div>
    </div>
  );
}
