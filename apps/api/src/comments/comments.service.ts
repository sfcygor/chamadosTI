import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findByTicket(ticketId: string, user: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Chamado não encontrado');

    if (user.papel === Role.COLABORADOR && ticket.criadoPorId !== user.sub) {
      throw new ForbiddenException('Acesso negado');
    }

    const where: any = { ticketId };
    // Colaboradores não veem notas internas
    if (user.papel === Role.COLABORADOR) {
      where.isNotaInterna = false;
    }

    return this.prisma.comment.findMany({
      where,
      include: {
        autor: { select: { id: true, nome: true, papel: true } },
      },
      orderBy: { criadoEm: 'asc' },
    });
  }

  async create(ticketId: string, data: any, user: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Chamado não encontrado');

    if (user.papel === Role.COLABORADOR && ticket.criadoPorId !== user.sub) {
      throw new ForbiddenException('Acesso negado');
    }

    // Colaboradores não podem criar notas internas
    const isNotaInterna =
      user.papel !== Role.COLABORADOR ? (data.isNotaInterna ?? false) : false;

    const comment = await this.prisma.comment.create({
      data: {
        texto: data.texto,
        isNotaInterna,
        ticketId,
        autorId: user.sub,
      },
      include: {
        autor: { select: { id: true, nome: true, papel: true } },
      },
    });

    // Atualizar status do ticket se agente respondeu
    if (!isNotaInterna && user.papel !== Role.COLABORADOR) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { atualizadoEm: new Date() },
      });
    }

    return comment;
  }
}
