import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { EditorService } from '../../bindings/m3warp/services';
import { Table, LayoutGrid, FileSpreadsheet } from 'lucide-react';

const COLUMN_COLORS = [
  'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
  'text-purple-400 border-purple-500/20 bg-purple-500/5',
  'text-amber-400 border-amber-500/20 bg-amber-500/5',
  'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
  'text-pink-400 border-pink-500/20 bg-pink-500/5',
  'text-blue-400 border-blue-500/20 bg-blue-500/5',
  'text-orange-400 border-orange-500/20 bg-orange-500/5',
  'text-green-400 border-green-500/20 bg-green-500/5',
];

export default function CSVPreview() {
  const activePath = useStore(s => s.activeTabPath);
  const [data, setData] = useState<string[][]>([]);


  useEffect(() => {
    if (activePath?.toLowerCase().endsWith('.csv')) {
      EditorService.ReadLines(activePath, 1, 1000).then(res => {
        if (res) {
          const rows = res.lines.map(line => {
            // Simple CSV parser (doesn't handle quotes perfectly but good enough for MVP)
            return line.split(',').map(cell => cell.trim());
          });
          setData(rows);
        }
      });
    } else {

      setData([]);
    }
  }, [activePath]);

  if (!activePath?.toLowerCase().endsWith('.csv') || data.length === 0) return null;

  return (
    <div className="absolute inset-0 z-50 bg-[#0a0c0e]/95 backdrop-blur-3xl overflow-auto custom-scrollbar p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
          <FileSpreadsheet size={20} />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white/90">Rainbow CSV Engine</h2>
          <p className="text-[10px] text-white/40 font-mono uppercase">{activePath.split(/[/\\]/).pop()}</p>
        </div>
        
        <div className="ml-auto flex items-center gap-4 text-[10px] font-bold text-white/20 uppercase tracking-tighter">
          <div className="flex items-center gap-1.5"><Table size={12} /> {data.length} Rows</div>
          <div className="flex items-center gap-1.5"><LayoutGrid size={12} /> {data[0]?.length || 0} Columns</div>
        </div>
      </div>

      <div className="min-w-max border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full border-collapse text-[12px] font-mono">
          <thead>
            <tr className="bg-white/5">
              {data[0]?.map((_, i) => (
                <th key={i} className={`px-4 py-3 text-left border-b border-white/10 uppercase tracking-widest opacity-80 ${COLUMN_COLORS[i % COLUMN_COLORS.length].split(' ')[0]}`}>
                  Col {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri} className="hover:bg-white/5 transition-colors group">
                {row.map((cell, ci) => (
                  <td key={ci} className={`px-4 py-2 border-b border-white/5 transition-all group-hover:border-white/10 ${COLUMN_COLORS[ci % COLUMN_COLORS.length]}`}>
                    {cell || <span className="opacity-10 italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 pt-8 border-t border-white/5 text-center">
        <span className="text-[9px] font-black uppercase tracking-[0.5em] opacity-10">M3Warp Sovereign Data Grid</span>
      </div>
    </div>
  );
}
