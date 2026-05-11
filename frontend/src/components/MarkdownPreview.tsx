import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { useStore } from '../store';
import { EditorService } from '../../bindings/sovereign-warp/services';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Consolas, monospace'
});

const Mermaid = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart).then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      });
    }
  }, [chart]);

  return <div ref={ref} className="flex justify-center my-8 bg-white/5 p-4 rounded-xl border border-white/5 shadow-2xl" />;
};

export default function MarkdownPreview() {
  const activePath = useStore(s => s.activeTabPath);
  const isOpen = useStore(s => s.isMarkdownPreviewOpen);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (activePath && isOpen) {
      EditorService.ReadLines(activePath, 1, 10000).then(res => {
        if (res) setContent(res.lines.join('\n'));
      });
    }
  }, [activePath, isOpen]);

  if (!isOpen || !activePath?.toLowerCase().endsWith('.md')) return null;

  return (
    <div className="absolute inset-0 z-50 bg-[#0a0c0e]/95 backdrop-blur-3xl overflow-y-auto custom-scrollbar p-12 select-text animate-in fade-in zoom-in-95 duration-300">
      <div className="max-w-4xl mx-auto">
        <article className="prose prose-invert prose-cyan max-w-none prose-headings:uppercase prose-headings:tracking-widest prose-h1:text-4xl prose-h1:font-black prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-4 prose-h2:border-l-4 prose-h2:border-cyan-500 prose-h2:pl-4">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const contentStr = String(children).replace(/\n$/, '');
                
                if (!inline && match && match[1] === 'mermaid') {
                  return <Mermaid chart={contentStr} />;
                }
                
                return inline ? (
                  <code className="bg-white/5 px-1.5 py-0.5 rounded text-pink-400 font-mono text-[11px]" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="bg-[#13161a] p-4 rounded-xl border border-white/5 overflow-x-auto my-6">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
        
        {/* Cyber Decoration */}
        <div className="mt-20 pt-8 border-t border-white/5 text-center flex flex-col items-center gap-2">
          <div className="w-12 h-[2px] bg-cyan-500/30" />
          <span className="text-[9px] font-black uppercase tracking-[0.6em] opacity-20">M3Warp Sovereign MD Engine v2.0</span>
          <div className="w-12 h-[2px] bg-cyan-500/30" />
        </div>
      </div>
    </div>
  );
}

