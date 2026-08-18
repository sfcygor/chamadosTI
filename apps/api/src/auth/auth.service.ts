import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async login(email: string, senha: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.ativo) {
      this.auditService.log({
        acao: 'LOGIN_FALHA',
        tipoRecurso: 'AUTH',
        descricao: `Tentativa de login com email "${email}" falhou — usuario nao encontrado ou inativo`,
        userEmail: email,
      });
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const senhaValida = await bcrypt.compare(senha, user.senhaHash);
    if (!senhaValida) {
      this.auditService.log({
        acao: 'LOGIN_FALHA',
        tipoRecurso: 'AUTH',
        descricao: `Tentativa de login com email "${email}" falhou — senha incorreta`,
        userEmail: email,
        userId: user.id,
        userPapel: user.papel,
      });
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const payload = { sub: user.id, email: user.email, papel: user.papel };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    this.auditService.log({
      acao: 'LOGIN_SUCESSO',
      tipoRecurso: 'AUTH',
      descricao: `${user.nome} (${user.papel}) fez login`,
      userId: user.id,
      userEmail: user.email,
      userPapel: user.papel,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        papel: user.papel,
        setor: user.setor,
      },
    };
  }

  async generateRefreshToken(userId: string) {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });

    return token;
  }

  async refreshSession(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalido ou expirado');
    }

    if (!tokenRecord.user.ativo) {
      throw new UnauthorizedException('Usuario inativo');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    const payload = { sub: tokenRecord.user.id, email: tokenRecord.user.email, papel: tokenRecord.user.papel };
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(tokenRecord.user.id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (tokenRecord) {
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true },
      });

      this.auditService.log({
        acao: 'LOGOUT',
        tipoRecurso: 'AUTH',
        descricao: `${tokenRecord.user.email} encerrou a sessao`,
        userId: tokenRecord.user.id,
        userEmail: tokenRecord.user.email,
        userPapel: tokenRecord.user.papel,
      });
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        setor: true,
        criadoEm: true,
      },
    });

    if (!user) throw new NotFoundException('Usuario nao encontrado');
    return user;
  }
}
