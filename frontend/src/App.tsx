import { useEffect } from 'react';
import { useStore } from './store';
import FileExplorer from './components/FileExplorer';
import MonacoEditor from './components/MonacoEditor';
import TabBar from './components/TabBar';
import SearchPanel from './components/SearchPanel';
import StatusBar from './components/StatusBar';
import CommandPalette from './components/CommandPalette';
import ActivityBar from './components/ActivityBar';
import TerminalPanel from './components/TerminalPanel';
import Breadcrumbs from './components/Breadcrumbs';
import AISidebar from './components/AISidebar';
import KnowledgePanel from './components/KnowledgePanel';
import BrowserPreview from './components/BrowserPreview';
import DiffViewer from './components/DiffViewer';
import SymbolNavigator from './components/SymbolNavigator';
import HistoryPanel from './components/HistoryPanel';
import NotificationOverlay from './components/NotificationOverlay';
import MarkdownPreview from './components/MarkdownPreview';
import CSVPreview from './components/CSVPreview';
import SecurityPanel from './components/SecurityPanel';
import ProjectPulse from './components/ProjectPulse';
import SovereignDashboard from './components/SovereignDashboard';
import SettingsPanel from './components/SettingsPanel';

import { EditorService, ExtensionService } from '../bindings/sovereign-warp/services';
import { Events as WailsEvents } from '@wailsio/runtime';
import { Window } from '@wailsio/runtime';

export default function App() {
  const isSidebarOpen = useStore(s => s.isSidebarOpen);
  const sidebarWidth = useStore(s => s.sidebarWidth);
  const activeTab = useStore(s => s.openTabs.find(t => t.path === s.activeTabPath));
  const activeTabPath = useStore(s => s.activeTabPath);
  const isTerminalOpen = useStore(s => s.isTerminalOpen);
  const toggleCommandPalette = useStore(s => s.toggleCommandPalette);
  const diffData = useStore(s => s.diffData);
  const setDiffData = useStore(s => s.setDiffData);

  const toggleSidebar = useStore(s => s.toggleSidebar);
  const toggleTerminal = useStore(s => s.toggleTerminal);
  const toggleAI = useStore(s => s.toggleAISidebar);
  const toggleKnowledge = useStore(s => s.toggleKnowledgePanel);
  const toggleBrowser = useStore(s => s.toggleBrowser);
  const toggleZenMode = useStore(s => s.toggleZenMode);
  const toggleSymbolNavigator = useStore(s => s.toggleSymbolNavigator);
  const toggleHistory = useStore(s => s.toggleHistory);
  const rootPaths = useStore(s => s.rootPaths);
  const addNotification = useStore(s => s.addNotification);
  const neuralThemeCSS = useStore(s => s.neuralThemeCSS);
  const isZenMode = useStore(s => s.isZenMode);

  // Phase XII: Extension Bridge Loader
  useEffect(() => {
    if (rootPaths.length > 0) {
      ExtensionService.LoadExtensions(rootPaths[0]).then(exts => {
        if (exts && exts.length > 0) {
          exts.forEach(script => {
            try {
              // Sovereign Extension Execution
              eval(script);
            } catch (err) {
              console.error("Extension error:", err);
            }
          });
          addNotification('info', `Extension Bridge: ${exts.length} scripts active.`);
        }
      });
    }
  }, [rootPaths]);

  // Global Key Bindings
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Local History (Ctrl+Shift+H)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        toggleHistory();
      }

      // Symbol Navigator (Ctrl+Shift+O)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        toggleSymbolNavigator();
      }

      // Zen Mode (Ctrl+Alt+Z)
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        toggleZenMode();
      }

      // Command Palette (Ctrl+P)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        toggleCommandPalette();
      }
      
      // Sidebar (Ctrl+B)
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      // Terminal (Ctrl+J)
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault();
        toggleTerminal();
      }

      // AI Sidebar (Ctrl+Shift+A)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        toggleAI();
      }

      // Second Brain (Ctrl+Shift+K)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        toggleKnowledge();
      }

      // Web Bridge (Ctrl+Shift+B)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        toggleBrowser();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [toggleCommandPalette, toggleSidebar, toggleTerminal, toggleAI, toggleKnowledge, toggleBrowser, toggleSymbolNavigator, toggleHistory, toggleZenMode]);

  const handleAcceptDiff = async (newContent: string) => {
    if (activeTabPath) {
      await EditorService.SaveFile(activeTabPath, newContent);
      WailsEvents.Emit('editor:refresh');
    }
    setDiffData(null);
  };

  return (
    <div className={`h-screen w-screen bg-[#0a0c0e] text-white flex flex-col overflow-hidden font-sans selection:bg-cyan-500/30 ${isZenMode ? 'zen-mode' : ''}`}>
      <style>{neuralThemeCSS}</style>
      
      {/* Sovereign Grip: Persistent Drag Handle */}
      <div 
        style={{ "--wails-drop-target": "main" } as any} 
        className="h-1 w-full shrink-0 z-[2000] absolute top-0 left-0" 
      />

      {/* Custom Titlebar */}
      <div 
        className="h-8 flex items-center px-4 bg-[#0d1013] border-b border-white/5 shrink-0 select-none"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-2 mr-4">
          <div className="w-3 h-3 bg-cyan-500 rounded-sm rotate-45 shadow-[0_0_10px_rgba(0,242,255,0.5)]" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-80">Sovereign Warp</span>
        </div>
        
        <div className="flex-1 flex justify-center text-[11px] opacity-40 font-medium">
          {activeTab ? activeTab.name : 'Warp IDE'}
        </div>
        
        <div className="ml-auto flex gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button onClick={() => Window.Minimise()} className="w-8 h-8 hover:bg-white/5 flex items-center justify-center transition-colors">
            <svg width="10" height="1" viewBox="0 0 10 1" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="10" height="1" fill="currentColor" fillOpacity="0.4"/>
            </svg>
          </button>
          <button onClick={() => Window.ToggleMaximise()} className="w-8 h-8 hover:bg-white/5 flex items-center justify-center transition-colors">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeOpacity="0.4"/>
            </svg>
          </button>
          <button onClick={() => Window.Close()} className="w-8 h-8 hover:bg-red-500/80 flex items-center justify-center transition-colors group">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:text-white">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {!isZenMode && <ActivityBar />}
        
        {!isZenMode && isSidebarOpen && (
          <div 
            className="flex flex-col border-r border-white/5 bg-[#0d1013]/95 backdrop-blur-xl relative"
            style={{ width: sidebarWidth }}
          >
            <FileExplorer />
            <SearchPanel />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col relative bg-[#0f1115]">
          {!isZenMode && <TabBar />}
          {!isZenMode && <Breadcrumbs />}
          
          <div className="flex-1 relative overflow-hidden animate-in fade-in duration-500">
            {activeTab ? (
              <>
                <MonacoEditor
                  key={activeTab.path}
                  filePath={activeTab.path}
                  language={activeTab.language}
                  totalLines={activeTab.totalLines}
                />
                <MarkdownPreview />
                <CSVPreview />
              </>
            ) : (
              <SovereignDashboard />
            )}
          </div>
          {isTerminalOpen && <TerminalPanel />}
        </div>
        
        <AISidebar />
        <ProjectPulse />
        <KnowledgePanel />
        <BrowserPreview />
      </div>

      {diffData && (
        <DiffViewer 
          original={diffData.original}
          modified={diffData.modified}
          onAccept={handleAcceptDiff}
          onClose={() => setDiffData(null)}
        />
      )}

      <StatusBar />
      <HistoryPanel />
      <CommandPalette />
      <SymbolNavigator />
      <NotificationOverlay />
      <SecurityPanel />
      <SettingsPanel />
    </div>
  );
}
