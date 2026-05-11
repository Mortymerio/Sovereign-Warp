import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, X, Sparkles, RotateCcw, Settings, Key, Cpu, RefreshCw } from 'lucide-react';

import { useStore } from '../store';
import { AIService, EditorService } from '../../bindings/m3warp/services';
import { Events } from '@wailsio/runtime';

export default function AISidebar() {
  const isOpen = useStore(s => s.isAISidebarOpen);
  const toggle = useStore(s => s.toggleAISidebar);
  const messages = useStore(s => s.aiMessages);
  const addMessage = useStore(s => s.addAIMessage);
  const updateLastMessage = useStore(s => s.updateLastAIMessage);
  const clearChat = useStore(s => s.clearAI);
  const activeTabPath = useStore(s => s.activeTabPath);
  const setDiffData = useStore(s => s.setDiffData);

  const apiKey = useStore(s => s.geminiApiKey);
  const selectedModel = useStore(s => s.geminiModel);
  const availableModels = useStore(s => s.geminiModels);
  
  const setApiKey = useStore(s => s.setGeminiApiKey);
  const setSelectedModel = useStore(s => s.setGeminiModel);
  const setAvailableModels = useStore(s => s.setGeminiModels);

  const [showConfig, setShowConfig] = useState(!apiKey);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  useEffect(() => {
    const unsub = Events.On('ai:token', (ev: any) => {
      const token = typeof ev === 'string' ? ev : ev.data || ev.Data;
      updateLastMessage(token);
    });
    return () => unsub();
  }, [updateLastMessage]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const fetchModels = async () => {
    if (!apiKey) return;
    setIsFetchingModels(true);
    try {
      const models = await AIService.GetModels(apiKey);
      if (models && models.length > 0) {
        setAvailableModels(models);
        if (!models.includes(selectedModel)) {
          setSelectedModel(models[0]);
        }
      }
    } catch (err) {
      console.error("Fetch models error:", err);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!apiKey) {
      setShowConfig(true);
      return;
    }
    
    const userQuery = input;
    addMessage('user', userQuery);
    setInput('');
    const systemInstruction = "Eres M3Warp AI, un asistente experto en ingeniería de software. Sé conciso y directo. Si sugieres cambios de código, proporciona fragmentos específicos y completos dentro de bloques de código markdown (```). No es necesario que escribas todo el archivo si solo cambias una parte, pero asegúrate de que el bloque de código contenga el código que quieres que el usuario revise en la herramienta de comparación.\n\n";
    
    addMessage('assistant', '');

    try {
      let context = "";
      if (activeTabPath) {
        const tab = useStore.getState().openTabs.find(t => t.path === activeTabPath);
        const cursorLine = useStore.getState().cursorLine;
        const cursorCol = useStore.getState().cursorCol;
        
        // Fetch current file content chunk
        const startLine = Math.max(1, cursorLine - 200);
        const endLine = cursorLine + 200;
        const chunk = await EditorService.ReadLines(activeTabPath, startLine, endLine);
        
        if (chunk && chunk.lines) {
          context = `\n\n[USER CONTEXT]:
File: ${activeTabPath}
Language: ${tab?.language || 'unknown'}
Cursor: Line ${cursorLine}, Column ${cursorCol}

[FILE CONTENT CHUNK (Lines ${startLine}-${startLine + chunk.lines.length - 1})]:
${chunk.lines.join('\n')}
\n`;
        }
      }

      setIsLoading(true);
      await AIService.Chat(apiKey, selectedModel, systemInstruction + userQuery + context);
    } catch (err) {
      console.error("AI Error:", err);
      updateLastMessage("Lo siento, tuve un error procesando tu solicitud. Revisa la conexión con el motor de IA.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-80 glass-panel border-l border-white/10 flex flex-col panel-transition z-[100] ${isOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'}`}>

      <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Bot size={16} />
          </div>
          <span className="text-xs font-bold tracking-widest text-white/80 uppercase">Cyber Assistant</span>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => setShowConfig(!showConfig)} 
            className={`p-1.5 rounded transition-colors ${showConfig ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/5 text-white/40 hover:text-white'}`}
          >
            <Settings size={14} />
          </button>
          <button onClick={clearChat} title="Clear Chat" className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
          <button onClick={toggle} className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="p-4 bg-cyan-500/5 border-b border-white/5 space-y-3 animate-in slide-in-from-top duration-300">
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[9px] font-bold text-white/40 uppercase tracking-wider">
              <Key size={10} /> Gemini API Key
            </label>
            <div className="flex gap-2">
              <input 
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Paste your key..."
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white outline-none focus:border-cyan-500/40"
              />
              <button 
                onClick={fetchModels}
                disabled={isFetchingModels || !apiKey}
                className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-cyan-400 transition-all disabled:opacity-30"
              >
                <RefreshCw size={14} className={isFetchingModels ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[9px] font-bold text-white/40 uppercase tracking-wider">
              <Cpu size={10} /> Neural Model
            </label>
            <select 
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white outline-none focus:border-cyan-500/40 appearance-none cursor-pointer"
            >
              {availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
            <Sparkles size={40} className="text-cyan-400" />
            <p className="text-xs px-8">Ask me anything about your project. I can help with refactoring, debugging, or explaining code.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
              <div className={`flex items-center gap-2 mb-1 opacity-40 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                <span className="text-[10px] font-bold uppercase tracking-tighter">{msg.role}</span>
              </div>
              <div className={`group relative max-w-[95%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600/20 text-blue-100 rounded-tr-none border border-blue-500/20' 
                  : 'bg-white/5 text-white/80 rounded-tl-none border border-white/5'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                
                {msg.role === 'assistant' && msg.content.includes('```') && (
                  <button 
                    onClick={() => {
                      const codeMatch = msg.content.match(/```(?:\w+)?\n([\s\S]*?)```/);
                      if (codeMatch && codeMatch[1]) {
                        const original = (window as any).monacoEditorInstance?.getValue() || '';
                        setDiffData({ original, modified: codeMatch[1] });
                      }
                    }}
                    className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg transition-all text-[10px] font-bold"
                  >
                    <RotateCcw size={12} />
                    COMPARE CHANGES
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-white/5 border-t border-white/5">
        <div className="relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={apiKey ? "Type your message..." : "Configure API Key first..."}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 pr-10 text-xs text-white placeholder-white/20 outline-none focus:border-cyan-500/50 transition-all resize-none h-20 custom-scrollbar"
          />
          <button 
            onClick={handleSend}
            disabled={!apiKey || isLoading}
            className="absolute right-2 bottom-2 p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-lg shadow-cyan-900/40 transition-all active:scale-95 disabled:opacity-30 disabled:bg-gray-600"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="mt-2 text-[9px] text-center text-white/20">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}
