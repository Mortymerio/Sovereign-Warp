import { useState, useEffect } from 'react';
import { ChevronRight, Folder, FileCode, Eye, Zap } from 'lucide-react';
import { useStore } from '../store';
import { IntelService, FilesystemService, EditorService } from '../../bindings/m3warp/services';
import FileIcon from './FileIcon';

interface Sibling {
  name: string;
  path: string;
  isDir: boolean;
}

export default function Breadcrumbs() {
  const activeTabPath = useStore(s => s.activeTabPath);
  const isPreviewOpen = useStore(s => s.isMarkdownPreviewOpen);
  const togglePreview = useStore(s => s.toggleMarkdownPreview);
  const cursorLine = useStore(s => s.cursorLine);
  const openFile = useStore(s => s.openFile);
  
  const [currentSymbol, setCurrentSymbol] = useState<string | null>(null);
  const [allSymbols, setAllSymbols] = useState<any[]>([]);
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false);
  const [dropdown, setDropdown] = useState<{ index: number, siblings: Sibling[] } | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const handleTeleport = async (path: string, isDir: boolean) => {
    if (isDir) return;
    const meta = await EditorService.OpenFile(path);
    if (meta) {
      const name = path.split(/[\\/]/).pop() || 'Untitled';
      openFile(path, name, meta.language, meta.totalLines, meta.size, true);
    }
    setDropdown(null);
    setFilterQuery('');
  };

  const jumpToSymbol = (line: number) => {
    (window as any).runtime.EventsEmit('editor:jump-to-line', line);
    setIsSymbolDropdownOpen(false);
  };

  const showSiblings = async (index: number) => {
    setIsSymbolDropdownOpen(false);
    if (dropdown?.index === index || !activeTabPath) {
      setDropdown(null);
      setFilterQuery('');
      return;
    }
    setFilterQuery('');
    const parts = activeTabPath.split(/[\\/]/).filter(p => p);
    const parentPath = parts.slice(0, index + 1).join('/'); // Ojo con Windows vs Unix
    const tree = await FilesystemService.OpenFolder(parentPath);
    if (tree && tree.children) {
      setDropdown({ index, siblings: tree.children as any });
    }
  };

  useEffect(() => {
    if (activeTabPath) {
      IntelService.GetFileSymbols(activeTabPath).then(symbols => {
        if (!symbols) {
          setCurrentSymbol(null);
          setAllSymbols([]);
          return;
        }
        setAllSymbols(symbols);

        // Buscar el símbolo más profundo que contiene la línea actual
        const sym = symbols
          .filter((s: any) => s.line <= cursorLine)
          .sort((a: any, b: any) => b.line - a.line)[0];
        setCurrentSymbol(sym ? sym.name : null);
      });
    }
  }, [activeTabPath, cursorLine]);

  if (!activeTabPath) return null;

  const fullParts = activeTabPath.split(/[\\/]/).filter(p => p);
  const fileName = fullParts.pop();
  const isMD = fileName?.toLowerCase().endsWith('.md');

  return (
    <div className="h-8 flex items-center px-4 bg-[#0f1115] border-b border-white/5 text-[10px] text-white/40 overflow-x-auto no-scrollbar select-none">
      <div className="flex items-center gap-1.5 shrink-0 group">
        <Folder size={12} className="text-cyan-500/50 group-hover:text-cyan-400 transition-colors" />
        <span className="hover:text-white cursor-pointer transition-colors font-medium">Workspace</span>
      </div>
      
      {fullParts.map((part, i) => (
        <div key={i} className="flex items-center gap-1.5 shrink-0 group relative">
          <ChevronRight size={10} className="mx-0.5 opacity-20" />
          <span 
            onClick={() => showSiblings(i)}
            className="hover:text-cyan-400 cursor-pointer transition-colors px-1 rounded hover:bg-white/5"
          >
            {part}
          </span>
          
          {dropdown?.index === i && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#1a1d21]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-2 py-1.5 border-b border-white/5">
                <input 
                  autoFocus
                  placeholder="Filter siblings..."
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none focus:border-cyan-500/50 transition-all"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  value={filterQuery}
                />
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {dropdown.siblings
                  .filter(s => s.name.toLowerCase().includes(filterQuery.toLowerCase()))
                  .map(sib => (
                    <div 
                      key={sib.path}
                      onClick={() => handleTeleport(sib.path, sib.isDir)}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 cursor-pointer text-[11px] text-white/60 hover:text-white transition-colors"
                    >
                      {sib.isDir ? <Folder size={12} className="text-blue-400" /> : <FileIcon name={sib.name} size={12} />}
                      <span className="truncate">{sib.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ))}


      {fileName && (
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          <ChevronRight size={10} className="mx-0.5 opacity-20" />
          <FileCode size={12} className="text-blue-400/50" />
          <span className="text-white/80 font-bold tracking-tight">{fileName}</span>
        </div>
      )}

      {currentSymbol && (
        <div className="flex items-center gap-1.5 shrink-0 ml-1 animate-in fade-in slide-in-from-left-2 duration-300 relative">
          <ChevronRight size={10} className="mx-0.5 opacity-20" />
          <div 
            onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
            className="flex items-center gap-1.5 cursor-pointer hover:bg-white/5 px-1.5 py-0.5 rounded transition-all group"
          >
            <Zap size={10} className="text-amber-400/60 group-hover:text-amber-400" />
            <span className="text-amber-400/80 font-medium group-hover:text-amber-300">{currentSymbol}</span>
          </div>

          {isSymbolDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#1a1d21]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-3 py-1.5 border-b border-white/5 text-[9px] font-bold text-white/20 uppercase tracking-widest">
                Jump to Symbol
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {allSymbols.map((s, idx) => (
                  <div 
                    key={idx}
                    onClick={() => jumpToSymbol(s.line)}
                    className={`flex items-center justify-between px-3 py-2 hover:bg-white/5 cursor-pointer transition-colors ${s.name === currentSymbol ? 'bg-cyan-500/10 text-cyan-400' : 'text-white/60'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded bg-white/5 ${s.type === 'func' ? 'text-amber-400' : 'text-purple-400'}`}>
                        <Zap size={10} />
                      </div>
                      <span className="text-[11px] font-medium truncate max-w-[140px]">{s.name}</span>
                    </div>
                    <span className="text-[9px] opacity-30">Ln {s.line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isMD && (
        <button 
          onClick={togglePreview}
          className={`ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all ${
            isPreviewOpen 
              ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
              : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          <Eye size={12} className={isPreviewOpen ? 'animate-pulse' : ''} />
          <span className="text-[9px] font-black uppercase tracking-widest">Preview</span>
        </button>
      )}
    </div>
  );
}

