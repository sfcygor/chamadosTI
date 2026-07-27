'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType>({} as ToastContextType);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const toast = {
    success: (m: string) => addToast('success', m),
    error: (m: string) => addToast('error', m),
    warning: (m: string) => addToast('warning', m),
    info: (m: string) => addToast('info', m),
  };

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  const icons: Record<Toast['type'], string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const styles: Record<Toast['type'], string> = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-brand-600 text-white',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium min-w-[280px] max-w-sm animate-slide-in-right ${styles[t.type]}`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
            {icons[t.type]}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
