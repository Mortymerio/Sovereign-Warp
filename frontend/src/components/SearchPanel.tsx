import { useState } from 'react';
import { Search as SearchIcon, FileText, Loader2, Brain, Zap } from 'lucide-react';
import { useStore } from '../store';
import { SearchService, EditorService } from '../../bindings/m3warp/services';

export default function SearchPanel() {
  const isOpen = useStore(s => s.isSearchPanelOpen);
  const rootPaths = useStore(s => s.rootPaths);

  const openFile = useStore(s => s.openFile);
  
  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isNeural, setIsNeural] = useState(false);
  const [stats, setStats] = useState({ files: 0, matches: 0 });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query || rootPaths.length === 0) return;

    setIsSearching(true);
    setResults([]);
    let allResults: any[] = [];
    let totalFiles = 0;

    try {
      for (const root of rootPaths) {
        const progress = isNeural 
          ? await SearchService.NeuralSearch(root, query)
          : await SearchService.SearchInFolder(root, query, false, 500);
          
        if (progress) {
          allResults = [...allResults, ...(progress.results || [])];
          totalFiles += Number(progress.filesTotal);
        }
      }
      setResults(allResults);
      setStats({ files: totalFiles, matches: allResults.length });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReplaceAll = async () => {
    if (!query || rootPaths.length === 0) return;
    if (!confirm(`Replace all occurrences of "${query}" with "${replaceText}" in the workspace?`)) return;

    setIsSearching(true);
    let total = 0;
    try {
      for (const root of rootPaths) {
        const replaced = await SearchService.ReplaceAll(root, query, replaceText, false);
        total += Number(replaced);
      }
      alert(`Replaced occurrences in ${total} files.`);
      handleSearch(new Event('submit') as any);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };



  const handleResultClick = async (res: any) => {
    const meta = await EditorService.OpenFile(res.filePath);
    if (meta) {
      const name = res.filePath.split(/[\\/]/).pop();
      openFile(res.filePath, name || 'Untitled', meta.language, meta.totalLines, meta.size);
      // Aquí podríamos añadir lógica para saltar a la línea específica
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="h-10 flex items-center justify-between px-3 border-b border-white/5 shrink-0">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Search</span>
        <button 
          onClick={() => setShowReplace(!showReplace)}
          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border transition-all ${
            showReplace ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'text-white/20 border-transparent hover:text-white/40'
          }`}
        >
          Replace
        </button>
      </div>


      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNeural(!isNeural)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${
              isNeural 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
            }`}
          >
            <Brain size={12} /> Neural
          </button>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        <form onSubmit={handleSearch} className="space-y-2">
          <div className="relative">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isNeural ? "Ask the AI where to find code..." : "Search in workspace..."}
              className={`w-full bg-black/20 border rounded px-8 py-1.5 text-xs outline-none transition-all ${
                isNeural ? 'border-purple-500/30 focus:border-purple-500' : 'border-white/10 focus:border-blue-500/50'
              }`}
            />
            {isNeural ? (
              <Zap size={14} className="absolute left-2.5 top-2 text-purple-400 animate-pulse" />
            ) : (
              <SearchIcon size={14} className="absolute left-2.5 top-2 opacity-30" />
            )}
            {isSearching && <Loader2 size={14} className="absolute right-2.5 top-2 animate-spin text-blue-500" />}
          </div>

          {showReplace && (
            <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replace with..."
                className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-1.5 text-xs outline-none focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={handleReplaceAll}
                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-500/20 transition-all"
              >
                All
              </button>
            </div>
          )}
        </form>

        {stats.files > 0 && (
          <div className="mt-2 text-[10px] opacity-40">
            Found {stats.matches} matches in {stats.files} files
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {results.map((res, i) => (
          <div
            key={i}
            onClick={() => handleResultClick(res)}
            className="px-3 py-2 hover:bg-white/5 cursor-pointer border-b border-white/5 group transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText size={12} className="text-blue-400 opacity-60" />
              <span className="text-[11px] font-bold truncate opacity-80">{res.filePath.split(/[\\/]/).pop()}</span>
              <span className="text-[9px] opacity-30 ml-auto">Ln {res.line}</span>
            </div>
            <div className="text-[11px] opacity-50 truncate font-mono bg-black/10 px-1 py-0.5 rounded">
              {res.preview}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
