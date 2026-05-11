import { Palette, GitGraph, Activity, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { GitService, SystemService } from '../../bindings/sovereign-warp/services';
import SystemHealthPanel from './SystemHealthPanel';

const themes = ['cyber-ronin', 'github-dark', 'github-light'] as const;

export default function StatusBar() {
  const line = useStore(s => s.cursorLine);
  const col = useStore(s => s.cursorCol);
  const activeTab = useStore(s => s.openTabs.find(t => t.path === s.activeTabPath));
  const fontSize = useStore(s => s.fontSize);

  const currentTheme = useStore(s => s.theme);
  const setTheme = useStore(s => s.setTheme);
  const rootPaths = useStore(s => s.rootPaths);

  const isVimMode = useStore(s => s.isVimMode);
  const toggleVimMode = useStore(s => s.toggleVimMode);

  const [branch, setBranch] = useState<string>('');
  const [stats, setStats] = useState<{cpu: number, ram: number, sysCpu: number, sysRam: number, sysTotal: number} | null>(null);
  const [isHUDOpen, setIsHUDOpen] = useState(false);

  useEffect(() => {
    const updateStats = async () => {
      try {
        const s = await SystemService.GetStats();
        setStats({ 
          cpu: s.cpu, 
          ram: s.ram,
          sysCpu: s.sysCpu,
          sysRam: s.sysRam,
          sysTotal: s.sysTotal
        });
      } catch {}
    };
    updateStats();
    const timer = setInterval(updateStats, 3000); 
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const primaryRoot = rootPaths[0];
    if (!primaryRoot) return;
    const updateGit = async () => {
      try {
        const b = await GitService.GetCurrentBranch(primaryRoot);
        setBranch(b);
      } catch {
        setBranch('');
      }
    };
    updateGit();
    const timer = setInterval(updateGit, 5000);
    return () => clearInterval(timer);
  }, [rootPaths]);

  const cycleTheme = () => {
    const idx = themes.indexOf(currentTheme as any);
    const next = themes[(idx + 1) % themes.length];
    setTheme(next);
  };

  return (
    <div className="h-6 flex items-center justify-between px-3 bg-[#0d1013]/90 backdrop-blur-md text-white/60 text-[11px] shrink-0 select-none border-t border-white/5">
      {isHUDOpen && <SystemHealthPanel onClose={() => setIsHUDOpen(false)} />}
      
      <div className="flex items-center gap-4 h-full flex-1">
        <span className="font-bold flex items-center gap-1.5 h-full px-1 border-r border-white/10 pr-4">
          M3Warp
        </span>
        {branch && (
          <div className="flex items-center gap-1.5 hover:bg-white/10 px-2 h-full cursor-pointer transition-colors">
            <GitGraph size={14} />
            <span className="font-medium">{branch}</span>
          </div>
        )}
        {activeTab && (
          <span className="opacity-70">{activeTab.language.toUpperCase()}</span>
        )}
        <button 
          onClick={toggleVimMode}
          className={`px-2 h-full transition-colors font-bold ${isVimMode ? 'bg-amber-500 text-black' : 'hover:bg-white/10 opacity-70'}`}
        >
          VIM
        </button>
      </div>

      <div 
        onClick={() => setIsHUDOpen(true)}
        className="flex-1 flex justify-center gap-8 border-x border-white/5 mx-4 hover:bg-white/5 cursor-pointer transition-colors group"
      >
        {stats && (
          <>
            {/* ENGINE GROUP */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 opacity-40 text-[9px] font-bold uppercase tracking-widest group-hover:opacity-100">
                <Activity size={10} /> Engine
              </div>
              <div className="flex items-center gap-2" title="Engine CPU (Goroutines based)">
                <div className="flex flex-col gap-0.5">
                  <div className="w-14 h-1 bg-white/5 rounded-full overflow-hidden relative">
                    <div 
                      className="absolute inset-y-0 left-0 bg-cyan-500 shadow-[0_0_8px_#00f2ff] transition-all duration-1000" 
                      style={{ width: `${Math.min(stats.cpu, 100)}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-bold text-cyan-400/60 leading-none">CPU {stats.cpu.toFixed(1)}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2" title="Engine RAM Allocation">
                <div className="flex flex-col gap-0.5">
                  <div className="w-14 h-1 bg-white/5 rounded-full overflow-hidden relative">
                    <div 
                      className="absolute inset-y-0 left-0 bg-purple-500 shadow-[0_0_8px_#a855f7] transition-all duration-1000" 
                      style={{ width: `${Math.min((stats.ram / 512) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-bold text-purple-400/60 leading-none">RAM {stats.ram.toFixed(0)} MB</span>
                </div>
              </div>
            </div>

            {/* SYSTEM GROUP */}
            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              <div className="flex items-center gap-1.5 opacity-40 text-[9px] font-bold uppercase tracking-widest group-hover:opacity-100">
                <ShieldCheck size={10} /> System
              </div>
              <div className="flex items-center gap-2" title="Global System CPU Load">
                <div className="flex flex-col gap-0.5">
                  <div className="w-14 h-1 bg-white/5 rounded-full overflow-hidden relative">
                    <div 
                      className="absolute inset-y-0 left-0 bg-orange-500 shadow-[0_0_8px_#f97316] transition-all duration-1000" 
                      style={{ width: `${stats.sysCpu}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-bold text-orange-400/60 leading-none">CPU {stats.sysCpu.toFixed(0)}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2" title="Global System RAM Usage">
                <div className="flex flex-col gap-0.5">
                  <div className="w-14 h-1 bg-white/5 rounded-full overflow-hidden relative">
                    <div 
                      className="absolute inset-y-0 left-0 bg-emerald-500 shadow-[0_0_8px_#10b981] transition-all duration-1000" 
                      style={{ width: `${(stats.sysRam / stats.sysTotal) * 100}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-bold text-emerald-400/60 leading-none">RAM {stats.sysRam.toFixed(1)} GB</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>




      <div className="flex items-center gap-4 opacity-80 flex-1 justify-end">

        {activeTab && (
          <>
            <span>Ln {line}, Col {col}</span>
            <span>{activeTab.totalLines.toLocaleString()} lines</span>
            <span>{formatBytes(activeTab.fileSize)}</span>
          </>
        )}
        <span>UTF-8</span>
        <button 
          onClick={cycleTheme}
          className="flex items-center gap-1.5 hover:bg-white/10 px-2 h-full transition-colors capitalize opacity-90"
        >
          <Palette size={12} />
          {currentTheme.replace('-', ' ')}
        </button>
        <span>{fontSize}px</span>
      </div>
    </div>
  );
}

function formatBytes(b: number): string {
  if (b < 1024) return b + 'B';
  if (b < 1048576) return (b / 1024).toFixed(1) + 'KB';
  if (b < 1073741824) return (b / 1048576).toFixed(1) + 'MB';
  return (b / 1073741824).toFixed(2) + 'GB';
}
