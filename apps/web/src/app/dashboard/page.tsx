'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { HistoryView } from '@/components/HistoryView';
import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { ticketsApi, categoriesApi } from '@/lib/api';
import { Ticket, TicketStatus, Priority, Category } from '@/lib/types';
import {
  Search,
  AlertTriangle,
  Clock,
  ChevronRight,
  RefreshCw,
  Ticket as TicketIcon,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    prioridade: '' as Priority | '',
    categoriaId: '',
    search: '',
  });

  const load = async (silent = false) => {
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
  };

  useEffect(() => {
    categoriesApi.list().then(setCategories);
  }, []);

  // Carga inicial e quando filtros da API mudam
  useEffect(() => { load(); }, [filters.prioridade, filters.categoriaId]);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = () => {
      load(true);
    };

    socket.on('ticketCreated', handleUpdate);
    socket.on('ticketUpdated', handleUpdate);

    return () => {
      socket.off('ticketCreated', handleUpdate);
      socket.off('ticketUpdated', handleUpdate);
    };
  }, [socket, filters.prioridade, filters.categoriaId]);

  const filtered = tickets.filter((t) =>
    filters.search
      ? t.titulo.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.criadoPor.nome.toLowerCase().includes(filters.search.toLowerCase())
      : true,
  );

  // Sort: CRITICA first, then NAO_CLASSIFICADA first if it's new, then by date
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
    (t) => t.prioridade === 'NAO_CLASSIFICADA' && t.status === 'NOVO'
  );

  // Kanban Columns Data
  const columns: { id: string; label: string; headerBg: string; headerText: string; borderColor: string; bg: string; tickets: Ticket[] }[] = [
    {
      id: 'NOVO',
      label: 'Novos',
      headerBg: 'bg-slate-200',
      headerText: 'text-slate-800',
      borderColor: 'border-slate-200',
      bg: 'bg-slate-50',
      tickets: sorted.filter((t) => t.status === 'NOVO'),
    },
    {
      id: 'EM_ANDAMENTO',
      label: 'Em Andamento',
      headerBg: 'bg-brand-500',
      headerText: 'text-white',
      borderColor: 'border-brand-200',
      bg: 'bg-slate-50',
      tickets: sorted.filter((t) => t.status === 'EM_ANDAMENTO'),
    },
    {
      id: 'AGUARDANDO_USUARIO',
      label: 'Aguardando',
      headerBg: 'bg-emerald-200',
      headerText: 'text-emerald-900',
      borderColor: 'border-emerald-200',
      bg: 'bg-slate-50',
      tickets: sorted.filter((t) => t.status === 'AGUARDANDO_USUARIO'),
    },
    {
      id: 'RESOLVIDO',
      label: 'Resolvidos / Fechados',
      headerBg: 'bg-emerald-100',
      headerText: 'text-emerald-800',
      borderColor: 'border-emerald-100',
      bg: 'bg-slate-50',
      tickets: sorted.filter((t) => t.status === 'RESOLVIDO' || t.status === 'FECHADO'),
    },
  ];

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6 animate-fade-in flex flex-col min-h-screen lg:min-h-0 lg:h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quadro de Chamados</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {user?.papel === 'ADMIN' ? 'Visão geral de todos os chamados' : 'Chamados para atendimento'}
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
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="input pl-10 py-2 text-sm"
          />
        </div>

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

        {(filters.prioridade || filters.categoriaId || filters.search) && (
          <button
            onClick={() => setFilters({ prioridade: '', categoriaId: '', search: '' })}
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
          {columns.map((col) => (
            <div key={col.id} className={`flex flex-col rounded-xl border ${col.borderColor} ${col.bg} h-[500px] lg:h-auto lg:min-h-0 overflow-hidden`}>
              <div className={`p-4 border-b ${col.borderColor} ${col.headerBg} flex justify-between items-center shrink-0`}>
                <h3 className={`font-bold text-base ${col.headerText}`}>{col.label}</h3>
                <span className="text-sm font-bold text-slate-700 bg-white/90 shadow-sm px-2.5 py-0.5 rounded-full">
                  {col.tickets.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="card p-4 skeleton h-28 w-full" />
                  ))
                ) : col.tickets.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <TicketIcon size={32} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">Vazio</p>
                  </div>
                ) : (
                  col.tickets.map((t) => <KanbanCard key={t.id} ticket={t} />)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ ticket }: { ticket: Ticket }) {
  const horasPassadas = Math.floor(
    (Date.now() - new Date(ticket.criadoEm).getTime()) / (1000 * 60 * 60),
  );
  const slaEstourado = horasPassadas > ticket.categoria.slaHoras;

  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="card bg-white p-5 shadow-sm hover:shadow-md transition-all border border-slate-200 rounded-xl min-h-[110px] flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
              #{ticket.id.slice(-6).toUpperCase()}
            </span>
            <PriorityBadge priority={ticket.prioridade} size="sm" />
          </div>
          <span className="text-[10px] text-slate-500 truncate max-w-[100px] text-right">
            {ticket.categoria.nome}
          </span>
        </div>
        
        <h4 className="font-semibold text-slate-800 text-base leading-snug mb-4 group-hover:text-brand-600 transition-colors line-clamp-3">
          {ticket.titulo}
        </h4>
        
        {slaEstourado && ticket.status !== 'RESOLVIDO' && ticket.status !== 'FECHADO' && (
          <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold mb-3 bg-red-50 w-fit px-1.5 py-0.5 rounded border border-red-100">
            <AlertTriangle size={10} />
            SLA estourado ({horasPassadas}h)
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
        {/* Assignee */}
        {ticket.atribuidoA ? (
          <div className="flex items-center gap-2 text-xs text-slate-500 truncate" title={ticket.atribuidoA.nome}>
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-[10px] text-emerald-800 shrink-0 border border-emerald-200">
              {ticket.atribuidoA.nome.charAt(0)}
            </div>
            <span className="truncate font-medium text-slate-600">{ticket.atribuidoA.nome.split(' ')[0]}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
             <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center shrink-0">
               <span className="text-[10px] text-slate-400">?</span>
             </div>
             <span className="italic text-[10px]">Não atribuído</span>
          </div>
        )}
        
        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 shrink-0">
          <Clock size={10} />
          {formatDistanceToNow(new Date(ticket.criadoEm), { locale: ptBR })}
        </div>
      </div>
    </Link>
  );
}
