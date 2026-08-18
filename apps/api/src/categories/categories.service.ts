import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Priority } from '../common/enums';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  findAll() {
    return this.prisma.category.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  findAllAdmin() {
    return this.prisma.category.findMany({
      include: { _count: { select: { tickets: true } } },
      orderBy: { nome: 'asc' },
    });
  }

  async create(data: { nome: string; slaHoras: number }, adminUser?: any) {
    const category = await this.prisma.category.create({ data });

    this.auditService.log({
      acao: 'CATEGORIA_CRIADA',
      tipoRecurso: 'CATEGORIA',
      recursoId: category.id,
      descricao: `Categoria "${category.nome}" criada (SLA: ${category.slaHoras}h)`,
      userId: adminUser?.sub,
      userEmail: adminUser?.email,
      userPapel: adminUser?.papel,
    });

    return category;
  }

  async update(id: string, data: any, adminUser?: any) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    const updatedCat = await this.prisma.category.update({ where: { id }, data });

    this.auditService.log({
      acao: 'CATEGORIA_ATUALIZADA',
      tipoRecurso: 'CATEGORIA',
      recursoId: id,
      descricao: `Categoria "${updatedCat.nome}" atualizada`,
      userId: adminUser?.sub,
      userEmail: adminUser?.email,
      userPapel: adminUser?.papel,
    });

    return updatedCat;
  }

  async remove(id: string, adminUser?: any) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    const removedCat = await this.prisma.category.update({
      where: { id },
      data: { ativo: false },
    });

    this.auditService.log({
      acao: 'CATEGORIA_APAGADA',
      tipoRecurso: 'CATEGORIA',
      recursoId: id,
      descricao: `Categoria "${cat.nome}" foi desativada (apagada)`,
      userId: adminUser?.sub,
      userEmail: adminUser?.email,
      userPapel: adminUser?.papel,
    });

    return removedCat;
  }
}
