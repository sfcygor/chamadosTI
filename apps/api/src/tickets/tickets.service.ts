import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, TicketStatus } from '../common/enums';
import { TicketsGateway } from '../websockets/tickets.gateway';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private ticketsGateway: TicketsGateway,
    private auditService: AuditService,
  ) {}

  async findAll(user: any, filters: any) {
    const { status, prioridade, categoriaId, atribuidoAId, page = 1, limit = 20 } = filters;

    const where: any = {};

    // Colaborador só vê seus próprios tickets
    if (user.papel === Role.COLABORADOR) {
      where.criadoPorId = user.sub;
    }

    if (status) where.status = status;
    if (prioridade) where.prioridade = prioridade;
    if (categoriaId) where.categoriaId = categoriaId;
    if (atribuidoAId) where.atribuidoAId = atribuidoAId;

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          categoria: true,
          criadoPor: { select: { id: true, nome: true, email: true, setor: true } },
          atribuidoA: { select: { id: true, nome: true, email: true } },
          _count: { select: { comentarios: true, anexos: true } },
        },
        orderBy: [
          // Críticos primeiro, depois por data
          { prioridade: 'desc' },
          { criadoEm: 'desc' },
        ],
        skip,
        take: Number(limit),
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        categoria: true,
        criadoPor: { select: { id: true, nome: true, email: true, setor: true } },
        atribuidoA: { select: { id: true, nome: true, email: true } },
        comentarios: {
          include: {
            autor: { select: { id: true, nome: true, papel: true } },
          },
          orderBy: { criadoEm: 'asc' },
        },
        anexos: true,
        priorityLogs: {
          include: {
            alteradoPor: { select: { id: true, nome: true } },
          },
          orderBy: { criadoEm: 'desc' },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Chamado não encontrado');

    // Colaborador só vê seus tickets
    if (
      user.papel === Role.COLABORADOR &&
      ticket.criadoPorId !== user.sub
    ) {
      throw new ForbiddenException('Acesso negado a este chamado');
    }

    // Filtrar notas internas para colaboradores
    if (user.papel === Role.COLABORADOR) {
      ticket.comentarios = ticket.comentarios.filter(
        (c) => !c.isNotaInterna,
      ) as any;
    }

    return ticket;
  }

  async create(data: any, userId: string) {
    const categoria = await this.prisma.category.findUnique({
      where: { id: data.categoriaId },
    });

    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    const newTicket = await this.prisma.ticket.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        categoriaId: data.categoriaId,
        prioridade: 'NAO_CLASSIFICADA',
        criadoPorId: userId,
      },
      include: {
        categoria: true,
        criadoPor: { select: { id: true, nome: true, email: true } },
      },
    });

    this.ticketsGateway.emitTicketCreated(newTicket);

    this.auditService.log({
      acao: 'TICKET_CRIADO',
      tipoRecurso: 'TICKET',
      recursoId: newTicket.id,
      descricao: `Ticket #${newTicket.id.slice(-8).toUpperCase()} criado na categoria "${newTicket.categoria.nome}"`,
      userId,
    });

    return newTicket;
  }

  async update(id: string, data: any, user: any) {
    const ticket = await this.prisma.ticket.findUnique({ 
      where: { id },
      include: { categoria: true }
    });
    if (!ticket) throw new NotFoundException('Chamado não encontrado');

    // Somente agentes/admins podem atualizar campos protegidos
    if (user.papel === Role.COLABORADOR) {
      throw new ForbiddenException('Colaboradores não podem atualizar chamados');
    }

    const updateData: any = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.atribuidoAId !== undefined) updateData.atribuidoAId = data.atribuidoAId;
    if (data.categoriaId !== undefined) updateData.categoriaId = data.categoriaId;
    if (data.descricaoSolucao !== undefined) updateData.descricaoSolucao = data.descricaoSolucao;

    // Log de mudança de prioridade
    if (data.prioridade !== undefined && data.prioridade !== ticket.prioridade) {
      await this.prisma.priorityLog.create({
        data: {
          ticketId: id,
          alteradoPorId: user.sub,
          prioridadeAnterior: ticket.prioridade,
          novaPrioridade: data.prioridade,
          motivo: data.motivoPrioridade || null,
        },
      });
      updateData.prioridade = data.prioridade;

      this.auditService.log({
        acao: 'PRIORIDADE_ALTERADA',
        tipoRecurso: 'TICKET',
        recursoId: id,
        descricao: `Prioridade alterada de ${ticket.prioridade} para ${data.prioridade}${data.motivoPrioridade ? ` (Motivo: ${data.motivoPrioridade})` : ''}`,
        metadata: { de: ticket.prioridade, para: data.prioridade, motivo: data.motivoPrioridade },
        userId: user.sub,
        userEmail: user.email,
        userPapel: user.papel,
      });
    }

    // Atualizar timestamps baseados no status
    if (data.status === TicketStatus.RESOLVIDO && !ticket.resolvidoEm) {
      updateData.resolvidoEm = new Date();
    }
    if (data.status === TicketStatus.FECHADO && !ticket.fechadoEm) {
      updateData.fechadoEm = new Date();
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        categoria: true,
        criadoPor: { select: { id: true, nome: true, email: true } },
        atribuidoA: { select: { id: true, nome: true, email: true } },
      },
    });

    if (ticket.status !== data.status && data.status !== undefined) {
      this.auditService.log({
        acao: 'TICKET_ATUALIZADO',
        tipoRecurso: 'TICKET',
        recursoId: id,
        descricao: `Status do ticket alterado para ${data.status}`,
        metadata: { de: ticket.status, para: data.status },
        userId: user.sub,
        userEmail: user.email,
        userPapel: user.papel,
      });
    }

    this.ticketsGateway.emitTicketUpdated(updatedTicket);
    return updatedTicket;
  }

  async assume(id: string, user: any) {
    if (user.papel === Role.COLABORADOR) {
      throw new ForbiddenException('Apenas agentes podem assumir chamados');
    }

    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Chamado não encontrado');

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        atribuidoAId: user.sub,
        status: ticket.status === TicketStatus.NOVO ? TicketStatus.EM_ANDAMENTO : ticket.status,
        assumidoEm: new Date(),
      },
      include: {
        atribuidoA: { select: { id: true, nome: true, email: true } },
        criadoPor: { select: { id: true, nome: true, email: true } },
        categoria: true,
      },
    });

    this.auditService.log({
      acao: 'TICKET_ASSUMIDO',
      tipoRecurso: 'TICKET',
      recursoId: id,
      descricao: `${user.email} assumiu o ticket #${id.slice(-8).toUpperCase()}`,
      userId: user.sub,
      userEmail: user.email,
      userPapel: user.papel,
    });

    this.ticketsGateway.emitTicketUpdated(updated);
    return updated;
  }


  async deleteResolved(id: string, adminUser: any) {
    // Segurança: apenas ADMIN
    if (adminUser.papel !== Role.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem apagar chamados');
    }

    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Chamado não encontrado');

    // Só permite apagar tickets já finalizados
    const allowedStatuses: string[] = [TicketStatus.RESOLVIDO, TicketStatus.FECHADO];
    if (!allowedStatuses.includes(ticket.status)) {
      throw new BadRequestException(
        'Apenas chamados com status Resolvido ou Fechado podem ser apagados',
      );
    }

    // Log de auditoria antes de deletar
    this.auditService.log({
      acao: 'TICKET_APAGADO',
      tipoRecurso: 'TICKET',
      recursoId: id,
      descricao: `Ticket #${id.slice(-8).toUpperCase()} (status: ${ticket.status}) apagado definitivamente`,
      metadata: { titulo: ticket.titulo, status: ticket.status },
      userId: adminUser.sub,
      userEmail: adminUser.email,
      userPapel: adminUser.papel,
    });

    // SQLite não aplica ON DELETE CASCADE automaticamente sem PRAGMA foreign_keys=ON.
    // Deletamos as relações manualmente dentro de uma transação para garantir atomicidade.
    await this.prisma.$transaction([
      this.prisma.priorityLog.deleteMany({ where: { ticketId: id } }),
      this.prisma.attachment.deleteMany({ where: { ticketId: id } }),
      this.prisma.comment.deleteMany({ where: { ticketId: id } }),
      this.prisma.ticket.delete({ where: { id } }),
    ]);

    return { message: 'Chamado apagado com sucesso' };
  }


  async getStats(user: any) {
    const where = user.papel === Role.COLABORADOR ? { criadoPorId: user.sub } : {};

    const [total, porStatus, porPrioridade] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.ticket.groupBy({
        by: ['prioridade'],
        where,
        _count: { id: true },
      }),
    ]);

    return { total, porStatus, porPrioridade };
  }

  async getHistory(user: any, filters: any) {
    if (user.papel === Role.COLABORADOR) {
      throw new ForbiddenException('Apenas agentes de TI podem acessar o histórico completo');
    }

    const { page = 1, limit = 50, q, dataInicio, dataFim, prioridade, categoriaId, atribuidoAId, criadoPorId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      status: { in: [TicketStatus.RESOLVIDO, TicketStatus.FECHADO] },
    };

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

    if (q) {
      where.OR = [
        { titulo: { contains: q, mode: 'insensitive' } },
        { criadoPor: { nome: { contains: q, mode: 'insensitive' } } },
      ];
      // Tentar converter q para número de ID se possível, pra buscar pelo código #
      const asNum = parseInt(q, 10);
      if (!isNaN(asNum)) {
        where.OR = [
          ...where.OR,
          // Como o ID no Prisma schema aqui não é int e sim cuid/uuid. Wait.
          // O ID do chamado é string. Então contains resolve.
          { id: { contains: q, mode: 'insensitive' } },
        ];
      }
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          categoria: true,
          criadoPor: { select: { id: true, nome: true, email: true, setor: true } },
          atribuidoA: { select: { id: true, nome: true, email: true } },
        },
        orderBy: { resolvidoEm: 'desc' }, // O mais recentemente resolvido primeiro
        skip,
        take: Number(limit),
      }),
      this.prisma.ticket.count({ where }),
    ]);

    // Estatísticas básicas
    // Podemos fazer isso numa view separada se ficar lento, mas para o requisito basta:
    let stats = null;
    if (page == 1) { // só puxa estatística na primeira página pra não pesar
      const totalFechados = total;
      // Poderiamos calcular tempo médio, mas vamos manter simples por agora e só devolver o total.
      stats = { totalFechados };
    }

    return {
      data: tickets,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
      stats,
    };
  }
}
