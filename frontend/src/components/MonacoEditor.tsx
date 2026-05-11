import { useState, useEffect, useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { initVimMode } from 'monaco-vim';
import { useStore } from '../store';
import { EditorService, GitService, IntelService } from '../../bindings/m3warp/services';
import { Events as WailsEvents } from '@wailsio/runtime';
import { formatCode } from '../services/FormattingService';
import NeuralHUD from './NeuralHUD';

const CHUNK_SIZE = 500;

const SUPPORTED_LANGS: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescriptreact',
  'py': 'python',
  'go': 'go',
  'md': 'markdown',
  'json': 'json',
  'html': 'html',
  'css': 'css',
};

interface Props {
  filePath: string;
  language: string;
  totalLines: number;
}

export default function MonacoEditor({ filePath, language, totalLines }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const loadedRanges = useRef<Set<string>>(new Set());
  
  const theme = useStore(s => s.theme);
  const setCursor = useStore(s => s.setCursor);
  const markDirty = useStore(s => s.markDirty);
  const isVimMode = useStore(s => s.isVimMode);
  const fontSize = useStore(s => s.fontSize);
  const isZenMode = useStore(s => s.isZenMode);
  const addNotification = useStore(s => s.addNotification);
  const fixTab = useStore(s => s.fixTab);
  const isParticlesEnabled = useStore(s => s.isParticlesEnabled);

  const vimStatusBarRef = useRef<HTMLDivElement>(null);
  const vimModeRef = useRef<any>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<any[]>([]);
  const [hudSymbol, setHudSymbol] = useState<{name: string, type: string} | null>(null);

  // Consolidación de Opciones
  const getEditorOptions = useCallback((): monaco.editor.IStandaloneEditorConstructionOptions => {
    return {
      value: '',
      language: SUPPORTED_LANGS[language] || language || 'plaintext',
      theme: theme.includes('dark') || theme === 'cyber-ronin' ? 'vs-dark' : 'vs',
      automaticLayout: true,
      fontSize,
      fontFamily: "'JetBrains Mono', 'Consolas', monospace",
      lineNumbers: 'relative',
      fontLigatures: true,
      roundedSelection: true,
      scrollBeyondLastLine: false,
      readOnly: false,
      minimap: { 
        enabled: !isZenMode, 
        side: 'right',
        renderCharacters: false,
        maxColumn: 80,
        showSlider: 'mouseover'
      },
      cursorSmoothCaretAnimation: 'on',
      cursorBlinking: 'smooth',
      cursorStyle: 'block',
      renderLineHighlight: 'all',
      smoothScrolling: true,
      padding: { top: 20, bottom: 20 },
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
    };
  }, [language, theme, fontSize, isVimMode, isZenMode]);

  // Manejo de Carga de Chunks
  const loadChunk = useCallback(async (editor: monaco.editor.IStandaloneCodeEditor, from: number, to: number) => {
    const key = `${from}-${to}`;
    if (loadedRanges.current.has(key)) return;
    
    try {
      const chunk = await EditorService.ReadLines(filePath, from, to);
      if (!chunk) return;

      const model = editor.getModel();
      if (!model) return;

      loadedRanges.current.add(key);

      if (from === 1 && model.getValue() === '') {
        model.setValue(chunk.lines.join('\n'));
      } else {
        const lastLine = model.getLineCount();
        const lastCol = model.getLineMaxColumn(lastLine);
        model.applyEdits([{
          range: new monaco.Range(lastLine, lastCol, lastLine, lastCol),
          text: (lastLine > 1 ? '\n' : '') + chunk.lines.join('\n')
        }]);
      }
    } catch (err) {
      console.error("Chunk load error:", err);
    }
  }, [filePath]);

  // Particle System Logic
  const spawnParticles = useCallback((x: number, y: number) => {
    const color = theme.includes('cyber') ? '#00f2ff' : '#fbbf24';
    for (let i = 0; i < 8; i++) {
      particles.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1.0,
        size: Math.random() * 3 + 1,
        color
      });
    }
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter(p => p.life > 0);
      
      particles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Ciclo de Vida Principal
  useEffect(() => {
    if (!containerRef.current) return;

    const editor = monaco.editor.create(containerRef.current, getEditorOptions());
    editorRef.current = editor;
    (window as any).monacoEditorInstance = editor;

    // Carga inicial
    loadChunk(editor, 1, CHUNK_SIZE);

    // Decorations management
    const decorations = { current: [] as string[] };

    const updateErrorLens = () => {
      const model = editor.getModel();
      if (!model) return;

      const markers = monaco.editor.getModelMarkers({ resource: model.uri });
      const newDecorations: monaco.editor.IModelDeltaDecoration[] = markers.map(marker => ({
        range: new monaco.Range(marker.startLineNumber, 1, marker.startLineNumber, 1),
        options: {
          isWholeLine: false,
          after: {
            content: `    // ${marker.message}`,
            inlineClassName: marker.severity === monaco.MarkerSeverity.Error 
              ? 'error-lens-text-error' 
              : 'error-lens-text-warning'
          }
        }
      }));

      decorations.current = editor.deltaDecorations(decorations.current, newDecorations);
    };

    // Git Heatmap & Spectral MiniMap Implementation
    const updateSpectralMiniMap = async () => {
      const model = editor.getModel();
      if (!model) return;

      try {
        const rootPath = useStore.getState().rootPaths[0];
        if (!rootPath) return;

        const diffs = await GitService.GetLineDiff(rootPath, filePath);
        const symbols = await IntelService.GetFileSymbols(filePath);

        const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];

        // Git markers on minimap
        diffs.forEach(d => {
          newDecorations.push({
            range: new monaco.Range(d.line, 1, d.line, 1),
            options: {
              isWholeLine: true,
              minimap: {
                color: d.type === 'added' ? '#10b981' : '#3b82f6',
                position: monaco.editor.MinimapPosition.Inline
              }
            }
          });
        });

        // Symbol markers on minimap (right edge)
        symbols.forEach(s => {
          newDecorations.push({
            range: new monaco.Range(s.line, 1, s.line, 1),
            options: {
              minimap: {
                color: s.type === 'func' ? '#fbbf24' : '#8b5cf6',
                position: monaco.editor.MinimapPosition.Gutter
              }
            }
          });
        });

        decorations.current = editor.deltaDecorations(decorations.current, newDecorations);
      } catch (err) {
        console.error("Spectral MiniMap error:", err);
      }
    };

    updateSpectralMiniMap();

    // CodeLens Provider (Neural Symbol HUD)
    const codeLensProvider = monaco.languages.registerCodeLensProvider('*', {
      provideCodeLenses: async (model) => {
        if (model.uri.path !== filePath) return { lenses: [], dispose: () => {} };
        
        try {
          const symbols = await IntelService.GetFileSymbols(filePath);
          const lenses = symbols.map(s => ({
            range: new monaco.Range(s.line, 1, s.line, 1),
            id: `lens-${s.name}-${s.line}`,
            command: {
              id: 'm3warp.explainSymbol',
              title: `$(zap) Neural ${s.type.toUpperCase()}: ${s.name} | Integrity: 99%%`,
              arguments: [s.name]
            }
          }));
          return { lenses, dispose: () => {} };
        } catch {
          return { lenses: [], dispose: () => {} };
        }
      },
      resolveCodeLens: (model, codeLens) => codeLens
    });

    editor.addCommand(0, (_, name) => {
      addNotification('info', `Neural Analysis of ${name} requested. Linking to brain...`);
    }, 'm3warp.explainSymbol');

    const markerSub = monaco.editor.onDidChangeMarkers(() => updateErrorLens());

    editor.onDidChangeCursorPosition(async e => {
      setCursor(e.position.lineNumber, e.position.column);
      
      // Update HUD Symbol
      const symbols = await IntelService.GetFileSymbols(filePath);
      const activeSymbol = symbols.find(s => s.line === e.position.lineNumber);
      if (activeSymbol) {
        setHudSymbol({ name: activeSymbol.name, type: activeSymbol.type });
      } else {
        setHudSymbol(null);
      }
    });
    
    editor.onDidChangeModelContent((e) => {
      markDirty(filePath, true);
      fixTab(filePath);
      updateErrorLens();

      // Trigger Particles
      if (isParticlesEnabled) {
        const pos = editor.getPosition();
        if (pos) {
          const coords = editor.getScrolledVisiblePosition(pos);
          if (coords) {
            spawnParticles(coords.left, coords.top);
          }
        }
      }
    });

    editor.onDidScrollChange(debounce(() => {
      const visibleRanges = editor.getVisibleRanges();
      if (visibleRanges.length === 0) return;
      const lastVisible = visibleRanges[visibleRanges.length - 1].endLineNumber;
      const bufferEnd = Math.min(totalLines, lastVisible + 200);
      
      const currentLines = editor.getModel()?.getLineCount() || 0;
      if (bufferEnd > currentLines) {
        loadChunk(editor, currentLines + 1, currentLines + CHUNK_SIZE);
      }
    }, 200));

    editor.addAction({
      id: 'm3warp-save',
      label: 'Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: async () => {
        const content = editor.getValue();
        await EditorService.SaveFile(filePath, content);
        addNotification('success', `Saved: ${filePath.split(/[/\\]/).pop()}`);
        markDirty(filePath, false);
        updateSpectralMiniMap();
        
        if (containerRef.current) {
          containerRef.current.classList.add('cyber-pulse');
          setTimeout(() => containerRef.current?.classList.remove('cyber-pulse'), 1000);
        }
      },
    });

    editor.addAction({
      id: 'm3warp-format',
      label: 'Format Document',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
      run: async () => {
        const val = editor.getValue();
        const formatted = await formatCode(val, language);
        if (formatted !== val) {
          editor.setValue(formatted);
          addNotification('info', 'Document formatted');
        }
      },
    });

    const unsubJump = WailsEvents.On('editor:jump-to-line', (ev: any) => {
      const lineNum = typeof ev === 'number' ? ev : ev.data;
      editor.revealLineInCenter(lineNum);
      editor.setPosition({ lineNumber: lineNum, column: 1 });
      editor.focus();
    });

    const unsubRefresh = WailsEvents.On('editor:refresh', () => {
      loadedRanges.current.clear();
      editor.setValue('');
      loadChunk(editor, 1, CHUNK_SIZE);
    });

    return () => {
      markerSub.dispose();
      codeLensProvider.dispose();
      unsubJump();
      unsubRefresh();
      if (vimModeRef.current) vimModeRef.current.dispose();
      editor.dispose();
      (window as any).monacoEditorInstance = null;
      EditorService.CloseFile(filePath);
    };
  }, [filePath, spawnParticles, getEditorOptions, loadChunk]); 

  // Efecto para Modo Vim
  useEffect(() => {
    if (editorRef.current) {
      if (isVimMode) {
        if (vimModeRef.current) vimModeRef.current.dispose();
        vimModeRef.current = initVimMode(editorRef.current, vimStatusBarRef.current);
      } else if (vimModeRef.current) {
        vimModeRef.current.dispose();
        vimModeRef.current = null;
      }
      editorRef.current.updateOptions(getEditorOptions());
      setTimeout(() => editorRef.current?.layout(), 50);
    }
  }, [isVimMode, getEditorOptions]);

  // Efecto para Cambios de UI (Tema, Fuente, Zen)
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions(getEditorOptions());
      setTimeout(() => editorRef.current?.layout(), 50);
    }
  }, [theme, fontSize, isZenMode, getEditorOptions]);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative h-full">
      <div ref={containerRef} className="flex-1 relative" />
      <NeuralHUD symbolName={hudSymbol?.name || null} symbolType={hudSymbol?.type || null} />
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-50"
        width={window.innerWidth}
        height={window.innerHeight}
      />
      {isVimMode && (
        <div 
          ref={vimStatusBarRef} 
          className="h-6 px-3 flex items-center bg-blue-600/10 text-[11px] text-blue-400 font-mono border-t border-blue-500/10 shrink-0"
        />
      )}
    </div>
  );
}
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
