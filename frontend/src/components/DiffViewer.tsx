import { useEffect, useRef } from 'react';

import * as monaco from 'monaco-editor';
import { X, Check, RotateCcw } from 'lucide-react';

interface DiffViewerProps {
  original: string;
  modified: string;
  onAccept: (newContent: string) => void;
  onClose: () => void;
}

export default function DiffViewer({ original, modified, onAccept, onClose }: DiffViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diffEditorRef = useRef<monaco.editor.IDiffEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = monaco.editor.createDiffEditor(containerRef.current, {
      originalEditable: false,
      renderSideBySide: true,
      automaticLayout: true,
      theme: 'vs-dark',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', monospace",
      scrollBeyondLastLine: false,
    });

    const originalModel = monaco.editor.createModel(original, 'typescript');
    const modifiedModel = monaco.editor.createModel(modified, 'typescript');

    editor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    diffEditorRef.current = editor;

    return () => {
      editor.dispose();
      originalModel.dispose();
      modifiedModel.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#0b0d0f]/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
            <RotateCcw size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white/90">Review AI Changes</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Side-by-side Comparison</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-[11px] font-bold text-white/40 hover:text-white transition-colors"
          >
            DISCARD
          </button>
          <button 
            onClick={() => onAccept(modified)}
            className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-cyan-900/20"
          >
            <Check size={14} />
            ACCEPT CHANGES
          </button>
          <button onClick={onClose} className="ml-2 text-white/20 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      <div className="h-10 bg-[#0d1013] border-t border-white/5 px-6 flex items-center justify-between text-[10px] text-white/20">
        <div className="flex gap-4 uppercase font-bold tracking-tighter">
          <span className="text-red-400/60">Original</span>
          <span className="text-green-400/60">AI Suggested</span>
        </div>
        <span>M3WARP REFACTOR ENGINE</span>
      </div>
    </div>
  );
}
