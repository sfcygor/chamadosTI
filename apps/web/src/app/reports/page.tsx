'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import { reportsApi } from '@/lib/api';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Star,
  Users,
  Ticket,
  CheckCircle2,
  Download,
  FileText,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReportsPage() {
  return (
    <AppLayout>
      <ReportsDashboard />
    </AppLayout>
  );
}

function ReportsDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('30');

  const load = async () => {
    setLoading(true);
    try {
      const summary = await reportsApi.summary(periodo);
      setData(summary);
    } catch (err: any) {
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [periodo]);

  const handleExportCsv = async () => {
    try {
      toast.success('Gerando relatório CSV...');
      const blob = await reportsApi.exportCsv(periodo);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_chamados_${periodo}dias.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Relatório CSV baixado!');
    } catch (err) {
      toast.error('Erro ao exportar CSV');
    }
  };

  const handleExportPdf = async () => {
    try {
      toast.success('Gerando PDF, aguarde...');
      const tickets = await reportsApi.exportJson(periodo);
      
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(16);
      doc.text(`Relatório de Chamados - Últimos ${periodo} dias`, 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 28);
      
      const tableData = tickets.map(t => [
        `#${t.ID.slice(-6).toUpperCase()}`,
        t.Titulo.length > 30 ? t.Titulo.substring(0, 30) + '...' : t.Titulo,
        t.Status,
        t.Prioridade,
        t.Categoria,
        t.CriadoPor,
        t.AtribuidoA || '-',
        format(new Date(t.CriadoEm), 'dd/MM/yyyy HH:mm'),
        t.SLA_Estourado === 'Sim' ? 'Sim' : 'Não'
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['ID', 'Título', 'Status', 'Prioridade', 'Categoria', 'Solicitante', 'Atribuído', 'Criado em', 'SLA Estourou']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [15, 23, 42] } // slate-900 color
      });

      doc.save(`relatorio_chamados_${periodo}dias.pdf`);
      toast.success('Relatório PDF baixado!');
    } catch (err) {
      toast.error('Erro ao exportar PDF');
    }
  };

  if (loading) {
    return (
      <div className="content-wrapper">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 skeleton h-28" />
          ))}
        </div>
      </div>
    );
  }

  const STATUS_LABELS: Record<string, string> = {
    NOVO: 'Novos',
    EM_ANDAMENTO: 'Em andamento',
    AGUARDANDO_USUARIO: 'Aguardando',
    RESOLVIDO: 'Resolvidos',
    FECHADO: 'Fechados',
  };

  const PRIORITY_LABELS: Record<string, string> = {
    BAIXA: 'Baixa',
    MEDIA: 'Média',
    ALTA: 'Alta',
    CRITICA: 'Crítica',
  };

  const PRIORITY_COLORS: Record<string, string> = {
    BAIXA: 'bg-slate-200',
    MEDIA: 'bg-blue-400',
    ALTA: 'bg-orange-400',
    CRITICA: 'bg-red-500',
  };

  return (
    <div className="content-wrapper animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Visão geral do desempenho do suporte
          </p>
        </div>
        <div className="flex gap-2">
          {['7', '30', '90'].map((d) => (
            <button
              key={d}
              onClick={() => setPeriodo(d)}
              className={`text-sm px-4 py-2 rounded-xl font-medium transition-all ${
                periodo === d
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={handleExportCsv}
            className="text-sm px-4 py-2 rounded-xl font-medium transition-all bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 flex items-center gap-2 ml-2"
          >
            <Download size={16} />
            CSV
          </button>
          <button
            onClick={handleExportPdf}
            className="text-sm px-4 py-2 rounded-xl font-medium transition-all bg-red-600 text-white shadow-sm hover:bg-red-700 flex items-center gap-2 ml-2"
          >
            <FileText size={16} />
            PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <KPICard
          icon={Ticket}
          label="Total de chamados"
          value={data?.totalTickets || 0}
          color="blue"
        />
        <KPICard
          icon={Clock}
          label="Tempo médio de resolução"
          value={`${data?.tmrHoras || 0}h`}
          color="orange"
          isString
        />

        <KPICard
          icon={CheckCircle2}
          label="Resolvidos no período"
          value={
            data?.ticketsPorStatus?.find((s: any) => s.status === 'RESOLVIDO')?._count?.id || 0
          }
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Por status */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <BarChart3 size={15} className="text-blue-600" />
            </div>
            Chamados por status
          </h2>
          <div className="space-y-3">
            {data?.ticketsPorStatus?.map((item: any) => {
              const pct = data.totalTickets
                ? Math.round((item._count.id / data.totalTickets) * 100)
                : 0;
              return (
                <div key={item.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{STATUS_LABELS[item.status] || item.status}</span>
                    <span className="font-semibold text-slate-900">
                      {item._count.id}{' '}
                      <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Por prioridade */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={15} className="text-orange-600" />
            </div>
            Chamados por prioridade
          </h2>
          <div className="space-y-3">
            {data?.ticketsPorPrioridade?.map((item: any) => {
              const pct = data.totalTickets
                ? Math.round((item._count.id / data.totalTickets) * 100)
                : 0;
              return (
                <div key={item.prioridade}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">
                      {PRIORITY_LABELS[item.prioridade] || item.prioridade}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {item._count.id}{' '}
                      <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`${PRIORITY_COLORS[item.prioridade] || 'bg-slate-400'} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categorias mais frequentes */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">
            Categorias mais frequentes
          </h2>
          <div className="space-y-2">
            {data?.ticketsPorCategoria?.slice(0, 7).map((item: any, i: number) => (
              <div key={item.categoria} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 w-4 text-right">
                  {i + 1}
                </span>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-slate-700">{item.categoria}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  color,
  sub,
  isString = false,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
  isString?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="card p-5">
      <div className={`w-9 h-9 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon size={18} />
      </div>
      <p className={`font-bold text-slate-900 ${isString ? 'text-xl' : 'text-2xl'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
