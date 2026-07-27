import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, senha: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.ativo) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const senhaValida = await bcrypt.compare(senha, user.senhaHash);
    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, email: user.email, papel: user.papel };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

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
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async refreshSession(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    if (!tokenRecord.user.ativo) {
      throw new UnauthorizedException('Usuário inativo');
    }

    // Revoke old refresh token for rotation
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
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
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

    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }
}
