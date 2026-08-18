'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Menu, Headphones, WifiOff } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/contexts/ToastContext';
import { useFaviconBadge } from '@/hooks/useFaviconBadge';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const socket = useSocket();
  const { notify } = useNotifications();
  const { showNotification } = useToast();
  const { notify: badgeNotify, clear: badgeClear } = useFaviconBadge();
  const unreadRef = useRef(0);

  // Detecta conexão offline
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Solicita permissão de notificação assim que o usuário logar
  useEffect(() => {
    if (user && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [user]);

  // Escuta eventos de novos chamados (apenas agentes e admins)
  useEffect(() => {
    if (!socket || !user) return;
    const isAgent = user.papel === 'AGENTE' || user.papel === 'ADMIN';
    if (!isAgent) return;

    const handleTicketCreated = (ticket: { titulo: string; criadoPor?: { nome: string } }) => {
      const body = ticket.criadoPor ? `por ${ticket.criadoPor.nome}` : 'Novo chamado';
      notify('📋 Novo chamado recebido!', `${ticket.titulo} — ${body}`, 'ticket-created');
      showNotification('📋 Novo chamado!', `${ticket.titulo}\n${body}`, '📋');
      unreadRef.current += 1;
      badgeNotify(unreadRef.current);
    };

    const handleCommentCreated = (comment: {
      ticketId: string;
      autor?: { papel: string; nome: string };
      texto: string;
      ticket?: { atribuidoAId: string | null };
    }) => {
      if (comment.autor?.papel === 'COLABORADOR') {
        const isAssignedToMe = comment.ticket?.atribuidoAId === user.id;
        const isUnassigned = !comment.ticket?.atribuidoAId;

        if (isAssignedToMe || isUnassigned) {
          const preview = comment.texto.slice(0, 80);
          notify('💬 Nova mensagem em chamado', `${comment.autor.nome}: ${preview}`, `comment-${comment.ticketId}`);
          showNotification('💬 Nova mensagem', `${comment.autor.nome}: ${preview}`, '💬');
          unreadRef.current += 1;
          badgeNotify(unreadRef.current);
        }
      }
    };

    socket.on('ticketCreated', handleTicketCreated);
    socket.on('commentCreated', handleCommentCreated);

    return () => {
      socket.off('ticketCreated', handleTicketCreated);
      socket.off('commentCreated', handleCommentCreated);
    };
  }, [socket, user, notify, showNotification, badgeNotify]);

  // Zera badge ao focar a janela
  useEffect(() => {
    const handleFocus = () => {
      unreadRef.current = 0;
      badgeClear();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [badgeClear]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-container">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-30 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/50">
            <Headphones size={16} className="text-white" />
          </div>
          <h1 className="text-white font-bold text-base leading-none">AtendeTI</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="main-content">
        {children}
      </main>

      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-red-500 text-white text-xs sm:text-sm font-medium py-2 px-4 flex items-center justify-center gap-2 z-[60] fixed bottom-0 left-0 right-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-fade-in">
          <WifiOff size={16} />
          Você está offline. Visualizando dados em cache.
        </div>
      )}
    </div>
  );
}
