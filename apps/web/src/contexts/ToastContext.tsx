'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ─── Toast normal (bottom-right) ─────────────────────────────────────────────

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

// ─── macOS-style Notification (top-right) ────────────────────────────────────

interface MacNotif {
  id: string;
  title: string;
  body: string;
  icon?: string;
  exiting?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
  /** Exibe notificação flutuante estilo macOS (top-right) */
  showNotification: (title: string, body: string, icon?: string) => void;
}

const ToastContext = createContext<ToastContextType>({} as ToastContextType);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifs, setNotifs] = useState<MacNotif[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const showNotification = useCallback((title: string, body: string, icon?: string) => {
    const id = Math.random().toString(36).slice(2);
    setNotifs((prev) => [...prev, { id, title, body, icon }]);

    // Start exit animation before removing
    setTimeout(() => {
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, exiting: true } : n));
    }, 5500);

    setTimeout(() => {
      setNotifs((prev) => prev.filter((n) => n.id !== id));
    }, 5900);
  }, []);

  const toast = {
    success: (m: string) => addToast('success', m),
    error:   (m: string) => addToast('error', m),
    warning: (m: string) => addToast('warning', m),
    info:    (m: string) => addToast('info', m),
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, showNotification }}>
      {children}
      <ToastContainer toasts={toasts} />
      <MacNotifContainer notifs={notifs} onDismiss={(id) => {
        setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, exiting: true } : n));
        setTimeout(() => setNotifs((prev) => prev.filter((n) => n.id !== id)), 350);
      }} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// ─── Toast Container (bottom-right, com check SVG animado) ───────────────────

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  const config: Record<Toast['type'], { bg: string; icon: React.ReactNode }> = {
    success: {
      bg: 'bg-emerald-600',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
          <polyline
            points="4,10 8,14 16,6"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="toast-check-path"
          />
        </svg>
      ),
    },
    error: {
      bg: 'bg-red-600',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
          <line x1="5" y1="5" x2="15" y2="15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="15" y1="5" x2="5" y2="15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-amber-500',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
          <path d="M10 6v5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="10" cy="14.5" r="1.2" fill="white" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-brand-600',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
          <circle cx="10" cy="6.5" r="1.2" fill="white" />
          <path d="M10 10v5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const { bg, icon } = config[t.type];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium min-w-[280px] max-w-sm text-white animate-slide-in-right ${bg}`}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              {icon}
            </span>
            <span className="flex-1">{t.message}</span>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-white/30 rounded-b-2xl" style={{
              width: '100%',
              animation: 'shrinkWidth 4s linear forwards',
            }} />
          </div>
        );
      })}
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ─── macOS Notification Container (top-right) ─────────────────────────────────

function MacNotifContainer({
  notifs,
  onDismiss,
}: {
  notifs: MacNotif[];
  onDismiss: (id: string) => void;
}) {
  if (notifs.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[110] flex flex-col gap-3 pointer-events-none">
      {notifs.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto macos-notif${n.exiting ? ' exit' : ''} flex items-start gap-3 bg-slate-800/95 text-white rounded-2xl shadow-2xl px-4 py-3 w-80 cursor-pointer select-none`}
          style={{ backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
          onClick={() => onDismiss(n.id)}
        >
          {/* App icon */}
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0 shadow-lg">
            <span className="text-white text-lg">{n.icon ?? '📋'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-brand-400 uppercase tracking-wide mb-0.5">AtendeTI</p>
            <p className="text-sm font-semibold text-white leading-snug">{n.title}</p>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{n.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
