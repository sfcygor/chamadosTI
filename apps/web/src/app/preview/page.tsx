'use client';

import { useState, useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Search, Plus, Filter,
  AlertTriangle, Clock,
  User, CheckCircle2, Circle, Timer, Layers,
  ArrowUpRight, TrendingUp, Star, MessageSquare, Paperclip,
  X,
  Sparkles,
  Tag, ShieldAlert,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/* ─── Demo data ────────────────────────────────────────────────── */
const DEMO_TICKETS = [
  {
    id: 'a1b2c3d4e5f6',
    titulo: 'Computador não liga após atualização do Windows',
    prioridade: 'CRITICA',
    status: 'NOVO',
    categoria: { nome: 'Hardware', slaHoras: 4 },
    criadoPor: { nome: 'João Silva' },
    atribuidoA: null,
    criadoEm: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    comentarios: 2,
    anexos: 1,
  },
  {
    id: 'b2c3d4e5f6g7',
    titulo: 'VPN não conecta fora da empresa',
    prioridade: 'ALTA',
    status: 'NOVO',
    categoria: { nome: 'Rede', slaHoras: 8 },
    criadoPor: { nome: 'Maria Santos' },
    atribuidoA: { nome: 'Carlos TI' },
    criadoEm: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    comentarios: 5,
    anexos: 0,
  },
  {
    id: 'c3d4e5f6g7h8',
    titulo: 'Teclado com teclas travando constantemente',
    prioridade: 'MEDIA',
    status: 'NOVO',
    categoria: { nome: 'Hardware', slaHoras: 24 },
    criadoPor: { nome: 'Pedro RH' },
    atribuidoA: null,
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    comentarios: 0,
    anexos: 2,
  },
  {
    id: 'd4e5f6g7h8i9',
    titulo: 'Instalar AutoCAD 2025 na máquina do engenheiro',
    prioridade: 'BAIXA',
    status: 'NOVO',
    categoria: { nome: 'Software', slaHoras: 48 },
    criadoPor: { nome: 'Ana TI' },
    atribuidoA: null,
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    comentarios: 1,
    anexos: 0,
  },
  {
    id: 'e5f6g7h8i9j0',
    titulo: 'Outlook não sincroniza e-mails do servidor Exchange',
    prioridade: 'CRITICA',
    status: 'EM_ANDAMENTO',
    categoria: { nome: 'E-mail', slaHoras: 4 },
    criadoPor: { nome: 'Roberto Dir' },
    atribuidoA: { nome: 'Ana TI' },
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    comentarios: 8,
    anexos: 3,
  },
  {
    id: 'f6g7h8i9j0k1',
    titulo: 'Impressora HP não reconhecida na rede após troca de switch',
    prioridade: 'ALTA',
    status: 'EM_ANDAMENTO',
    categoria: { nome: 'Rede', slaHoras: 8 },
    criadoPor: { nome: 'Fernanda Fin' },
    atribuidoA: { nome: 'Carlos TI' },
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    comentarios: 4,
    anexos: 1,
  },
  {
    id: 'g7h8i9j0k1l2',
    titulo: 'Acesso ao sistema de RH bloqueado após troca de senha',
    prioridade: 'MEDIA',
    status: 'AGUARDANDO_USUARIO',
    categoria: { nome: 'Acesso', slaHoras: 24 },
    criadoPor: { nome: 'Luciana RH' },
    atribuidoA: { nome: 'Carlos TI' },
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    comentarios: 6,
    anexos: 0,
  },
  {
    id: 'h8i9j0k1l2m3',
    titulo: 'Monitor exibindo listras horizontais na tela',
    prioridade: 'BAIXA',
    status: 'RESOLVIDO',
    categoria: { nome: 'Hardware', slaHoras: 48 },
    criadoPor: { nome: 'Marcos TI' },
    atribuidoA: { nome: 'Ana TI' },
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    comentarios: 3,
    anexos: 2,
  },
  {
    id: 'i9j0k1l2m3n4',
    titulo: 'Lentidão extrema no sistema ERP durante fechamento mensal',
    prioridade: 'CRITICA',
    status: 'RESOLVIDO',
    categoria: { nome: 'Software', slaHoras: 4 },
    criadoPor: { nome: 'Simone Fin' },
    atribuidoA: { nome: 'Carlos TI' },
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    comentarios: 12,
    anexos: 4,
  },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; }> = {
  CRITICA:          { label: 'Crítica',          color: '#ff4560', bg: 'rgba(255,69,96,0.15)',   icon: ShieldAlert   },
  ALTA:             { label: 'Alta',             color: '#ff9f43', bg: 'rgba(255,159,67,0.15)',  icon: ArrowUpRight  },
  MEDIA:            { label: 'Média',            color: '#4b9fff', bg: 'rgba(75,159,255,0.15)',  icon: TrendingUp    },
  BAIXA:            { label: 'Baixa',            color: '#5ce65c', bg: 'rgba(92,230,92,0.15)',   icon: CheckCircle2  },
  NAO_CLASSIFICADA: { label: 'Não classificada', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  icon: Circle        },
};

const COLUMNS = [
  { id: 'NOVO',               label: 'Novos',         accent: '#6366f1', icon: Circle       },
  { id: 'EM_ANDAMENTO',       label: 'Em Andamento',  accent: '#f59e0b', icon: Timer        },
  { id: 'AGUARDANDO_USUARIO', label: 'Aguardando',    accent: '#06b6d4', icon: Clock        },
  { id: 'RESOLVIDO',          label: 'Resolvidos',    accent: '#10b981', icon: CheckCircle2 },
];

const STATS = [
  { label: 'Total Abertos',   value: '24', change: '+3 hoje',      color: '#6366f1', icon: Layers       },
  { label: 'Críticos',        value: '3',  change: '▲ atenção',   color: '#ff4560', icon: ShieldAlert  },
  { label: 'SLA Estourado',   value: '7',  change: '29% do total', color: '#f59e0b', icon: AlertTriangle},
  { label: 'Resolvidos Hoje', value: '11', change: '↑ 22%',        color: '#10b981', icon: CheckCircle2 },
];

/* ─── Page ───────────────────────────────────────────────────────── */
export default function PreviewPage() {
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [tickets, setTickets] = useState(DEMO_TICKETS);
  const dragRef = useRef<typeof DEMO_TICKETS[0] | null>(null);

  const getColTickets = (colId: string) =>
    tickets.filter((t) => {
      const matchStatus = colId === 'RESOLVIDO'
        ? t.status === 'RESOLVIDO' || t.status === 'FECHADO'
        : t.status === colId;
      const matchSearch = search
        ? t.titulo.toLowerCase().includes(search.toLowerCase()) ||
          t.criadoPor.nome.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchPriority = filterPriority ? t.prioridade === filterPriority : true;
      return matchStatus && matchSearch && matchPriority;
    });

  const handleDrop = (targetColId: string) => {
    const ticket = dragRef.current;
    if (!ticket) return;
    const newStatus = targetColId;
    setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, status: newStatus } : t));
    setDraggingId(null);
    setOverCol(null);
    dragRef.current = null;
  };

  const criticalUnassigned = tickets.filter(
    (t) => t.prioridade === 'CRITICA' && !t.atribuidoA && t.status === 'NOVO'
  ).length;

  return (
    <AppLayout>
      <div style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1321 50%, #0a1628 100%)', minHeight: '100vh' }}>

        {/* ── Top bar ───────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 20,
        }} className="px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.5)', borderRadius: '12px', padding: '8px' }}>
              <Layers size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">Quadro de Chamados</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Visão Kanban • Tempo real</p>
            </div>
            <span style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', fontSize: '9px', fontWeight: 700, letterSpacing: '1px', padding: '2px 8px', borderRadius: '999px' }}>
              PREVIEW
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} style={{ color: 'rgba(255,255,255,0.3)', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar chamados..."
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px', padding: '7px 12px 7px 34px', outline: 'none', width: '200px' }}
              />
            </div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: filterPriority ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '12px', padding: '7px 12px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Todas as prioridades</option>
              <option value="CRITICA">🔴 Crítica</option>
              <option value="ALTA">🟠 Alta</option>
              <option value="MEDIA">🔵 Média</option>
              <option value="BAIXA">🟢 Baixa</option>
            </select>
            {(search || filterPriority) && (
              <button onClick={() => { setSearch(''); setFilterPriority(''); }}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '7px 10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <X size={12} /> Limpar
              </button>
            )}
            <button style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '10px', padding: '7px 14px', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}>
              <Plus size={14} /> Novo Chamado
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-6">

          {/* ── Stats ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${stat.color}30`, borderRadius: '16px', padding: '16px', position: 'relative', overflow: 'hidden', transition: 'all 0.2s', cursor: 'default' }}>
                  <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '80px', height: '80px', borderRadius: '50%', background: `${stat.color}15`, filter: 'blur(20px)' }} />
                  <div className="flex items-start justify-between mb-2">
                    <div style={{ background: `${stat.color}20`, borderRadius: '10px', padding: '7px' }}>
                      <Icon size={16} style={{ color: stat.color }} />
                    </div>
                    <span style={{ fontSize: '28px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{stat.value}</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '4px' }}>{stat.label}</p>
                  <p style={{ color: stat.color, fontSize: '11px', fontWeight: 600 }}>{stat.change}</p>
                </div>
              );
            })}
          </div>

          {/* ── Critical alert ──────────────────────────────────── */}
          {criticalUnassigned > 0 && (
            <div style={{ background: 'linear-gradient(135deg, rgba(255,69,96,0.12), rgba(255,69,96,0.04))', border: '1px solid rgba(255,69,96,0.35)', borderRadius: '14px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(255,69,96,0.2)', borderRadius: '10px', padding: '8px', flexShrink: 0 }}>
                <ShieldAlert size={18} style={{ color: '#ff4560' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#ff4560', fontWeight: 700, fontSize: '13px' }}>
                  {criticalUnassigned} chamado(s) crítico(s) sem responsável!
                </p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>Atribua um agente imediatamente</p>
              </div>
              <button style={{ background: 'rgba(255,69,96,0.2)', border: '1px solid rgba(255,69,96,0.4)', borderRadius: '8px', color: '#ff4560', fontWeight: 600, fontSize: '12px', padding: '6px 12px', cursor: 'pointer' }}>
                Ver críticos →
              </button>
            </div>
          )}

          {/* ── Kanban Board ────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" style={{ alignItems: 'start' }}>
            {COLUMNS.map((col) => {
              const colTickets = getColTickets(col.id);
              const isDragOver = overCol === col.id;
              const ColIcon = col.icon;
              return (
                <div
                  key={col.id}
                  style={{ background: isDragOver ? `${col.accent}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${isDragOver ? col.accent + '60' : 'rgba(255,255,255,0.07)'}`, borderRadius: '20px', display: 'flex', flexDirection: 'column', minHeight: '520px', maxHeight: 'calc(100vh - 300px)', transition: 'all 0.2s', boxShadow: isDragOver ? `0 0 30px ${col.accent}20` : 'none' }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverCol(col.id); }}
                  onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null); }}
                  onDrop={(e) => { e.preventDefault(); handleDrop(col.id); }}
                >
                  {/* Header */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <div style={{ background: `${col.accent}20`, borderRadius: '8px', padding: '5px' }}>
                      <ColIcon size={14} style={{ color: col.accent }} />
                    </div>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '13px', flex: 1 }}>{col.label}</span>
                    <span style={{ background: `${col.accent}25`, color: col.accent, fontWeight: 700, fontSize: '12px', padding: '2px 8px', borderRadius: '999px', border: `1px solid ${col.accent}40` }}>
                      {colTickets.length}
                    </span>
                  </div>

                  {isDragOver && (
                    <div style={{ margin: '12px 12px 0', border: `2px dashed ${col.accent}80`, borderRadius: '12px', padding: '12px', textAlign: 'center', color: col.accent, fontSize: '12px', fontWeight: 600, background: `${col.accent}08`, flexShrink: 0 }}>
                      ⬇ Soltar aqui
                    </div>
                  )}

                  {/* Cards */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {colTickets.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.25, minHeight: '200px' }}>
                        <ColIcon size={28} style={{ color: col.accent }} />
                        <p style={{ color: '#fff', fontSize: '12px' }}>Vazio</p>
                      </div>
                    ) : (
                      colTickets.map((ticket) => (
                        <KanbanCard
                          key={ticket.id}
                          ticket={ticket}
                          isDragging={draggingId === ticket.id}
                          onDragStart={() => { setDraggingId(ticket.id); dragRef.current = ticket; }}
                          onDragEnd={() => { setDraggingId(null); setOverCol(null); dragRef.current = null; }}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Preview footer note ─────────────────────────────── */}
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '99px', padding: '8px 16px' }}>
              <Sparkles size={14} style={{ color: '#6366f1' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                Esta é uma <strong style={{ color: '#6366f1' }}>página de preview</strong> com dados fictícios. Aprove para aplicar ao sistema real.
              </span>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}

/* ─── Kanban Card ──────────────────────────────────────────────── */
function KanbanCard({ ticket, isDragging, onDragStart, onDragEnd }: {
  ticket: typeof DEMO_TICKETS[0];
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const cfg = PRIORITY_CONFIG[ticket.prioridade] || PRIORITY_CONFIG['NAO_CLASSIFICADA'];
  const PrioIcon = cfg.icon;
  const horasPassadas = Math.floor((Date.now() - new Date(ticket.criadoEm).getTime()) / (1000 * 60 * 60));
  const slaEstourado = horasPassadas > ticket.categoria.slaHoras;
  const initials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isDragging ? 'rgba(255,255,255,0.02)' : hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${hovered ? cfg.color + '50' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '14px',
        padding: '14px',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? 'scale(0.97) rotate(1deg)' : hovered ? 'translateY(-2px)' : 'none',
        transition: 'all 0.18s ease',
        boxShadow: hovered && !isDragging ? `0 8px 30px rgba(0,0,0,0.3), 0 0 0 1px ${cfg.color}25` : '0 2px 8px rgba(0,0,0,0.2)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${cfg.color}90, ${cfg.color}20)`, opacity: hovered ? 1 : 0.5, transition: 'opacity 0.2s' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
          <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}40`, borderRadius: '6px', padding: '3px 7px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <PrioIcon size={10} style={{ color: cfg.color }} />
            <span style={{ color: cfg.color, fontSize: '10px', fontWeight: 700 }}>{cfg.label}</span>
          </div>
          {slaEstourado && ticket.status !== 'RESOLVIDO' && (
            <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '6px', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <AlertTriangle size={9} style={{ color: '#f59e0b' }} />
              <span style={{ color: '#f59e0b', fontSize: '9px', fontWeight: 700 }}>SLA</span>
            </div>
          )}
        </div>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontFamily: 'monospace', flexShrink: 0 }}>
          #{ticket.id.slice(-6).toUpperCase()}
        </span>
      </div>

      {/* Title */}
      <p style={{ color: hovered ? '#fff' : 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '13px', lineHeight: '1.4', marginBottom: '10px', transition: 'color 0.15s', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {ticket.titulo}
      </p>

      {/* Category */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
        <Tag size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>{ticket.categoria.nome}</span>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {ticket.atribuidoA ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `linear-gradient(135deg, ${cfg.color}60, ${cfg.color}30)`, border: `1px solid ${cfg.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
              {initials(ticket.atribuidoA.nome)}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>{ticket.atribuidoA.nome.split(' ')[0]}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={10} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontStyle: 'italic' }}>Sem responsável</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {ticket.comentarios > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <MessageSquare size={10} style={{ color: 'rgba(255,255,255,0.25)' }} />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>{ticket.comentarios}</span>
            </div>
          )}
          {ticket.anexos > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Paperclip size={10} style={{ color: 'rgba(255,255,255,0.25)' }} />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>{ticket.anexos}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={10} style={{ color: 'rgba(255,255,255,0.2)' }} />
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>
              {formatDistanceToNow(new Date(ticket.criadoEm), { locale: ptBR })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
