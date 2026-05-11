import { useState, useEffect, useRef } from 'react';
import { Search, File, Command as CommandIcon, Box, Zap } from 'lucide-react';


import { useStore } from '../store';
import { IntelService, AIService } from '../../bindings/sovereign-warp/services';
import { Events as WailsEvents } from '@wailsio/runtime';


export default function CommandPalette() {
  const isOpen = useStore(s => s.isCommandPaletteOpen);
  const toggle = useStore(s => s.toggleCommandPalette);
  const fileTrees = useStore(s => s.fileTrees);
  const openFile = useStore(s => s.openFile);
  const activeTabPath = useStore(s => s.activeTabPath);
  const addNotification = useStore(s => s.addNotification);
  const setNeuralTheme = useStore(s => s.setNeuralTheme);

  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [symbols, setSymbols] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const flatten = (nodes: any[], results: any[]) => {
      for (const node of nodes) {
        if (!node.isDir) results.push(node);
        if (node.children) flatten(node.children, results);
      }
    };
    const allFiles: any[] = [];
    Object.values(fileTrees).forEach(tree => {
      if (tree) flatten([tree], allFiles);
    });
    setFiles(allFiles);
  }, [fileTrees]);

  const warpPoints = useStore(s => s.warpPoints);

  const isSymbolSearch = query.startsWith('@');
  const isCommandMode = query.startsWith('>');
  const isWarpMode = query.startsWith('#');
  const actualQuery = (isSymbolSearch || isCommandMode || isWarpMode) ? query.slice(1) : query;


  const toggleSidebar = useStore(s => s.toggleSidebar);
  const toggleTerminal = useStore(s => s.toggleTerminal);
  const toggleAI = useStore(s => s.toggleAISidebar);
  const toggleKnowledge = useStore(s => s.toggleKnowledgePanel);
  const toggleBrowser = useStore(s => s.toggleBrowser);

  const addWarpPoint = useStore(s => s.addWarpPoint);
  const cursorLine = useStore(s => s.cursorLine);

  const uiCommands = [
    { name: 'Warp: Create Point', action: () => {
      if (activeTabPath) {
        const name = window.prompt("Warp Point Name?");
        if (name) {
          addWarpPoint(name, activeTabPath, cursorLine);
          addNotification('success', `Warp Point '${name}' established.`);
        }
      }
    }, icon: <Zap size={16} className="text-cyan-400" /> },
    { name: 'Neural Theme: Generate', action: async () => {

      const prompt = window.prompt("Vision for the theme? (e.g. 'blood', 'forest', 'gold')");
      if (prompt) {
        addNotification('info', "Neural Engine: Visualizing design patterns...");
        const css = await AIService.GenerateTheme(prompt);
        setNeuralTheme(css);
        addNotification('success', "Neural Engine: Visual theme applied.");
      }
    }, icon: <Box size={16} className="text-purple-400" /> },
    { name: 'Toggle Project Explorer', action: toggleSidebar, icon: <Box size={16} /> },
    { name: 'Toggle Terminal', action: toggleTerminal, icon: <Box size={16} /> },
    { name: 'Toggle AI Assistant', action: toggleAI, icon: <Box size={16} /> },
    { name: 'Toggle Second Brain', action: toggleKnowledge, icon: <Box size={16} /> },
    { name: 'Toggle Web Bridge', action: toggleBrowser, icon: <Box size={16} /> },
    { name: 'Reload Window', action: () => window.location.reload(), icon: <Box size={16} /> },
  ];


  useEffect(() => {
    if (isSymbolSearch && activeTabPath) {
      IntelService.GetFileSymbols(activeTabPath).then(setSymbols);
    } else {
      setSymbols([]);
    }
  }, [query, activeTabPath]);

  const displayResults = isCommandMode
    ? uiCommands.filter(c => c.name.toLowerCase().includes(actualQuery.toLowerCase()))
    : isSymbolSearch 
      ? symbols.filter(s => s.name.toLowerCase().includes(actualQuery.toLowerCase())).slice(0, 15)
      : isWarpMode
        ? warpPoints.filter(w => w.name.toLowerCase().includes(actualQuery.toLowerCase()))
        : files.filter(f => 
            f.name.toLowerCase().includes(actualQuery.toLowerCase()) ||
            f.path.toLowerCase().includes(actualQuery.toLowerCase())
          ).slice(0, 10);


  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, displayResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + displayResults.length) % Math.max(1, displayResults.length));
    } else if (e.key === 'Enter') {
      const item = displayResults[selectedIndex];
      if (item) handleSelect(item);
    } else if (e.key === 'Escape') {
      toggle();
    }
  };

  const handleSelect = (item: any) => {
    if (isCommandMode) {
      item.action();
    } else if (isSymbolSearch) {
      WailsEvents.Emit('editor:jump-to-line', item.line);
    } else if (isWarpMode) {
      openFile(item.path, item.name.split('/').pop() || item.name, 'plaintext', 0, 0, false);
      setTimeout(() => WailsEvents.Emit('editor:jump-to-line', item.line), 200);
    } else {
      openFile(item.path, item.name, item.language || 'plaintext', 0, item.size || 0, false);
    }
    toggle();
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={toggle}>
      <div 
        className="w-full max-w-2xl bg-[#13161a]/95 border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center px-4 py-3 border-b border-white/5 bg-white/5">
          {isCommandMode ? <CommandIcon size={18} className="text-cyan-400 mr-3" /> : <Search size={18} className="text-white/40 mr-3" />}
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-white/20"
            placeholder={isCommandMode ? "Type a command..." : (isSymbolSearch ? "Find symbols in file..." : "Search files in workspace...")}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono">ESC</span>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
          {displayResults.length > 0 ? (
            displayResults.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                  idx === selectedIndex 
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                    : 'text-white/60 hover:bg-white/5 border border-transparent'
                }`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className={`p-1.5 rounded-md ${idx === selectedIndex ? 'bg-cyan-500/20' : 'bg-white/5'}`}>
                  {isCommandMode ? item.icon : isWarpMode ? <Zap size={16} className="text-cyan-400" /> : (isSymbolSearch ? <Box size={16} className="text-amber-400" /> : <File size={16} />)}
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium truncate">{item.name}</span>
                    {(isSymbolSearch || isCommandMode || isWarpMode) && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 uppercase tracking-tighter">
                        {isCommandMode ? 'Command' : isWarpMode ? 'Warp' : item.type}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] opacity-40 truncate ${idx === selectedIndex ? 'opacity-70' : ''}`}>
                    {isCommandMode ? 'M3Warp System Action' : (isSymbolSearch ? `Line ${item.line}` : isWarpMode ? `${item.path}:${item.line}` : item.path)}
                  </span>

                </div>
                {idx === selectedIndex && (
                   <span className="text-[10px] font-bold tracking-tighter text-cyan-400/50 uppercase">
                     {isCommandMode ? 'Execute' : (isSymbolSearch ? 'Jump to' : 'Open')}
                   </span>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-white/20 text-sm">No results found for "{query}"</p>
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-white/5 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30">
          <div className="flex gap-4">
            <span>↑↓ to navigate</span>
            <span>↵ to open</span>
            <span>ESC to close</span>
          </div>
          <span className="font-bold text-cyan-500/40">M3WARP CORE</span>
        </div>
      </div>
    </div>
  );
}
