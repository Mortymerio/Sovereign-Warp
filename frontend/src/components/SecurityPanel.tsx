import { useState } from 'react';
import { useStore } from '../store';
import { Shield, Lock, Unlock, X, ShieldAlert, Plus, Trash2 } from 'lucide-react';

export default function SecurityPanel() {
  const isOpen = useStore(s => s.isSecurityPanelOpen);
  const toggle = useStore(s => s.toggleSecurityPanel);
  const restrictedPaths = useStore(s => s.restrictedPaths);
  const setRestrictedPaths = useStore(s => s.setRestrictedPaths);
  const [newPath, setNewPath] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newPath && !restrictedPaths.includes(newPath)) {
      setRestrictedPaths([...restrictedPaths, newPath]);
      setNewPath('');
    }
  };

  const handleRemove = (path: string) => {
    setRestrictedPaths(restrictedPaths.filter(p => p !== path));
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#0d1013] border border-rose-500/30 rounded-2xl shadow-[0_0_50px_rgba(244,63,94,0.15)] overflow-hidden">
        <div className="px-6 py-4 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-400">
            <Shield size={20} className="animate-pulse" />
            <span className="font-black uppercase tracking-[0.2em] text-sm">PathGuard Sovereign</span>
          </div>
          <button onClick={toggle} className="text-rose-400/50 hover:text-rose-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 flex gap-3">
            <ShieldAlert size={24} className="text-rose-500 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-[12px] font-bold text-rose-200">Security Enforcement Active</h4>
              <p className="text-[10px] text-rose-500/60 leading-relaxed">
                Restricted paths are locked. The AI Assistant and external bridges will be denied access to these zones.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newPath}
                onChange={e => setNewPath(e.target.value)}
                placeholder="Enter path to restrict..."
                className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-rose-500/50 transition-all"
              />
              <button 
                onClick={handleAdd}
                className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 px-3 rounded-lg border border-rose-500/30 transition-all"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
              {restrictedPaths.length === 0 ? (
                <div className="py-8 text-center text-[10px] text-white/20 italic">No restrictions defined</div>
              ) : (
                restrictedPaths.map(path => (
                  <div key={path} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/5 group">
                    <div className="flex items-center gap-2">
                      <Lock size={12} className="text-rose-500/50" />
                      <span className="text-[11px] text-white/60 truncate max-w-[200px]">{path}</span>
                    </div>
                    <button 
                      onClick={() => handleRemove(path)}
                      className="opacity-0 group-hover:opacity-100 text-rose-500/40 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px]">
          <span className="text-white/20 uppercase tracking-widest font-bold">M3Warp Security Core</span>
          <div className="flex items-center gap-2 text-rose-500/40">
            <Unlock size={12} />
            <span>Sovereign Override: OFF</span>
          </div>
        </div>
      </div>
    </div>
  );
}
