import { useState, useEffect, useRef } from 'react';
import { Search, Code, Box, ChevronRight } from 'lucide-react';
import { useStore } from '../store';
import { IntelService } from '../../bindings/m3warp/services';

import { Events } from '@wailsio/runtime';

export default function SymbolNavigator() {
  const isOpen = useStore(s => s.isSymbolNavigatorOpen);
  const toggle = useStore(s => s.toggleSymbolNavigator);
  const activeTabPath = useStore(s => s.activeTabPath);
  
  const [query, setQuery] = useState('');
  const [symbols, setSymbols] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      loadSymbols();
    }
  }, [isOpen]);

  const loadSymbols = async () => {
    if (!activeTabPath) return;
    try {
      const res = await IntelService.GetFileSymbols(activeTabPath);
      setSymbols(res || []);
      setFiltered(res || []);
    } catch (err) {
      console.error("Failed to load symbols:", err);
    }
  };


  useEffect(() => {
    const f = symbols.filter(s => 
      s.name.toLowerCase().includes(query.toLowerCase())
    );
    setFiltered(f);
    setSelectedIndex(0);
  }, [query, symbols]);

  const handleSelect = (symbol: any) => {
    Events.Emit('editor:jump-to-line', symbol.line);
    toggle();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev + 1) % filtered.length);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (filtered[selectedIndex]) handleSelect(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      toggle();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={toggle} />
      
      <div className="w-[600px] bg-[#13161a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 no-drag relative">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-white/5 bg-white/5">
          <Search size={18} className="text-cyan-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Go to symbol (@...)"
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-white/20"
          />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-white/40 uppercase font-bold tracking-widest">
            {filtered.length} Symbols
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-white/20 text-xs italic">
              No symbols found in this file
            </div>
          ) : (
            filtered.map((s, idx) => (
              <div
                key={`${s.name}-${s.line}`}
                onClick={() => handleSelect(s)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                  idx === selectedIndex ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/60 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {s.type === 'class' ? <Box size={14} className="text-purple-400 shrink-0" /> : <Code size={14} className="text-cyan-500 shrink-0" />}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{s.name}</span>
                    <span className="text-[10px] opacity-40 uppercase tracking-tighter">{s.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono opacity-40">Line {s.line}</span>
                  <ChevronRight size={14} className="opacity-20" />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-white/5 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30 uppercase font-bold tracking-tighter">
          <div className="flex gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>ESC to Close</span>
        </div>
      </div>
    </div>
  );
}
