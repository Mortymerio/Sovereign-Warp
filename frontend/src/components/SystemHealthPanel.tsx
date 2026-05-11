import { useState, useEffect } from 'react';
import { X, Cpu, HardDrive, Activity, Zap, ShieldCheck } from 'lucide-react';
import { SystemService } from '../../bindings/m3warp/services';

interface Stats {
  cpu: number;
  ram: number;
  sysCpu: number;
  sysRam: number;
  sysTotal: number;
  diskUsed: number;
  diskTotal: number;
  uptime: string;
}

export default function SystemHealthPanel({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const update = async () => {
      const s = await SystemService.GetStats();
      if (s) setStats(s as any);
    };
    update();
    const timer = setInterval(update, 2000);
    return () => clearInterval(timer);
  }, []);

  if (!stats) return null;

  const ramPercent = (stats.sysRam / stats.sysTotal) * 100;
  const diskPercent = (stats.diskUsed / stats.diskTotal) * 100;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-[#0d1013] border border-cyan-500/20 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col">
        
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/90">System Health</h2>
              <p className="text-[10px] text-cyan-400/60 font-mono">CORE STATUS: OPERATIONAL</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all hover:rotate-90">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-2 gap-8">
          {/* CPU Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60">
                <Cpu size={16} className="text-purple-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider">CPU Load</span>
              </div>
              <span className="text-xs font-mono text-purple-400">{stats.sysCpu.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-1000" 
                style={{ width: `${stats.sysCpu}%` }}
              />
            </div>
            <p className="text-[10px] text-white/30">M3Warp Load: {stats.cpu.toFixed(2)}% (Goroutines)</p>
          </div>

          {/* RAM Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60">
                <Activity size={16} className="text-cyan-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Memory</span>
              </div>
              <span className="text-xs font-mono text-cyan-400">{ramPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000" 
                style={{ width: `${ramPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-white/30">Used: {stats.sysRam.toFixed(1)}GB / {stats.sysTotal.toFixed(1)}GB</p>
          </div>

          {/* Disk Section */}
          <div className="space-y-4 col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60">
                <HardDrive size={16} className="text-amber-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Disk Storage (C:)</span>
              </div>
              <span className="text-xs font-mono text-amber-400">{diskPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000" 
                style={{ width: `${diskPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-white/30">
              <span>Used: {stats.diskUsed.toFixed(1)}GB</span>
              <span>Total: {stats.diskTotal.toFixed(1)}GB</span>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-400/70">
               <ShieldCheck size={12} />
               <span>SOVEREIGN SECURE</span>
             </div>
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400/70">
               <Zap size={12} />
               <span>WARP SPEED: ENABLED</span>
             </div>
          </div>
          <div className="text-[10px] font-mono text-white/20">
            UPTIME: {stats.uptime.split('.')[0]}
          </div>
        </div>
      </div>
    </div>
  );
}
