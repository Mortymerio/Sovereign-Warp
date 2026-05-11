import { useState, useEffect } from 'react';
import { Activity, GitCommit, Search } from 'lucide-react';
import { useStore } from '../store';
import { GitService } from '../../bindings/sovereign-warp/services';

interface Commit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

interface Blame {
  author: string;
  date: string;
  hash: string;
  message: string;
}

export default function ProjectPulse() {
  const isOpen = useStore(s => s.isProjectPulseOpen);
  const activeTabPath = useStore(s => s.activeTabPath);
  const cursorLine = useStore(s => s.cursorLine);
  const rootPaths = useStore(s => s.rootPaths);
  
  const [commits, setCommits] = useState<Commit[]>([]);
  const [blame, setBlame] = useState<Blame | null>(null);
  const [branch, setBranch] = useState('');

  useEffect(() => {
    if (isOpen && rootPaths.length > 0) {
      const root = rootPaths[0];
      GitService.GetCurrentBranch(root).then(setBranch);
      GitService.GetCommitHistory(root, 10).then(res => setCommits(res as any));
    }
  }, [isOpen, rootPaths]);

  useEffect(() => {
    if (isOpen && activeTabPath && rootPaths.length > 0) {
      const root = rootPaths[0];
      GitService.GetLineBlame(root, activeTabPath, cursorLine).then(res => setBlame(res as any));
    }
  }, [isOpen, activeTabPath, cursorLine, rootPaths]);

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-white/5 bg-[#0d1013]/95 backdrop-blur-3xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
      <div className="h-14 flex items-center px-6 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Activity size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white/90">Project Pulse</h2>
            <p className="text-[10px] text-cyan-400/60 font-mono uppercase">Branch: {branch || 'Unknown'}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {/* Forensics Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
            <Search size={12} /> Line Forensics
          </div>
          
          {blame ? (
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold">
                  {blame.author.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white/90">{blame.author}</div>
                  <div className="text-[9px] text-white/40">Modified line {cursorLine}</div>
                </div>
              </div>
              <div className="text-[11px] text-white/60 italic leading-relaxed">
                "{blame.message}"
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[9px] font-mono text-cyan-500/60">{blame.hash.substring(0, 8)}</span>
                <span className="text-[9px] text-white/20 uppercase font-bold">{blame.date}</span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-white/20 italic">No forensics available for this line</div>
          )}
        </div>

        {/* Recent History */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
            <GitCommit size={12} /> Recent History
          </div>
          
          <div className="space-y-3">
            {commits.map((commit, i) => (
              <div key={i} className="group relative pl-6 border-l border-white/10 pb-4 last:pb-0">
                <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-white/20 group-hover:bg-cyan-500 transition-colors shadow-[0_0_10px_rgba(0,242,255,0)] group-hover:shadow-[0_0_10px_rgba(0,242,255,0.5)]" />
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-white/80 group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {commit.message}
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-white/30">
                    <span className="font-bold">{commit.author}</span>
                    <span>•</span>
                    <span>{commit.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 bg-white/5 border-t border-white/5 flex flex-col gap-3">
         <div className="flex items-center justify-between text-[10px] font-bold">
           <span className="text-white/30 uppercase">Neural Context</span>
           <span className="text-green-400/70">SYNCED</span>
         </div>
         <button className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-cyan-500/20 transition-all">
           Full Repository Audit
         </button>
      </div>
    </div>
  );
}
