import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useStore } from '../store';
import { TerminalService } from '../../bindings/m3warp/services';
import { Events } from '@wailsio/runtime';

export default function TerminalPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const isOpen = useStore(s => s.isTerminalOpen);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      theme: {
        background: 'transparent',
        foreground: '#00f2ff',
        cursor: '#00f2ff',
        selectionBackground: 'rgba(0, 242, 255, 0.3)',
      },
      fontSize: 13,
      allowTransparency: true,
      fontFamily: "'JetBrains Mono', monospace",
      cursorBlink: true,

      cursorStyle: 'underline',
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    terminalRef.current = term;

    TerminalService.StartTerminal();

    const unsubscribe = Events.On('terminal-data', (data: any) => {
      term.write(data);
    });

    term.onData(data => {
      TerminalService.SendInput(data);
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  return (
    <div className={`fixed bottom-0 left-0 right-0 h-64 glass-panel border-t border-cyan-500/10 flex flex-col panel-transition z-40 ${isOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'}`}>
      <div className="h-8 flex items-center justify-between px-4 bg-cyan-500/5 border-b border-white/5">
        <span className="text-[10px] uppercase font-bold text-cyan-400/60 tracking-[0.2em]">Sovereign Terminal</span>
        <div className="flex gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
           <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/20" />
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden p-3" />
    </div>
  );
}
