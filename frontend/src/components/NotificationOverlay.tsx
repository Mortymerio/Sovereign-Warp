import { useStore } from '../store';
import { Info, CheckCircle, AlertTriangle, AlertCircle, X } from 'lucide-react';

const icons = {
  info: <Info size={16} className="text-cyan-400" />,
  success: <CheckCircle size={16} className="text-emerald-400" />,
  warning: <AlertTriangle size={16} className="text-amber-400" />,
  error: <AlertCircle size={16} className="text-rose-400" />
};

const styles = {
  info: 'border-cyan-500/30 bg-cyan-500/5 shadow-[0_0_20px_rgba(6,182,212,0.1)]',
  success: 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]',
  warning: 'border-amber-500/30 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]',
  error: 'border-rose-500/30 bg-rose-500/5 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
};

export default function NotificationOverlay() {
  const notifications = useStore(s => s.notifications);
  const remove = useStore(s => s.removeNotification);

  return (
    <div className="fixed bottom-12 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`group pointer-events-auto relative flex flex-col border backdrop-blur-md rounded-lg overflow-hidden animate-in slide-in-from-right-8 fade-in duration-300 ${styles[n.type]}`}
        >
          {/* Cyber Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
          
          <div className="flex items-start gap-3 p-4">
            <div className={`mt-0.5 p-1.5 rounded-md bg-white/5`}>
              {icons[n.type]}
            </div>
            
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40`}>
                  {n.type} signal
                </span>
                <button 
                  onClick={() => remove(n.id)}
                  className="opacity-0 group-hover:opacity-100 hover:text-white transition-all p-1 -mr-2 -mt-2"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-[12px] font-medium text-white/80 leading-relaxed">
                {n.message}
              </p>
            </div>
          </div>

          {/* Progress bar / Lifetime */}
          <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
            <div 
              className={`absolute inset-y-0 left-0 animate-progress ${
                n.type === 'info' ? 'bg-cyan-500' :
                n.type === 'success' ? 'bg-emerald-500' :
                n.type === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
              }`}
            />
          </div>
          
          {/* Decorative Corner */}
          <div className={`absolute top-0 right-0 w-8 h-8 opacity-20 border-t border-r ${
            n.type === 'info' ? 'border-cyan-500' :
            n.type === 'success' ? 'border-emerald-500' :
            n.type === 'warning' ? 'border-amber-500' : 'border-rose-500'
          }`} style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }} />
        </div>
      ))}
      
      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-progress {
          animation: progress 5s linear forwards;
        }
      `}</style>
    </div>
  );
}
