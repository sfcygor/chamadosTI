import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        setor: true,
        ativo: true,
        criadoEm: true,
        _count: {
          select: {
            ticketsCriados: true,
            ticketsAtribuidos: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  findAgents() {
    return this.prisma.user.findMany({
      where: {
        papel: { in: [Role.AGENTE, Role.ADMIN] },
        ativo: true,
      },
      select: { id: true, nome: true, email: true, papel: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        setor: true,
        ativo: true,
        criadoEm: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async create(data: any) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException('E-mail já cadastrado');

    const senhaHash = await bcrypt.hash(data.senha, 10);

    return this.prisma.user.create({
      data: {
        nome: data.nome,
        email: data.email,
        senhaHash,
        papel: data.papel || Role.COLABORADOR,
        setor: data.setor,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        setor: true,
        criadoEm: true,
      },
    });
  }

  async update(id: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const updateData: any = {};
    if (data.nome) updateData.nome = data.nome;
    if (data.papel) updateData.papel = data.papel;
    if (data.setor !== undefined) updateData.setor = data.setor;
    if (data.ativo !== undefined) updateData.ativo = data.ativo;
    if (data.senha) updateData.senhaHash = await bcrypt.hash(data.senha, 10);

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        setor: true,
        ativo: true,
      },
    });
  }
}
