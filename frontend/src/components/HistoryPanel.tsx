import { useState, useEffect } from 'react';
import { Clock, RotateCcw, X, Eye, Calendar, HardDrive } from 'lucide-react';
import { useStore } from '../store';
import { HistoryService, EditorService } from '../../bindings/sovereign-warp/services';
import { Events } from '@wailsio/runtime';

export default function HistoryPanel() {
  const isOpen = useStore(s => s.isHistoryOpen);
  const toggle = useStore(s => s.toggleHistory);
  const activeTabPath = useStore(s => s.activeTabPath);
  const rootPaths = useStore(s => s.rootPaths);
  const setDiffData = useStore(s => s.setDiffData);

  
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [selection, setSelection] = useState<[number | null, number | null]>([null, null]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setSelection([null, null]);
    }
  }, [isOpen, activeTabPath]);


  const loadHistory = async () => {
    if (!activeTabPath || !rootPaths.length) return;
    const currentRoot = rootPaths.find(r => activeTabPath.startsWith(r));
    if (!currentRoot) return;
    
    try {
      const res = await HistoryService.GetSnapshots(currentRoot, activeTabPath);
      setSnapshots(res || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handlePreview = async (ts1: number, ts2?: number) => {
    if (!activeTabPath || !rootPaths.length) return;
    const currentRoot = rootPaths.find(r => activeTabPath.startsWith(r));
    if (!currentRoot) return;

    try {
      const content1 = await HistoryService.GetSnapshotContent(currentRoot, activeTabPath, ts1);
      let content2 = '';
      if (ts2) {
        content2 = await HistoryService.GetSnapshotContent(currentRoot, activeTabPath, ts2);
      } else {
        const currentRes = await EditorService.ReadLines(activeTabPath, 1, 100000); 
        content2 = currentRes?.lines.join('\n') || '';
      }
      
      setDiffData({
        original: content1,
        modified: content2
      });
    } catch (err) {
      console.error("Preview failed:", err);
    }
  };

  const toggleSelect = (ts: number) => {
    setSelection(prev => {
      if (prev[0] === ts) return [null, prev[1]];
      if (prev[1] === ts) return [prev[0], null];
      
      let next: [number | null, number | null];
      if (!prev[0]) next = [ts, prev[1]];
      else if (!prev[1]) next = [prev[0], ts];
      else next = [ts, null];

      if (next[0] && next[1]) {
        handlePreview(next[0], next[1]);
      }
      return next;
    });
  };

  const handleRestore = async (ts: number) => {

    if (!activeTabPath || !rootPaths.length) return;
    const currentRoot = rootPaths.find(r => activeTabPath.startsWith(r));
    if (!currentRoot) return;

    try {
      const content = await HistoryService.GetSnapshotContent(currentRoot, activeTabPath, ts);
      await EditorService.SaveFile(activeTabPath, content);
      Events.Emit('editor:refresh');
      await HistoryService.SaveSnapshot(currentRoot, activeTabPath, content);
      loadHistory();
    } catch (err) {
      console.error("Restore failed:", err);
    }
  };


  return (
    <div className={`fixed inset-y-0 right-0 w-80 glass-panel border-l border-white/10 flex flex-col panel-transition z-[100] ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
      
      <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
            <Clock size={16} />
          </div>
          <span className="text-xs font-bold tracking-widest text-white/80 uppercase">Chrono Warp</span>
        </div>
        <button onClick={toggle} className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {!activeTabPath ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
            <HardDrive size={32} />
            <p className="text-xs">No active file to track</p>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
            <Calendar size={32} />
            <p className="text-xs">No history found.<br/>Save the file to create snapshots.</p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
            {snapshots.map((s, idx) => {
              const isSelected0 = selection[0] === s.timestamp;
              const isSelected1 = selection[1] === s.timestamp;
              return (
                <div key={s.timestamp} className="relative pl-8 group animate-in fade-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className={`absolute left-[13px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#13161a] z-10 transition-all ${
                    isSelected0 ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 
                    isSelected1 ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' : 
                    'bg-white/20'
                  }`} />
                  
                  <div 
                    onClick={() => toggleSelect(s.timestamp)}
                    className={`flex flex-col gap-1 p-3 rounded-xl bg-white/5 border transition-all cursor-pointer ${
                      isSelected0 ? 'border-cyan-500/50 bg-cyan-500/5' : 
                      isSelected1 ? 'border-purple-500/50 bg-purple-500/5' : 
                      'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white/40">{s.label.split(' ')[1]}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${
                        isSelected0 ? 'text-cyan-400' : isSelected1 ? 'text-purple-400' : 'text-white/20'
                      }`}>
                        {isSelected0 ? 'Base' : isSelected1 ? 'Target' : s.label.split(' ')[0]}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePreview(s.timestamp); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold uppercase transition-colors"
                      >
                        <Eye size={10} /> VS Current
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRestore(s.timestamp); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 text-[9px] font-bold uppercase transition-colors"
                      >
                        <RotateCcw size={10} /> Restore
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 bg-white/5 border-t border-white/5">
        <p className="text-[9px] text-white/30 uppercase font-bold text-center tracking-widest leading-relaxed">
          {selection[0] && !selection[1] ? 'Select another point to compare' : 'Click snapshots to compare points'}
        </p>
      </div>

    </div>
  );
}
