export type Priority = 'NAO_CLASSIFICADA' | 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type TicketStatus = 'NOVO' | 'EM_ANDAMENTO' | 'AGUARDANDO_USUARIO' | 'RESOLVIDO' | 'FECHADO';
export type Role = 'COLABORADOR' | 'AGENTE' | 'ADMIN';

export interface User {
  id: string;
  nome: string;
  email: string;
  papel: Role;
  setor?: string;
}

export interface Category {
  id: string;
  nome: string;
  slaHoras: number;
  ativo: boolean;
}

export interface Ticket {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: Priority;
  status: TicketStatus;
  descricaoSolucao?: string;
  criadoEm: string;
  atualizadoEm: string;
  resolvidoEm?: string;
  fechadoEm?: string;
  assumidoEm?: string;
  categoria: Category;
  criadoPor: User;
  atribuidoA?: User;
  comentarios?: Comment[];
  anexos?: Attachment[];
  priorityLogs?: PriorityLog[];
  _count?: { comentarios: number; anexos: number };
}

export interface Comment {
  id: string;
  texto: string;
  isNotaInterna: boolean;
  criadoEm: string;
  autor: Pick<User, 'id' | 'nome' | 'papel'>;
}

export interface Attachment {
  id: string;
  nomeArquivo: string;
  url: string;
  tamanho?: number;
  mimeType?: string;
  criadoEm: string;
}

export interface PriorityLog {
  id: string;
  prioridadeAnterior: Priority;
  novaPrioridade: Priority;
  motivo?: string;
  criadoEm: string;
  alteradoPor: Pick<User, 'id' | 'nome'>;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<Priority, {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
}> = {
  NAO_CLASSIFICADA: {
    label: 'Não classificada',
    color: 'text-slate-500',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    dot: 'bg-slate-300',
  },
  BAIXA: {
    label: 'Baixa',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
  MEDIA: {
    label: 'Média',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  ALTA: {
    label: 'Alta',
    color: 'text-emerald-800',
    bg: 'bg-emerald-100',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
  },
  CRITICA: {
    label: 'Crítica',
    color: 'text-emerald-900',
    bg: 'bg-emerald-200',
    border: 'border-emerald-400',
    dot: 'bg-emerald-700',
  },
};

export const STATUS_CONFIG: Record<TicketStatus, {
  label: string;
  color: string;
  bg: string;
}> = {
  NOVO: { label: 'Novo', color: 'text-slate-700', bg: 'bg-slate-100' },
  EM_ANDAMENTO: { label: 'Em andamento', color: 'text-brand-700', bg: 'bg-brand-100' },
  AGUARDANDO_USUARIO: { label: 'Aguardando', color: 'text-brand-600', bg: 'bg-brand-50' },
  RESOLVIDO: { label: 'Resolvido', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  FECHADO: { label: 'Fechado', color: 'text-slate-600', bg: 'bg-slate-100' },
};

export const ROLE_LABELS: Record<Role, string> = {
  COLABORADOR: 'Colaborador',
  AGENTE: 'Agente TI',
  ADMIN: 'Administrador',
};
