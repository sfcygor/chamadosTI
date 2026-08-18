'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { auditApi } from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import {
  Activity,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  Tag,
  MessageSquare,
  Ticket,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function AuditPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  const [filters, setFilters] = useState({
    q: '',
    tipoRecurso: '',
    dataInicio: '',
    dataFim: '',
  });

  const loadLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await auditApi.list({ ...filters, page: String(page) });
      setLogs(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      toast.error('Erro ao carregar logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user && user.papel !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (user) loadLogs();
  }, [user, loadLogs, router]);

  const handleExport = async () => {
    try {
      const res = await auditApi.list({ ...filters, limit: '1000' });
      
      const csvRows = [];
      csvRows.push(['ID', 'Data', 'Acao', 'Recurso', 'Descricao', 'Usuario', 'Email']);
      
      res.data.forEach((log: any) => {
        csvRows.push([
          log.id,
          format(new Date(log.criadoEm), 'dd/MM/yyyy HH:mm:ss'),
          log.acao,
          log.tipoRecurso,
          `"${log.descricao}"`,
          log.user?.nome || '-',
          log.userEmail || '-',
        ]);
      });

      const csvString = csvRows.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `auditoria_${format(new Date(), 'ddMMyyyy_HHmm')}.csv`);
      a.click();
    } catch (err: any) {
      toast.error('Erro ao exportar logs');
    }
  };

  const getResourceIcon = (tipo: string) => {
    switch (tipo) {
      case 'TICKET': return <Ticket size={14} className="text-blue-500" />;
      case 'USUARIO': return <User size={14} className="text-purple-500" />;
      case 'CATEGORIA': return <Tag size={14} className="text-emerald-500" />;
      case 'COMENTARIO': return <MessageSquare size={14} className="text-amber-500" />;
      case 'AUTH': return <Lock size={14} className="text-slate-500" />;
      default: return <Activity size={14} className="text-slate-400" />;
    }
  };

  const getActionBadge = (acao: string) => {
    let color = 'bg-slate-100 text-slate-700 border-slate-200';
    if (acao.includes('CRIADO') || acao.includes('SUCESSO')) color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (acao.includes('ATUALIZADO') || acao.includes('ASSUMIDO')) color = 'bg-blue-50 text-blue-700 border-blue-200';
    if (acao.includes('APAGADO') || acao.includes('FALHA')) color = 'bg-red-50 text-red-700 border-red-200';
    
    return (
      <span className={`px-2 py-1 rounded-md text-[10px] font-semibold border uppercase tracking-wider ${color}`}>
        {acao.replace(/_/g, ' ')}
      </span>
    );
  };

  if (!user || user.papel !== 'ADMIN') return null;

  return (
    <AppLayout title="Auditoria">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="text-brand-600" />
              Logs de Auditoria
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Registro inalteravel de todas as acoes do sistema.
            </p>
          </div>
          <button onClick={handleExport} className="btn-secondary text-sm h-10">
            <Download size={16} />
            Exportar CSV
          </button>
        </div>

        {/* Filters */}
        <div className="card p-4 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="input-label text-xs">Busca rapida</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Email, acao, ou descricao..."
                className="input pl-9"
                value={filters.q}
                onChange={e => setFilters({ ...filters, q: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && loadLogs()}
              />
            </div>
          </div>
          <div className="w-48">
            <label className="input-label text-xs">Tipo de Recurso</label>
            <select
              className="select"
              value={filters.tipoRecurso}
              onChange={e => setFilters({ ...filters, tipoRecurso: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="AUTH">Autenticacao</option>
              <option value="TICKET">Chamados</option>
              <option value="COMENTARIO">Comentarios / Notas</option>
              <option value="USUARIO">Usuarios</option>
              <option value="CATEGORIA">Categorias</option>
            </select>
          </div>
          <div className="w-40">
            <label className="input-label text-xs">Data Inicial</label>
            <input
              type="date"
              className="input"
              value={filters.dataInicio}
              onChange={e => setFilters({ ...filters, dataInicio: e.target.value })}
            />
          </div>
          <div className="w-40">
            <label className="input-label text-xs">Data Final</label>
            <input
              type="date"
              className="input"
              value={filters.dataFim}
              onChange={e => setFilters({ ...filters, dataFim: e.target.value })}
            />
          </div>
          <button onClick={() => loadLogs(1)} className="btn-primary h-10 px-6">
            Filtrar
          </button>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs">Data/Hora</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs">Acao</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs">Recurso</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs">Usuario</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs">Descricao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">Carregando logs...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">Nenhum registro encontrado.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                        {format(new Date(log.criadoEm), 'dd/MM/yyyy HH:mm:ss')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getActionBadge(log.acao)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getResourceIcon(log.tipoRecurso)}
                          <span className="text-xs font-medium text-slate-700">
                            {log.tipoRecurso}
                            {log.recursoId && <span className="text-slate-400 ml-1">#{log.recursoId.slice(-6).toUpperCase()}</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-900">{log.user?.nome || 'Sistema / Anonimo'}</span>
                          <span className="text-[10px] text-slate-500">{log.userEmail || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-md truncate" title={log.descricao}>
                        {log.descricao}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-500">
                Mostrando página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
              </span>
              <div className="flex gap-1">
                <button
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  disabled={pagination.page === 1}
                  onClick={() => loadLogs(pagination.page - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => loadLogs(pagination.page + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
