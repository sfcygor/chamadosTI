'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { useSocket } from '@/hooks/useSocket';
import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { ticketsApi } from '@/lib/api';
import { Ticket } from '@/lib/types';
import {
  Plus,
  Clock,
  Ticket as TicketIcon,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && (user.papel === 'AGENTE' || user.papel === 'ADMIN')) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  return (
    <AppLayout>
      <ColaboradorDashboard />
    </AppLayout>
  );
}

function ColaboradorDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [t, s] = await Promise.all([ticketsApi.list(), ticketsApi.stats()]);
      setTickets(t.data || []);
      setStats(s);
    } catch (err) {
      console.error('Erro ao carregar dashboard', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const socket = useSocket();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = () => {
      loadData(true);
    };

    socket.on('ticketCreated', handleUpdate);
    socket.on('ticketUpdated', handleUpdate);

    return () => {
      socket.off('ticketCreated', handleUpdate);
      socket.off('ticketUpdated', handleUpdate);
    };
  }, [socket]);

  // Order tickets by most recently updated
  const sortedTickets = [...tickets].sort(
    (a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime()
  );

  const abertos = sortedTickets.filter((t) =>
    ['NOVO', 'EM_ANDAMENTO', 'AGUARDANDO_USUARIO'].includes(t.status),
  );
  const resolvidos = sortedTickets.filter((t) =>
    ['RESOLVIDO', 'FECHADO'].includes(t.status),
  );

  return (
    <div className="content-wrapper animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Olá, {user?.nome.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Acompanhe seus chamados ou abra um novo.
        </p>
      </div>

      {/* CTA: Abrir novo chamado */}
      <Link
        href="/tickets/new"
        id="btn-new-ticket"
        className="block w-full mb-8 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 p-6 text-white shadow-lg shadow-brand-600/20 hover:shadow-xl hover:shadow-brand-600/30 hover:-translate-y-0.5 transition-all duration-200 group"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Plus size={18} className="text-white" />
              </div>
              <span className="font-semibold text-lg">Abrir novo chamado</span>
            </div>
            <p className="text-brand-200 text-sm">
              Descreva o problema e nossa equipe de TI irá te ajudar rapidamente.
            </p>
          </div>
          <ChevronRight
            size={24}
            className="text-white/50 group-hover:text-white/80 group-hover:translate-x-1 transition-all"
          />
        </div>
      </Link>

      {/* Stats */}
      {!loading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={TicketIcon}
            label="Total"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={Clock}
            label="Em aberto"
            value={abertos.length}
            color="orange"
          />
          <StatCard
            icon={CheckCircle2}
            label="Resolvidos"
            value={resolvidos.length}
            color="green"
          />
        </div>
      )}

      {/* Tickets list */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Meus chamados
          <span className="ml-2 text-sm font-normal text-slate-500">
            ({sortedTickets.length})
          </span>
        </h2>

        {loading && sortedTickets.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 skeleton h-24" />
            ))}
          </div>
        ) : sortedTickets.length === 0 ? (
          <div className="card p-12 text-center">
            <TicketIcon size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhum chamado ainda</p>
            <p className="text-slate-400 text-sm mt-1">
              Quando você abrir um chamado, ele aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="card p-4">
      <div className={`w-9 h-9 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Link href={`/tickets/${ticket.id}`} className="card-hover block p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <StatusBadge status={ticket.status} size="sm" />
            <PriorityBadge priority={ticket.prioridade} size="sm" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">
            {ticket.titulo}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {ticket.categoria.nome} ·{' '}
            {formatDistanceToNow(new Date(ticket.criadoEm), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
        <ChevronRight size={16} className="text-slate-300 shrink-0 mt-0.5" />
      </div>
      {ticket.atribuidoA && (
        <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-[9px] font-bold text-brand-600">
              {ticket.atribuidoA.nome.charAt(0)}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Atendido por {ticket.atribuidoA.nome}
          </span>
        </div>
      )}
    </Link>
  );
}
