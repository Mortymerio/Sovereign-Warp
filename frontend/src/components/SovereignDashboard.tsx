import { FolderOpen, History, Zap, Activity, Clock, FileCode, GitGraph } from 'lucide-react';
import { useStore } from '../store';
import { FilesystemService } from '../../bindings/m3warp/services';

export default function SovereignDashboard() {
  const rootPaths = useStore(s => s.rootPaths);
  const addRootPath = useStore(s => s.addRootPath);

  const handleOpenFolder = async () => {
    const path = await FilesystemService.PickFolder();
    if (path) addRootPath(path);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-12 bg-gradient-to-b from-transparent to-cyan-500/5 animate-in fade-in duration-700">
      <div className="max-w-4xl w-full space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-4 animate-pulse">
            Sovereign Command v0.9.5
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white/90">
            M3<span className="text-cyan-500">WARP</span>
          </h1>
          <p className="text-white/30 text-sm font-medium uppercase tracking-widest">
            High-Performance Neural Workspace
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard icon={<Activity size={16} />} label="Files Indexed" value="12.4K" color="text-cyan-400" />
          <StatCard icon={<GitGraph size={16} />} label="Commits Today" value="14" color="text-purple-400" />
          <StatCard icon={<Clock size={16} />} label="Deep Work" value="4.2h" color="text-amber-400" />
          <StatCard icon={<Zap size={16} />} label="Warp Points" value="8" color="text-emerald-400" />
        </div>

        {/* Action Center */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Recent Portals</h3>
            <div className="space-y-2">
              {rootPaths.length > 0 ? rootPaths.map(path => (
                <div key={path} className="group flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all cursor-pointer">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                    <FolderOpen size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-white/80 truncate">{path.split(/[/\\]/).pop()}</div>
                    <div className="text-[9px] text-white/20 truncate">{path}</div>
                  </div>
                </div>
              )) : (
                <div className="p-8 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-4">
                  <div className="text-[10px] text-white/20 font-bold uppercase">No active workspaces</div>
                  <button onClick={handleOpenFolder} className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
                    Initiate First Workspace
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Quick Flux</h3>
            <div className="grid grid-cols-2 gap-3">
              <FluxButton icon={<FileCode size={16} />} label="New Note" sub="Markdown" />
              <FluxButton icon={<History size={16} />} label="Open Recent" sub="Search files" />
              <FluxButton icon={<Activity size={16} />} label="System HUD" sub="Metrics" />
              <FluxButton icon={<Zap size={16} />} label="AI Chat" sub="Brain" />
            </div>
          </div>
        </div>
      </div>

      {/* Background Neural Art (Pure CSS) */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2 hover:border-white/10 transition-colors">
      <div className={`opacity-50 ${color}`}>{icon}</div>
      <div>
        <div className="text-2xl font-black text-white/90">{value}</div>
        <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
}

function FluxButton({ icon, label, sub }: any) {
  return (
    <button className="flex flex-col items-start p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left group">
      <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-cyan-400 group-hover:scale-110 transition-all mb-3">
        {icon}
      </div>
      <div className="text-[11px] font-bold text-white/80">{label}</div>
      <div className="text-[9px] text-white/20 uppercase">{sub}</div>
    </button>
  );
}
