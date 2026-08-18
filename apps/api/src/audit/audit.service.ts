import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums';
import { ForbiddenException } from '@nestjs/common';

export interface CreateAuditLogDto {
  acao: string;
  tipoRecurso: string;
  recursoId?: string;
  descricao: string;
  metadata?: Record<string, any>;
  userId?: string;
  userEmail?: string;
  userPapel?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fire-and-forget — nao lanca excecao nem bloqueia a requisicao.
   * Erros sao silenciados para nao impactar o fluxo principal.
   */
  log(data: CreateAuditLogDto): void {
    this.prisma.auditLog
      .create({
        data: {
          acao: data.acao,
          tipoRecurso: data.tipoRecurso,
          recursoId: data.recursoId ?? null,
          descricao: data.descricao,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          userId: data.userId ?? null,
          userEmail: data.userEmail ?? null,
          userPapel: data.userPapel ?? null,
        },
      })
      .catch((err) => {
        console.error('[AUDIT] Falha ao gravar log de auditoria:', err.message);
      });
  }

  async findAll(adminUser: any, filters: any) {
    if (adminUser.papel !== Role.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem acessar os logs de auditoria');
    }

    const {
      page = 1,
      limit = 50,
      q,
      acao,
      tipoRecurso,
      userId,
      dataInicio,
      dataFim,
    } = filters;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (acao) where.acao = acao;
    if (tipoRecurso) where.tipoRecurso = tipoRecurso;
    if (userId) where.userId = userId;

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
        { descricao: { contains: q } },
        { userEmail: { contains: q } },
        { acao: { contains: q } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        skip,
        take: Number(limit),
        include: {
          user: {
            select: { id: true, nome: true, email: true, papel: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }
}
