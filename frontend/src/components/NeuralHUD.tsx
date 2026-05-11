import { useState, useEffect } from 'react';
import { Zap, Brain, Activity, ShieldCheck } from 'lucide-react';

interface NeuralHUDProps {
  symbolName: string | null;
  symbolType: string | null;
}

export default function NeuralHUD({ symbolName, symbolType }: NeuralHUDProps) {
  const [complexity, setComplexity] = useState(0);
  const [integrity, setIntegrity] = useState(0);

  useEffect(() => {
    if (symbolName) {
      // Simulate neural analysis
      setComplexity(Math.floor(Math.random() * 40) + 10);
      setIntegrity(Math.floor(Math.random() * 5) + 95);
    }
  }, [symbolName]);

  if (!symbolName) return null;

  return (
    <div className="absolute top-4 right-16 z-50 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="bg-[#13161a]/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(0,242,255,0.1)] flex flex-col gap-2 min-w-[180px]">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-1">
          <div className="p-1.5 bg-cyan-500/20 rounded-lg">
            <Zap size={14} className="text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase font-black tracking-widest">Neural Analysis</div>
            <div className="text-[12px] text-white font-bold truncate max-w-[120px]">{symbolName}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-[9px] text-white/30 uppercase font-bold">
              <Activity size={10} /> Complexity
            </div>
            <div className="text-[11px] text-cyan-400 font-mono">{complexity} <span className="text-[8px] text-white/20">pts</span></div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-[9px] text-white/30 uppercase font-bold">
              <ShieldCheck size={10} /> Integrity
            </div>
            <div className="text-[11px] text-emerald-400 font-mono">{integrity}%</div>
          </div>
        </div>

        <div className="mt-1 pt-2 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[9px] text-white/40 italic">
            <Brain size={10} className="text-purple-400" /> Thinking...
          </div>
          <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500/50 animate-progress w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
