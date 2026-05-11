import { Files, Search, Settings, Command, Terminal, Bot, Brain, Globe, Focus, Clock, Shield, GitGraph } from 'lucide-react';

import { useStore } from '../store';

export default function ActivityBar() {
  const isSidebarOpen = useStore(s => s.isSidebarOpen);
  const isSearchOpen = useStore(s => s.isSearchPanelOpen);
  const isTerminalOpen = useStore(s => s.isTerminalOpen);
  const isAISidebarOpen = useStore(s => s.isAISidebarOpen);
  const isKnowledgeOpen = useStore(s => s.isKnowledgePanelOpen);
  const isBrowserOpen = useStore(s => s.isBrowserOpen);
  const isZenMode = useStore(s => s.isZenMode);
  const isHistoryOpen = useStore(s => s.isHistoryOpen);
  const isSecurityOpen = useStore(s => s.isSecurityPanelOpen);
  const isProjectPulseOpen = useStore(s => s.isProjectPulseOpen);
  
  const toggleSidebar = useStore(s => s.toggleSidebar);
  const toggleSearch = useStore(s => s.toggleSearchPanel);
  const toggleTerminal = useStore(s => s.toggleTerminal);
  const toggleAI = useStore(s => s.toggleAISidebar);
  const toggleKnowledge = useStore(s => s.toggleKnowledgePanel);
  const toggleBrowser = useStore(s => s.toggleBrowser);
  const toggleZenMode = useStore(s => s.toggleZenMode);
  const toggleHistory = useStore(s => s.toggleHistory);
  const toggleSecurity = useStore(s => s.toggleSecurityPanel);
  const toggleProjectPulse = useStore(s => s.toggleProjectPulse);







  const showExplorer = () => {
    if (isSearchOpen) toggleSearch();
    if (!isSidebarOpen) toggleSidebar();
  };

  const showSearch = () => {
    if (isSidebarOpen) toggleSidebar();
    if (!isSearchOpen) toggleSearch();
  };

  return (
    <div className="w-12 h-full bg-[#0d1013]/80 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-4 gap-4 shrink-0 select-none z-10">
      <div className="mb-4 relative group cursor-pointer">
        <div className="w-6 h-6 bg-cyan-500 rounded-sm rotate-45 shadow-[0_0_15px_rgba(0,242,255,0.4)] group-hover:rotate-[135deg] transition-all duration-700" />
        <div className="absolute inset-0 bg-cyan-400 blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
      </div>

      <button 
        onClick={showExplorer}
        className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 ${isSidebarOpen && !isSearchOpen ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,242,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
        title="Explorer"
      >
        <Files size={22} strokeWidth={1.5} />
      </button>

      <button 
        onClick={showSearch}
        className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 ${isSearchOpen ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,242,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
        title="Global Search"
      >
        <Search size={22} strokeWidth={1.5} />
      </button>

      <button 
        onClick={toggleTerminal}
        className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 ${isTerminalOpen ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,242,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
        title="Terminal (Ctrl+J)"
      >
        <Terminal size={22} strokeWidth={1.5} />
      </button>

      <button 
        onClick={toggleAI}
        className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 ${isAISidebarOpen ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,242,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
        title="AI Assistant (Ctrl+Shift+A)"
      >
        <Bot size={22} strokeWidth={1.5} />
      </button>

      <button 
        onClick={toggleKnowledge}
        className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 ${isKnowledgeOpen ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,242,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
        title="Second Brain (Ctrl+Shift+K)"
      >
        <Brain size={22} strokeWidth={1.5} />
      </button>

      <button 
        onClick={toggleBrowser}
        className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 ${isBrowserOpen ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,242,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
        title="Web Bridge (Ctrl+Shift+B)"
      >
        <Globe size={22} strokeWidth={1.5} />
      </button>

      <button 
        onClick={toggleZenMode}
        className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 ${isZenMode ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,242,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
        title="Zen Mode (Ctrl+Alt+Z)"
      >
        <Focus size={22} strokeWidth={1.5} />
      </button>

      <button 
        onClick={toggleHistory}
        className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 ${isHistoryOpen ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,242,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
        title="Local History (Ctrl+Shift+H)"
      >
        <Clock size={22} strokeWidth={1.5} />
      </button>

      <button 
        onClick={toggleProjectPulse}
        className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 ${isProjectPulseOpen ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,242,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
        title="Project Pulse (Git Lens)"
      >
        <GitGraph size={22} strokeWidth={1.5} />
      </button>








      <button 
        onClick={toggleSecurity}
        className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 ${isSecurityOpen ? 'text-rose-400 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
        title="PathGuard Security"
      >
        <Shield size={22} strokeWidth={1.5} />
      </button>

      <div className="mt-auto flex flex-col gap-4 items-center opacity-40 hover:opacity-100 transition-opacity">

        <button className="p-2 text-gray-500 hover:text-white">
          <Command size={20} />
        </button>
        <button 
          onClick={useStore.getState().toggleSettings}
          className="p-2 text-gray-500 hover:text-white transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
}

