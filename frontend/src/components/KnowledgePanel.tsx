import { useState, useEffect } from 'react';
import { Brain, Save, Link as LinkIcon, FileText, Plus, X, Sparkles, Eye, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../store';
import { KnowledgeService, EditorService } from '../../bindings/sovereign-warp/services';

export default function KnowledgePanel() {
  const isOpen = useStore(s => s.isKnowledgePanelOpen);
  const toggle = useStore(s => s.toggleKnowledgePanel);
  const activeTabPath = useStore(s => s.activeTabPath);
  
  const [node, setNode] = useState<any>(null);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);


  useEffect(() => {
    if (isOpen && activeTabPath) {
      loadKnowledge();
    }
  }, [isOpen, activeTabPath]);

  const loadKnowledge = async () => {
    try {
      const data = await KnowledgeService.GetNode(activeTabPath!);
      setNode(data);
      if (data?.notePath) {
        const chunk = await EditorService.ReadLines(data.notePath, 1, 1000);
        if (chunk && chunk.lines) {
          setContent(chunk.lines.join('\n'));
        }
      } else {

        setContent('');
      }
    } catch (err) {
      console.error("Failed to load knowledge:", err);
    }
  };

  const handleCreateNote = async () => {
    if (!activeTabPath) return;
    const notePath = activeTabPath + '.md';
    try {
      await EditorService.SaveFile(notePath, `# Documentation: ${activeTabPath}\n\nAdd your notes here...`);
      await KnowledgeService.LinkNote(activeTabPath, notePath);
      loadKnowledge();
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  };

  const handleSave = async () => {
    if (!node?.notePath) return;
    setIsSaving(true);
    try {
      await EditorService.SaveFile(node.notePath, content);
      setTimeout(() => setIsSaving(false), 1000);
    } catch (err) {
      console.error("Failed to save note:", err);
      setIsSaving(false);
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-96 glass-panel border-l border-white/10 flex flex-col panel-transition z-[110] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${isOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'}`}>

      <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-white/5">

        <div className="flex items-center gap-2 text-cyan-400">
          <Brain size={18} className="animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Second Brain</span>
        </div>
        <button onClick={toggle} className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {!activeTabPath ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
            <LinkIcon size={48} className="mb-4" />
            <p className="text-sm">Select a file to view its knowledge</p>
          </div>
        ) : !node?.notePath ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="p-4 rounded-full bg-cyan-500/10 text-cyan-400">
              <Sparkles size={32} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white/80 mb-2">No Brain Link Found</h3>
              <p className="text-[11px] text-white/40 px-8 leading-relaxed">
                This file isn't linked to any knowledge yet. Create a note to start building your second brain for this module.
              </p>
            </div>
            <button 
              onClick={handleCreateNote}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-cyan-900/20"
            >
              <Plus size={16} />
              CREATE LINKED NOTE
            </button>
          </div>
        ) : (
          <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/40">
                   <FileText size={14} />
                   <span className="text-[10px] font-medium truncate max-w-[150px]">{node.notePath.split(/[\\/]/).pop()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setIsPreview(!isPreview)}
                     className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-white/60 transition-all"
                     title={isPreview ? "Edit Note" : "Preview Markdown"}
                   >
                     {isPreview ? <Edit3 size={12} /> : <Eye size={12} />}
                   </button>
                   
                   <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold transition-all ${
                      isSaving ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                   >
                     <Save size={12} />
                     {isSaving ? 'SAVED' : 'SAVE'}
                   </button>
                </div>
             </div>
             
             {isPreview ? (
               <div className="flex-1 w-full bg-black/20 border border-white/5 rounded-xl p-4 overflow-y-auto custom-scrollbar prose prose-invert prose-xs max-w-none prose-cyan prose-headings:text-cyan-400 prose-a:text-cyan-500 prose-code:text-amber-400 prose-code:bg-white/5 prose-code:px-1 prose-code:rounded prose-pre:bg-black/40">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
                   {content || "*No content to preview*"}
                 </ReactMarkdown>
               </div>
             ) : (
               <textarea
                 value={content}
                 onChange={e => setContent(e.target.value)}
                 placeholder="Start writing architectural notes, todos, or logic explanations..."
                 className="flex-1 w-full bg-black/20 border border-white/5 rounded-xl p-4 text-[13px] text-white/80 leading-relaxed outline-none focus:border-cyan-500/30 transition-all resize-none custom-scrollbar font-mono"
               />
             )}

            
            <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
               <p className="text-[9px] text-cyan-400/50 uppercase font-bold mb-1">Cerebro Tip</p>
               <p className="text-[10px] text-white/40 leading-tight">
                 Linking notes helps you maintain 'context' when you return to this file months later.
               </p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-white/5 bg-black/20 text-[9px] text-white/20 flex justify-between">
        <span>KNOWLEDGE NODE ACTIVE</span>
        <span className="font-bold text-cyan-500/40">M3WARP v0.6</span>
      </div>
    </div>
  );
}
