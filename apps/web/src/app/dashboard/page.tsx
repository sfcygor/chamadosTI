'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { HistoryView } from '@/components/HistoryView';
import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useSocket } from '@/hooks/useSocket';
import { ticketsApi, categoriesApi } from '@/lib/api';
import { Ticket, TicketStatus, Priority, Category } from '@/lib/types';
import { colorFromString } from '@/lib/colorFromString';
import {
  AlertTriangle,
  Clock,
  ChevronRight,
  RefreshCw,
  Ticket as TicketIcon,
  X,
  GripVertical,
  MessageSquare,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Status visíveis no Kanban (FECHADO é agrupado com RESOLVIDO para exibição mas não aceita drop)
const KANBAN_COLUMNS: {
  id: TicketStatus | 'RESOLVIDO';
  label: string;
  headerBg: string;
  headerText: string;
  borderColor: string;
  dropBg: string;
  dropActiveBg: string;
  acceptsDrop: boolean; // Se a coluna aceita drops (FECHADO não aceita)
}[] = [
  {
    id: 'NOVO',
    label: 'Novos',
    headerBg: 'bg-slate-200',
    headerText: 'text-slate-800',
    borderColor: 'border-slate-200',
    dropBg: 'bg-slate-50',
    dropActiveBg: 'bg-slate-100',
    acceptsDrop: true,
  },
  {
    id: 'EM_ANDAMENTO',
    label: 'Em Andamento',
    headerBg: 'bg-brand-500',
    headerText: 'text-white',
    borderColor: 'border-brand-200',
    dropBg: 'bg-slate-50',
    dropActiveBg: 'bg-brand-50',
    acceptsDrop: true,
  },
  {
    id: 'AGUARDANDO_USUARIO',
    label: 'Aguardando',
    headerBg: 'bg-emerald-200',
    headerText: 'text-emerald-900',
    borderColor: 'border-emerald-200',
    dropBg: 'bg-slate-50',
    dropActiveBg: 'bg-emerald-50',
    acceptsDrop: true,
  },
  {
    id: 'RESOLVIDO',
    label: 'Resolvidos / Fechados',
    headerBg: 'bg-emerald-100',
    headerText: 'text-emerald-800',
    borderColor: 'border-emerald-100',
    dropBg: 'bg-slate-50',
    dropActiveBg: 'bg-emerald-50',
    acceptsDrop: true,
  },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'history'>('kanban');

  return (
    <AppLayout>
      <div className="bg-slate-900 border-b border-white/10 px-4 sm:px-8 py-0 flex gap-6 sticky top-16 lg:top-0 z-20 overflow-x-auto scrollbar-none">
        <button 
          onClick={() => setActiveTab('kanban')}
          className={`py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'kanban' 
              ? 'border-brand-500 text-brand-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Fila Ativa (Kanban)
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'history' 
              ? 'border-brand-500 text-brand-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Histórico de Chamados
        </button>
      </div>

      <div className="relative h-full flex flex-col flex-1">
        <div className={activeTab === 'kanban' ? 'block h-full' : 'hidden'}>
          <AgentDashboard />
        </div>
        <div className={activeTab === 'history' ? 'block h-full' : 'hidden'}>
          <HistoryView />
        </div>
      </div>
    </AppLayout>
  );
}

function AgentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    prioridade: '' as Priority | '',
    categoriaId: '',
  });
  // #5 — Track IDs of freshly-arrived tickets for green pulse
  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());

  // ─── Drag & Drop state ───────────────────────────────────────────────────────
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const dragTicketRef = useRef<Ticket | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.prioridade) params.prioridade = filters.prioridade;
      if (filters.categoriaId) params.categoriaId = filters.categoriaId;

      const ticketsRes = await ticketsApi.list(params);
      setTickets(ticketsRes.data || []);
    } catch (err) {
      console.error('Erro ao recarregar fila:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.prioridade, filters.categoriaId]);

  useEffect(() => {
    categoriesApi.list().then(setCategories);
  }, []);

  useEffect(() => { load(); }, [load]);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewTicket = (newTicket: Ticket) => {
      setTickets((prev) => {
        if (prev.some(t => t.id === newTicket.id)) return prev;
        return [newTicket, ...prev];
      });
      // #5 — Mark as new for pulse animation
      setNewCardIds((prev) => new Set(prev).add(newTicket.id));
      setTimeout(() => {
        setNewCardIds((prev) => {
          const next = new Set(prev);
          next.delete(newTicket.id);
          return next;
        });
      }, 3000);
    };

    // Atualiza o ticket diretamente no estado local sem re-fetch filtrado,
    // evitando que cards sumam ou pulem de coluna ao mudar prioridade.
    const handleUpdate = (updatedTicket: Ticket) => {
      setTickets((prev) => {
        const exists = prev.some((t) => t.id === updatedTicket.id);
        if (!exists) {
          // Ticket não estava na lista local (ex: chegou de outro agente) — adiciona
          return [updatedTicket, ...prev];
        }
        return prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t));
      });
    };

    socket.on('ticketCreated', handleNewTicket);
    socket.on('ticketUpdated', handleUpdate);

    return () => {
      socket.off('ticketCreated', handleNewTicket);
      socket.off('ticketUpdated', handleUpdate);
    };
  }, [socket]);

  // ─── Drag & Drop handlers ────────────────────────────────────────────────────
  const handleDragStart = useCallback((ticket: Ticket) => {
    setDraggingId(ticket.id);
    dragTicketRef.current = ticket;
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setOverColumnId(null);
    dragTicketRef.current = null;
  }, []);

  const handleDrop = useCallback(async (targetColumnId: string) => {
    const ticket = dragTicketRef.current;
    if (!ticket) return;

    // Map column id to TicketStatus (RESOLVIDO column receives RESOLVIDO status)
    const newStatus = targetColumnId as TicketStatus;

    if (ticket.status === newStatus) {
      setDraggingId(null);
      setOverColumnId(null);
      dragTicketRef.current = null;
      return;
    }

    // Optimistic update — move card instantly in UI
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, status: newStatus } : t)),
    );
    setDraggingId(null);
    setOverColumnId(null);
    dragTicketRef.current = null;

    try {
      await ticketsApi.update(ticket.id, { status: newStatus });
      toast.success(`Chamado movido para "${KANBAN_COLUMNS.find(c => c.id === newStatus)?.label ?? newStatus}"`);
    } catch (err: any) {
      // Rollback on error
      toast.error(err.message || 'Erro ao mover chamado');
      load(true);
    }
  }, [toast]);

  const filtered = tickets;

  const sorted = [...filtered].sort((a, b) => {
    const priorityOrder = { CRITICA: 0, NAO_CLASSIFICADA: 1, ALTA: 2, MEDIA: 3, BAIXA: 4 };
    if (priorityOrder[a.prioridade] !== priorityOrder[b.prioridade]) {
      return priorityOrder[a.prioridade] - priorityOrder[b.prioridade];
    }
    return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
  });

  const criticalUnassigned = sorted.filter(
    (t) => t.prioridade === 'CRITICA' && !t.atribuidoA && t.status === 'NOVO',
  );

  const unclassified = sorted.filter(
    (t) => t.prioridade === 'NAO_CLASSIFICADA' && t.status === 'NOVO',
  );

  const getColumnTickets = (colId: string) => {
    if (colId === 'RESOLVIDO') {
      return sorted.filter((t) => t.status === 'RESOLVIDO' || t.status === 'FECHADO');
    }
    return sorted.filter((t) => t.status === colId);
  };

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6 animate-fade-in flex flex-col min-h-screen lg:min-h-0 lg:h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Quadro de Chamados</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {user?.papel === 'ADMIN' ? 'Visão geral de todos os chamados' : 'Arraste os cards para mover entre colunas'}
          </p>
        </div>
        <button onClick={() => load()} className="btn-ghost gap-2" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Alerts */}
      <div className="shrink-0 flex flex-col gap-3 mb-4">
        {criticalUnassigned.length > 0 && (
          <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-4 flex items-center gap-3 critical-pulse">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">
                {criticalUnassigned.length} chamado(s) crítico(s) sem responsável!
              </p>
            </div>
          </div>
        )}
        {unclassified.length > 0 && (
          <div className="rounded-2xl bg-slate-100 border border-slate-300 p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">
                {unclassified.length} chamado(s) aguardando classificação de prioridade inicial na fila de Novos.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-3 mb-4 shrink-0 flex gap-3 flex-wrap">
        <select
          value={filters.prioridade}
          onChange={(e) => setFilters((f) => ({ ...f, prioridade: e.target.value as Priority | '' }))}
          className="select py-2 text-sm w-full sm:w-40"
        >
          <option value="">Prioridades (Todas)</option>
          <option value="NAO_CLASSIFICADA">Não classificada</option>
          <option value="CRITICA">🔴 Crítica</option>
          <option value="ALTA">🟠 Alta</option>
          <option value="MEDIA">🔵 Média</option>
          <option value="BAIXA">⚪ Baixa</option>
        </select>

        <select
          value={filters.categoriaId}
          onChange={(e) => setFilters((f) => ({ ...f, categoriaId: e.target.value }))}
          className="select py-2 text-sm w-full sm:w-48"
        >
          <option value="">Categorias (Todas)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>

        {(filters.prioridade || filters.categoriaId) && (
          <button
            onClick={() => setFilters({ prioridade: '', categoriaId: '' })}
            className="btn-ghost text-xs gap-1.5 text-slate-500 py-2"
          >
            <X size={13} />
            Limpar
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 lg:min-h-0 lg:overflow-hidden pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:h-full">
          {KANBAN_COLUMNS.map((col) => {
            const colTickets = getColumnTickets(col.id);
            const isDragOver = overColumnId === col.id;
            const canDrop = col.acceptsDrop;

            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-xl border transition-all duration-200 h-[500px] lg:h-auto lg:min-h-0 overflow-hidden ${
                  isDragOver && canDrop
                    ? `${col.borderColor} border-2 ring-2 ring-brand-400 ring-offset-2`
                    : col.borderColor
                } ${isDragOver && canDrop ? col.dropActiveBg : col.dropBg}`}
                onDragOver={(e) => {
                  if (!canDrop) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setOverColumnId(col.id);
                }}
                onDragLeave={(e) => {
                  // Only clear if leaving the column entirely (not a child)
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setOverColumnId(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (canDrop) handleDrop(col.id);
                }}
              >
                {/* Column Header */}
                <div className={`p-4 border-b ${col.borderColor} ${col.headerBg} flex justify-between items-center shrink-0`}>
                  <h3 className={`font-bold text-base ${col.headerText}`}>{col.label}</h3>
                  <span className="text-sm font-bold text-slate-700 bg-white/90 shadow-sm px-2.5 py-0.5 rounded-full">
                    {colTickets.length}
                  </span>
                </div>

                {/* Drop zone hint */}
                {isDragOver && canDrop && (
                  <div className="mx-3 mt-3 rounded-xl border-2 border-dashed border-brand-400 bg-brand-50/60 flex items-center justify-center py-3 text-xs text-brand-600 font-semibold gap-1.5 shrink-0">
                    ⬇ Soltar aqui
                  </div>
                )}

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="card p-4 skeleton h-28 w-full" />
                    ))
                  ) : colTickets.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <TicketIcon size={32} className="mb-2 opacity-50" />
                      <p className="text-sm font-medium">Vazio</p>
                    </div>
                  ) : (
                    colTickets.map((t) => (
                      <KanbanCard
                        key={t.id}
                        ticket={t}
                        isDragging={draggingId === t.id}
                        isNew={newCardIds.has(t.id)}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface KanbanCardProps {
  ticket: Ticket;
  isDragging: boolean;
  isNew: boolean;
  onDragStart: (ticket: Ticket) => void;
  onDragEnd: () => void;
}

function KanbanCard({ ticket, isDragging, isNew, onDragStart, onDragEnd }: KanbanCardProps) {
  const horasPassadas = Math.floor(
    (Date.now() - new Date(ticket.criadoEm).getTime()) / (1000 * 60 * 60),
  );
  const slaEstourado = horasPassadas > ticket.categoria.slaHoras;
  const comentarios = (ticket as any).comentarios ?? [];
  // Unique commenters (excluding ticket creator)
  const commenters: { nome: string }[] = [];
  const seen = new Set<string>();
  for (const c of comentarios) {
    const name: string = c.autor?.nome ?? '';
    if (name && !seen.has(name)) {
      seen.add(name);
      commenters.push({ nome: name });
    }
  }
  const visibleCommenters = commenters.slice(0, 4);
  const extraCommenters = Math.max(0, commenters.length - 4);

  // Prioridade → cor da faixa lateral
  const priorityStripe: Record<string, string> = {
    CRITICA: '#ef4444',
    ALTA: '#f97316',
    MEDIA: '#3b82f6',
    BAIXA: '#94a3b8',
    NAO_CLASSIFICADA: '#cbd5e1',
  };
  const stripe = priorityStripe[ticket.prioridade] ?? '#cbd5e1';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
        onDragStart(ticket);
      }}
      onDragEnd={onDragEnd}
      className={`group select-none transition-all duration-200 ${
        isDragging ? 'is-dragging' : ''
      } ${isNew ? 'card-new-pulse' : ''}`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div className={`${isDragging ? 'opacity-40 scale-[0.97] rotate-1' : ''}`}>

        {/* ── FACE FRONTAL ─────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-brand-200 overflow-hidden flex flex-col h-full min-h-[170px]">
          {/* Faixa de prioridade lateral */}
          <div className="flex h-full flex-1">
            <div className="w-1 shrink-0 bg-slate-200" style={{ backgroundColor: stripe }} />
            <Link
              href={`/tickets/${ticket.id}`}
              className="flex flex-col flex-1 p-4"
              onClick={(e) => { if (isDragging) e.preventDefault(); }}
              draggable={false}
            >
              <div className="flex items-start justify-between mb-2 gap-2 shrink-0">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                    #{ticket.id.slice(-6).toUpperCase()}
                  </span>
                  <PriorityBadge priority={ticket.prioridade} size="sm" />
                </div>
                <span className="text-[10px] text-slate-500 truncate max-w-[90px] text-right">
                  {ticket.categoria.nome}
                </span>
              </div>

              <h4 className="font-semibold text-slate-800 text-sm leading-snug mb-3 group-hover:text-brand-600 transition-colors line-clamp-2">
                {ticket.titulo}
              </h4>

              {slaEstourado && ticket.status !== 'RESOLVIDO' && ticket.status !== 'FECHADO' && (
                <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold mb-2 bg-red-50 w-fit px-1.5 py-0.5 rounded border border-red-100 shrink-0">
                  <AlertTriangle size={10} />
                  SLA estourado ({horasPassadas}h)
                </div>
              )}

              {/* Footer: assignee + time + avatar stack */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-auto shrink-0">
                {ticket.atribuidoA ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate" title={ticket.atribuidoA.nome}>
                    {(() => {
                      const c = colorFromString(ticket.atribuidoA.nome);
                      return (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border"
                          style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
                        >
                          {ticket.atribuidoA.nome.charAt(0)}
                        </div>
                      );
                    })()}
                    <span className="truncate font-medium text-slate-600">{ticket.atribuidoA.nome.split(' ')[0]}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center shrink-0">
                      <span className="text-[10px]">?</span>
                    </div>
                    <span className="italic text-[10px]">Não atribuído</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Stacked comment avatars (#7) */}
                  {visibleCommenters.length > 0 && (
                    <div className="flex items-center -space-x-1.5">
                      {visibleCommenters.map((c, i) => {
                        const color = colorFromString(c.nome);
                        return (
                          <div
                            key={i}
                            title={c.nome}
                            className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold"
                            style={{ backgroundColor: color.bg, color: color.text, zIndex: visibleCommenters.length - i }}
                          >
                            {c.nome.charAt(0)}
                          </div>
                        );
                      })}
                      {extraCommenters > 0 && (
                        <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                          +{extraCommenters}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-0.5 text-[10px] font-medium text-slate-400 shrink-0">
                    <Clock size={10} />
                    {formatDistanceToNow(new Date(ticket.criadoEm), { locale: ptBR })}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Drag grip hint */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-30 transition-opacity text-slate-400 pointer-events-none">
        <GripVertical size={13} />
      </div>
    </div>
  );
}

