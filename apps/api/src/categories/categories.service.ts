import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Priority } from '../common/enums';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

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

  async create(data: { nome: string; slaHoras: number }) {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: any) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    return this.prisma.category.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
