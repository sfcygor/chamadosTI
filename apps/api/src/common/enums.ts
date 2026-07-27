/**
 * Shared enum constants for SQLite compatibility.
 * SQLite does not support native Prisma enums, so we use string constants.
 */

export const Role = {
  COLABORADOR: 'COLABORADOR',
  AGENTE: 'AGENTE',
  ADMIN: 'ADMIN',
} as const;

export type Role = typeof Role[keyof typeof Role];

export const Priority = {
  NAO_CLASSIFICADA: 'NAO_CLASSIFICADA',
  BAIXA: 'BAIXA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA',
  CRITICA: 'CRITICA',
} as const;

export type Priority = typeof Priority[keyof typeof Priority];

export const TicketStatus = {
  NOVO: 'NOVO',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  AGUARDANDO_USUARIO: 'AGUARDANDO_USUARIO',
  RESOLVIDO: 'RESOLVIDO',
  FECHADO: 'FECHADO',
} as const;

export type TicketStatus = typeof TicketStatus[keyof typeof TicketStatus];
