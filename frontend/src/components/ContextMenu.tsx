import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  items: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
  }[];
}

export default function ContextMenu({ x, y, onClose, items }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Asegurar que no se salga de la pantalla
  const style: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - (items.length * 32) - 20),
    left: Math.min(x, window.innerWidth - 180),
  };

  return (
    <div 
      ref={menuRef}
      style={style}
      className="fixed z-[100] w-44 py-1 bg-[#1e2329]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-100"
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose(); }}
          className={`
            w-full px-3 py-1.5 flex items-center gap-2 text-[12px] transition-colors
            ${item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white/70 hover:bg-white/5 hover:text-white'}
          `}
        >
          {item.icon && <span className="opacity-60">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}

import React from 'react';
