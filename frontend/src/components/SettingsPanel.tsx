import { X, Sparkles, Type, Keyboard, Palette } from 'lucide-react';
import { useStore } from '../store';
import { AIService } from '../../bindings/m3warp/services';

export default function SettingsPanel() {
  const isOpen = useStore(s => s.isSettingsOpen);
  const toggleSettings = useStore(s => s.toggleSettings);
  
  const isParticlesEnabled = useStore(s => s.isParticlesEnabled);
  const toggleParticles = useStore(s => s.toggleParticles);
  
  const fontSize = useStore(s => s.fontSize);
  const setFontSize = useStore(s => s.setFontSize);
  
  const isVimMode = useStore(s => s.isVimMode);
  const toggleVimMode = useStore(s => s.toggleVimMode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="w-full max-w-md bg-[#0d1013] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500/20 rounded-lg">
              <Palette size={16} className="text-cyan-400" />
            </div>
            <h2 className="font-bold text-sm tracking-tight">System Preferences</h2>
          </div>
          <button 
            onClick={toggleSettings}
            className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          
          {/* Particles Toggle */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                <Sparkles size={18} className="text-purple-400" />
              </div>
              <div>
                <div className="text-[13px] font-medium">Neural Particles</div>
                <div className="text-[11px] text-white/40">Visual feedback when typing</div>
              </div>
            </div>
            <button 
              onClick={toggleParticles}
              className={`w-10 h-5 rounded-full relative transition-all duration-300 ${isParticlesEnabled ? 'bg-cyan-500 shadow-[0_0_10px_rgba(0,242,255,0.4)]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isParticlesEnabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                <Type size={18} className="text-blue-400" />
              </div>
              <div>
                <div className="text-[13px] font-medium">Font Size</div>
                <div className="text-[11px] text-white/40">Current: {fontSize}px</div>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button 
                onClick={() => setFontSize(fontSize - 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-md text-white/60 hover:text-white"
              >
                -
              </button>
              <button 
                onClick={() => setFontSize(fontSize + 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-md text-white/60 hover:text-white"
              >
                +
              </button>
            </div>
          </div>

          {/* Vim Mode */}
          <div className="flex items-center justify-between group border-t border-white/5 pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                <Keyboard size={18} className="text-amber-400" />
              </div>
              <div>
                <div className="text-[13px] font-medium">Vim Emulation</div>
                <div className="text-[11px] text-white/40">Modal editing workflows</div>
              </div>
            </div>
            <button 
              onClick={toggleVimMode}
              className={`w-10 h-5 rounded-full relative transition-all duration-300 ${isVimMode ? 'bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isVimMode ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {/* Neural Themes (Phase IV) */}
          <div className="flex flex-col gap-3 border-t border-white/5 pt-6 group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
                <Palette size={18} className="text-cyan-400" />
              </div>
              <div>
                <div className="text-[13px] font-medium">Neural Theme Engine</div>
                <div className="text-[11px] text-white/40">Generate palettes via AI prompts</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <input 
                id="theme-prompt"
                type="text"
                placeholder="Try 'Deep Sea', 'Blood', 'Toxic'..."
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-cyan-500/50 transition-all"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const prompt = (e.target as HTMLInputElement).value;
                    if (!prompt) return;
                    const css = await AIService.GenerateTheme(prompt);
                    useStore.getState().setNeuralTheme(css);
                  }
                }}
              />
              <button 
                onClick={async () => {
                  const input = document.getElementById('theme-prompt') as HTMLInputElement;
                  if (!input || !input.value) return;
                  const css = await AIService.GenerateTheme(input.value);
                  useStore.getState().setNeuralTheme(css);
                }}
                className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg transition-all text-[11px] font-bold"
              >
                APPLY
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex justify-center">
          <div className="text-[10px] text-white/20 font-mono tracking-widest uppercase">M3Warp v0.2.0 • Event Horizon</div>
        </div>
      </div>
    </div>
  );
}
