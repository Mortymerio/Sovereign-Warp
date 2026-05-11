import { X, Circle } from 'lucide-react';
import { useStore } from '../store';
import FileIcon from './FileIcon';

export default function TabBar() {
  const tabs = useStore(s => s.openTabs);
  const activeTabPath = useStore(s => s.activeTabPath);
  const setActiveTab = useStore(s => s.setActiveTab);
  const closeTab = useStore(s => s.closeTab);
  const fixTab = useStore(s => s.fixTab);

  if (tabs.length === 0) return null;

  return (
    <div 
      style={{ "--wails-drop-target": "main" } as any}
      className="h-9 flex items-center bg-[#0d1013]/90 backdrop-blur-xl border-b border-white/5 overflow-x-auto shrink-0 select-none no-scrollbar cursor-default"
    >
      {tabs.map(tab => {
        const isActive = activeTabPath === tab.path;
        return (
          <div
            key={tab.path}
            style={{ "--wails-drop-target": "none" } as any}
            onClick={() => setActiveTab(tab.path)}
            onDoubleClick={() => tab.isPreview && fixTab(tab.path)}
            onAuxClick={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                closeTab(tab.path);
              }
            }}
            className={`group relative h-9 flex items-center gap-2 px-4 border-r border-white/5 cursor-pointer transition-all duration-200 select-none min-w-[120px] max-w-[200px] ${
              isActive 
                ? 'bg-[#1a1d21] text-cyan-400' 
                : 'bg-[#0d1013] text-white/40 hover:bg-[#13161a] hover:text-white/60'
            }`}
          >
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent animate-in fade-in duration-500" />
            )}
            
            <FileIcon name={tab.name} size={14} />
            <span className={`text-[11px] font-medium truncate flex-1 ${tab.isPreview ? 'italic opacity-70' : ''}`}>
              {tab.name}
            </span>

            
            {isActive && (
              <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-cyan-500 shadow-[0_0_10px_#00f2ff] rounded-t-full" />
            )}

            <div className="w-4 h-4 flex items-center justify-center relative">
              {tab.isDirty && (
                <Circle size={8} className={`fill-amber-400 text-amber-400 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'} group-hover:opacity-0`} />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.path); }}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all scale-75 group-hover:scale-100"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

