'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ticketsApi, categoriesApi } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { 
  Search, 
  Filter, 
  RefreshCw,
  Archive,
  Calendar,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function HistoryView() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Pagination & Stats
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [prioridade, setPrioridade] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ticketsApi.history({
        page: page.toString(),
        limit: '20',
        q,
        prioridade,
        categoriaId,
        dataInicio,
        dataFim
      });
      
      setTickets(res.data || []);
      setTotalItems(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err: any) {
      toast.error('Erro ao carregar histórico: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [page, q, prioridade, categoriaId, dataInicio, dataFim, toast]);

  useEffect(() => {
    // Load categories for filter
    categoriesApi.list().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQ(search);
  };

  const clearFilters = () => {
    setSearch('');
    setQ('');
    setPrioridade('');
    setCategoriaId('');
    setDataInicio('');
    setDataFim('');
    setPage(1);
  };

  const hasActiveFilters = q || prioridade || categoriaId || dataInicio || dataFim;

  if (user?.papel === 'COLABORADOR') {
    return (
      <div className="p-8 text-center text-slate-400">
        <AlertCircle className="mx-auto mb-4" size={48} />
        <h2 className="text-xl">Acesso Negado</h2>
        <p>Você não tem permissão para visualizar o histórico geral.</p>
      </div>
    );
  }

  const PriorityBadge = ({ p }: { p: string }) => {
    const map: any = {
      BAIXA: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      MEDIA: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      ALTA: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      CRITICA: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${map[p] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
        {p.replace('_', ' ')}
      </span>
    );
  };

  const StatusBadge = ({ s }: { s: string }) => {
    if (s === 'RESOLVIDO') return <span className="text-emerald-400 text-xs font-medium">Resolvido</span>;
    if (s === 'FECHADO') return <span className="text-slate-400 text-xs font-medium">Fechado</span>;
    return <span>{s}</span>;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Archive className="text-brand-600" />
            Histórico de Chamados
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Consulta completa de chamados resolvidos ou fechados.
          </p>
        </div>
        
        {stats && (
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total Arquivados</p>
              <p className="text-xl font-bold text-slate-900 leading-none">{stats.totalFechados}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por ID, título ou solicitante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <button type="submit" className="btn-primary py-2">Buscar</button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Filter size={16} /> Filtros:
          </div>
          
          <select
            value={prioridade}
            onChange={(e) => { setPrioridade(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">Todas Prioridades</option>
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
            <option value="CRITICA">Crítica</option>
          </select>

          <select
            value={categoriaId}
            onChange={(e) => { setCategoriaId(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">Todas Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-500" />
            <input 
              type="date" 
              value={dataInicio}
              onChange={(e) => { setDataInicio(e.target.value); setPage(1); }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-brand-500"
            />
            <span className="text-slate-500 text-sm">até</span>
            <input 
              type="date" 
              value={dataFim}
              onChange={(e) => { setDataFim(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
            />
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 ml-auto">
              <X size={14} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {loading && tickets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <RefreshCw size={24} className="animate-spin mb-4 text-brand-500" />
            <p>Buscando no arquivo...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Archive size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">Nenhum chamado encontrado no histórico.</p>
            {hasActiveFilters && <p className="text-sm mt-1">Tente remover alguns filtros.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Chamado</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Prioridade</th>
                  <th className="px-4 py-3 font-medium">Aberto por</th>
                  <th className="px-4 py-3 font-medium">Resolvido Em</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors group bg-white">
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      <Link href={`/tickets/${t.id}`} className="hover:text-brand-600">
                        #{t.id.split('-')[0]}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/tickets/${t.id}`} className="block">
                        <span className="text-brand-600 font-semibold group-hover:text-brand-800 transition-colors line-clamp-1">{t.titulo}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{t.categoria.nome}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <PriorityBadge p={t.prioridade} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="line-clamp-1">{t.criadoPor.nome}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {t.resolvidoEm ? format(new Date(t.resolvidoEm), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge s={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400 px-2">
          <div>
            Mostrando página <span className="text-slate-900 font-medium">{page}</span> de <span className="text-slate-900 font-medium">{totalPages}</span> 
            <span className="ml-2 text-slate-500">({totalItems} registros)</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 transition-colors text-slate-700"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 transition-colors text-slate-700"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
