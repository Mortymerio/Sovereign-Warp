import { create } from 'zustand';

interface OpenTab {
  path: string;
  name: string;
  language: string;
  isDirty: boolean;
  totalLines: number;
  fileSize: number;
  isPreview?: boolean;
}


interface SearchResult {
  filePath: string;
  line: number;
  column: number;
  preview: string;
  match: string;
}

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  children?: FileNode[];
  language?: string;
}

interface AppState {
  // Workspace
  rootPaths: string[];
  fileTrees: Record<string, FileNode>;
  
  // Tabs

  openTabs: OpenTab[];
  activeTabPath: string | null;
  
  // Editor
  cursorLine: number;
  cursorCol: number;
  
  // Search
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  
  // UI
  theme: string;
  isSidebarOpen: boolean;
  isSearchPanelOpen: boolean;
  isCommandPaletteOpen: boolean;
  isAISidebarOpen: boolean;
  isKnowledgePanelOpen: boolean;
  isBrowserOpen: boolean;
  isTerminalOpen: boolean;
  isZenMode: boolean;
  isSymbolNavigatorOpen: boolean;
  isHistoryOpen: boolean;
  isMarkdownPreviewOpen: boolean;
  neuralThemeCSS: string;
  extensions: string[];
  warpPoints: { name: string, path: string, line: number }[];
  restrictedPaths: string[];
  isSecurityPanelOpen: boolean;
  isProjectPulseOpen: boolean;
  isParticlesEnabled: boolean;
  isSettingsOpen: boolean;
  geminiApiKey: string;
  geminiModel: string;
  geminiModels: string[];
  previewUrl: string;






  diffData: { original: string, modified: string } | null;
  sidebarWidth: number;
  fontSize: number;
  isVimMode: boolean;
  aiMessages: { role: 'user' | 'assistant', content: string }[];
  notifications: { id: string, type: 'info' | 'success' | 'warning' | 'error', message: string }[];
  
  // Actions
  addNotification: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  removeNotification: (id: string) => void;
  setRootPaths: (paths: string[]) => void;

  addRootPath: (path: string) => void;
  removeRootPath: (path: string) => void;
  updateFileTree: (root: string, tree: FileNode) => void;

  toggleTerminal: () => void;
  openFile: (path: string, name: string, lang: string, totalLines: number, size: number, isPreview?: boolean) => void;
  fixTab: (path: string) => void;

  toggleVimMode: () => void;
  toggleParticles: () => void;
  toggleSettings: () => void;
  setGeminiApiKey: (key: string) => void;
  setGeminiModel: (model: string) => void;
  setGeminiModels: (models: string[]) => void;
  toggleAISidebar: () => void;
  toggleKnowledgePanel: () => void;
  toggleBrowser: () => void;
  toggleZenMode: () => void;
  toggleSymbolNavigator: () => void;
  toggleHistory: () => void;
  toggleMarkdownPreview: () => void;
  toggleSecurityPanel: () => void;
  toggleProjectPulse: () => void;
  addWarpPoint: (name: string, path: string, line: number) => void;
  removeWarpPoint: (name: string) => void;
  setRestrictedPaths: (paths: string[]) => void;
  setNeuralTheme: (css: string) => void;

  setPreviewUrl: (url: string) => void;





  setDiffData: (data: { original: string, modified: string } | null) => void;
  addAIMessage: (role: 'user' | 'assistant', content: string) => void;
  updateLastAIMessage: (content: string) => void;
  clearAI: () => void;







  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
  markDirty: (path: string, dirty: boolean) => void;
  setCursor: (line: number, col: number) => void;
  setSearchQuery: (q: string) => void;
  setSearchResults: (r: SearchResult[]) => void;
  setTheme: (t: string) => void;
  toggleSidebar: () => void;
  toggleSearchPanel: () => void;
  toggleCommandPalette: () => void;
  setFontSize: (s: number) => void;
  setSidebarWidth: (w: number) => void;
}


export const useStore = create<AppState>((set, get) => ({
  rootPaths: [],
  fileTrees: {},
  openTabs: JSON.parse(localStorage.getItem('warp-openTabs') || '[]'),

  activeTabPath: localStorage.getItem('warp-activeTab'),
  cursorLine: 1,
  cursorCol: 1,
  searchQuery: '',

  searchResults: [],
  isSearching: false,
  theme: localStorage.getItem('warp-theme') || 'cyber-ronin',
  isSidebarOpen: true,
  isSearchPanelOpen: false,
  isCommandPaletteOpen: false,
  isAISidebarOpen: false,
  isKnowledgePanelOpen: false,
  isBrowserOpen: false,
  isTerminalOpen: false,
  isZenMode: false,
  isSymbolNavigatorOpen: false,
  isHistoryOpen: false,
  isMarkdownPreviewOpen: false,
  neuralThemeCSS: '',
  extensions: [],
  warpPoints: [],
  restrictedPaths: [],
  isSecurityPanelOpen: false,
  isProjectPulseOpen: false,
  isParticlesEnabled: localStorage.getItem('warp-particles') !== 'false',
  isSettingsOpen: false,
  geminiApiKey: localStorage.getItem('warp-gemini-key') || '',
  geminiModel: localStorage.getItem('warp-gemini-model') || 'gemini-1.5-flash',
  geminiModels: JSON.parse(localStorage.getItem('warp-gemini-models') || '["gemini-1.5-flash", "gemini-1.5-pro"]'),
  previewUrl: 'http://localhost:5173',





  diffData: null,
  sidebarWidth: parseInt(localStorage.getItem('warp-sidebarWidth') || '260'),
  fontSize: parseInt(localStorage.getItem('warp-fontSize') || '14'),
  isVimMode: localStorage.getItem('warp-vimMode') === 'true',
  aiMessages: [],
  notifications: [],

  addNotification: (type, message) => {
    const id = Math.random().toString(36).substring(7);
    set(s => ({ notifications: [...s.notifications, { id, type, message }] }));
    setTimeout(() => get().removeNotification(id), 5000);
  },
  removeNotification: (id) => set(s => ({ 
    notifications: s.notifications.filter(n => n.id !== id) 
  })),




  setRootPaths: (paths) => set({ rootPaths: paths }),
  addRootPath: (path) => set(s => ({ 
    rootPaths: s.rootPaths.includes(path) ? s.rootPaths : [...s.rootPaths, path] 
  })),
  removeRootPath: (path) => set(s => ({ 
    rootPaths: s.rootPaths.filter(p => p !== path) 
  })),
  updateFileTree: (root, tree) => set(s => ({ 
    fileTrees: { ...s.fileTrees, [root]: tree } 
  })),

  
  toggleTerminal: () => set(s => ({ isTerminalOpen: !s.isTerminalOpen })),
  toggleZenMode: () => set(s => ({ isZenMode: !s.isZenMode })),
  toggleSymbolNavigator: () => set(s => ({ isSymbolNavigatorOpen: !s.isSymbolNavigatorOpen })),
  toggleHistory: () => set(s => ({ isHistoryOpen: !s.isHistoryOpen })),
  toggleParticles: () => set(s => {
    const newVal = !s.isParticlesEnabled;
    localStorage.setItem('warp-particles', String(newVal));
    return { isParticlesEnabled: newVal };
  }),
  toggleSettings: () => set(s => ({ isSettingsOpen: !s.isSettingsOpen })),
  setGeminiApiKey: (key) => {
    localStorage.setItem('warp-gemini-key', key);
    set({ geminiApiKey: key });
  },
  setGeminiModel: (model) => {
    localStorage.setItem('warp-gemini-model', model);
    set({ geminiModel: model });
  },
  setGeminiModels: (models) => {
    localStorage.setItem('warp-gemini-models', JSON.stringify(models));
    set({ geminiModels: models });
  },
  toggleAISidebar: () => set(s => ({ isAISidebarOpen: !s.isAISidebarOpen })),


  toggleKnowledgePanel: () => set(s => ({ isKnowledgePanelOpen: !s.isKnowledgePanelOpen })),
  toggleBrowser: () => set(s => ({ isBrowserOpen: !s.isBrowserOpen })),
  toggleMarkdownPreview: () => set(s => ({ isMarkdownPreviewOpen: !s.isMarkdownPreviewOpen })),
  toggleSecurityPanel: () => set(s => ({ isSecurityPanelOpen: !s.isSecurityPanelOpen })),
  toggleProjectPulse: () => set(s => ({ isProjectPulseOpen: !s.isProjectPulseOpen })),
  addWarpPoint: (name, path, line) => set(s => ({ warpPoints: [...s.warpPoints, { name, path, line }] })),
  removeWarpPoint: (name) => set(s => ({ warpPoints: s.warpPoints.filter(w => w.name !== name) })),
  setRestrictedPaths: (paths) => set({ restrictedPaths: paths }),
  setNeuralTheme: (css) => set({ neuralThemeCSS: css }),

  setPreviewUrl: (url) => set({ previewUrl: url }),

  setDiffData: (data) => set({ diffData: data }),

  addAIMessage: (role, content) => set(s => ({ aiMessages: [...s.aiMessages, { role, content }] })),
  updateLastAIMessage: (content) => set(s => {
    const last = s.aiMessages[s.aiMessages.length - 1];
    if (last && last.role === 'assistant') {
      return {
        aiMessages: [
          ...s.aiMessages.slice(0, -1),
          { ...last, content: last.content + content }
        ]
      };
    }
    return { aiMessages: [...s.aiMessages, { role: 'assistant', content }] };
  }),
  clearAI: () => set({ aiMessages: [] }),




  openFile: (path: string, name: string, lang: string, totalLines: number, size: number, isPreview = false) => {
    const { openTabs } = get();
    const existingIndex = openTabs.findIndex(t => t.path === path);
    
    if (existingIndex !== -1) {
      const updatedTabs = [...openTabs];
      if (!isPreview && updatedTabs[existingIndex].isPreview) {
        updatedTabs[existingIndex].isPreview = false;
      }
      set({ openTabs: updatedTabs, activeTabPath: path });
      localStorage.setItem('warp-activeTab', path);
      localStorage.setItem('warp-openTabs', JSON.stringify(updatedTabs));
      return;
    }

    let updatedTabs = [...openTabs];
    if (isPreview) {
      const previewIndex = updatedTabs.findIndex(t => t.isPreview);
      if (previewIndex !== -1) {
        updatedTabs[previewIndex] = { path, name, language: lang, isDirty: false, totalLines, fileSize: size, isPreview: true };
      } else {
        updatedTabs.push({ path, name, language: lang, isDirty: false, totalLines, fileSize: size, isPreview: true });
      }
    } else {
      updatedTabs.push({ path, name, language: lang, isDirty: false, totalLines, fileSize: size, isPreview: false });
    }

    localStorage.setItem('warp-openTabs', JSON.stringify(updatedTabs));
    localStorage.setItem('warp-activeTab', path);
    set({ 
      openTabs: updatedTabs,
      activeTabPath: path 
    });
  },

  fixTab: (path) => set(s => {
    const newTabs = s.openTabs.map(t => t.path === path ? { ...t, isPreview: false } : t);
    localStorage.setItem('warp-openTabs', JSON.stringify(newTabs));
    return { openTabs: newTabs };
  }),


  closeTab: (path) => {
    const { openTabs, activeTabPath } = get();
    const filtered = openTabs.filter(t => t.path !== path);
    let newActive = activeTabPath;
    if (activeTabPath === path) {
      newActive = filtered.length > 0 ? filtered[filtered.length - 1].path : null;
    }
    localStorage.setItem('warp-openTabs', JSON.stringify(filtered));
    localStorage.setItem('warp-activeTab', newActive || '');
    set({ openTabs: filtered, activeTabPath: newActive });
  },

  setActiveTab: (path) => {
    localStorage.setItem('warp-activeTab', path);
    set({ activeTabPath: path });
  },

  markDirty: (path, dirty) => set(s => ({
    openTabs: s.openTabs.map(t => t.path === path ? { ...t, isDirty: dirty } : t)
  })),
  setCursor: (line, col) => set({ cursorLine: line, cursorCol: col }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchResults: (r) => set({ searchResults: r, isSearching: false }),
  setTheme: (t) => { localStorage.setItem('warp-theme', t); set({ theme: t }); },
  toggleSidebar: () => set(s => ({ isSidebarOpen: !s.isSidebarOpen })),
  toggleSearchPanel: () => set(s => ({ isSearchPanelOpen: !s.isSearchPanelOpen })),
  toggleCommandPalette: () => set(s => ({ isCommandPaletteOpen: !s.isCommandPaletteOpen })),
  setFontSize: (s) => { localStorage.setItem('warp-fontSize', String(s)); set({ fontSize: s }); },
  setSidebarWidth: (w) => { localStorage.setItem('warp-sidebarWidth', String(w)); set({ sidebarWidth: w }); },
  toggleVimMode: () => {
    const newVal = !get().isVimMode;
    localStorage.setItem('warp-vimMode', String(newVal));
    set({ isVimMode: newVal });
  },
}));


