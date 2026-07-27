import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus } from '../common/enums';
import { parse } from 'json2csv';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSummary(periodo?: string) {
    const diasAtras = parseInt(periodo || '30');
    const desde = new Date();
    desde.setDate(desde.getDate() - diasAtras);

    const [
      totalTickets,
      ticketsPorStatus,
      ticketsPorPrioridade,
      ticketsPorCategoria,
      ticketsResolvidos,
    ] = await Promise.all([
      this.prisma.ticket.count({
        where: { criadoEm: { gte: desde } },
      }),
      this.prisma.ticket.groupBy({
        by: ['status'],
        where: { criadoEm: { gte: desde } },
        _count: { id: true },
      }),
      this.prisma.ticket.groupBy({
        by: ['prioridade'],
        where: { criadoEm: { gte: desde } },
        _count: { id: true },
      }),
      this.prisma.ticket.groupBy({
        by: ['categoriaId'],
        where: { criadoEm: { gte: desde } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),

      this.prisma.ticket.findMany({
        where: {
          status: TicketStatus.RESOLVIDO,
          resolvidoEm: { not: null },
          criadoEm: { gte: desde },
        },
        select: {
          criadoEm: true,
          resolvidoEm: true,
        },
      }),
    ]);

    // Calcular TMR (Tempo Médio de Resolução)
    let tmrHoras = 0;
    if (ticketsResolvidos.length > 0) {
      const totalMs = ticketsResolvidos.reduce((acc, t) => {
        if (!t.resolvidoEm) return acc;
        return acc + (t.resolvidoEm.getTime() - t.criadoEm.getTime());
      }, 0);
      tmrHoras = Math.round(totalMs / ticketsResolvidos.length / (1000 * 60 * 60));
    }

    // Buscar nomes das categorias
    const categoryIds = ticketsPorCategoria.map((t) => t.categoriaId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, nome: true },
    });

    const categoriaMap = Object.fromEntries(categories.map((c) => [c.id, c.nome]));

    return {
      periodo: `${diasAtras} dias`,
      totalTickets,
      ticketsPorStatus,
      ticketsPorPrioridade,
      ticketsPorCategoria: ticketsPorCategoria.map((t) => ({
        categoria: categoriaMap[t.categoriaId] || 'Desconhecida',
        count: t._count.id,
      })),

      tmrHoras,
    };
  }

  async getExportData(filters: any) {
    const { status, dataInicio, dataFim, prioridade, categoriaId, atribuidoAId, criadoPorId } = filters;
    
    const where: any = {};
    if (status) where.status = status;
    if (prioridade) where.prioridade = prioridade;
    if (categoriaId) where.categoriaId = categoriaId;
    if (atribuidoAId) where.atribuidoAId = atribuidoAId;
    if (criadoPorId) where.criadoPorId = criadoPorId;

    if (dataInicio || dataFim) {
      where.criadoEm = {};
      if (dataInicio) where.criadoEm.gte = new Date(dataInicio);
      if (dataFim) {
        const endDate = new Date(dataFim);
        endDate.setUTCHours(23, 59, 59, 999);
        where.criadoEm.lte = endDate;
      }
    }

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: {
        categoria: true,
        criadoPor: true,
        atribuidoA: true,
      },
      orderBy: { criadoEm: 'desc' },
    });

    if (tickets.length === 0) {
      return [];
    }

    return tickets.map(t => ({
      ID: t.id,
      Titulo: t.titulo,
      Status: t.status,
      Prioridade: t.prioridade,
      Categoria: t.categoria?.nome || '',
      CriadoPor: t.criadoPor?.nome || '',
      Setor: t.criadoPor?.setor || '',
      AtribuidoA: t.atribuidoA?.nome || '',
      CriadoEm: t.criadoEm.toISOString(),
      ResolvidoEm: t.resolvidoEm?.toISOString() || '',
      FechadoEm: t.fechadoEm?.toISOString() || '',
      SLA_Estourado: (t.resolvidoEm || new Date()).getTime() - t.criadoEm.getTime() > (t.categoria?.slaHoras || 0) * 3600000 ? 'Sim' : 'Nao'
    }));
  }

  async exportToCsv(filters: any) {
    const data = await this.getExportData(filters);
    if (data.length === 0) return '';
    return parse(data, { delimiter: ';' });
  }

}
