import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IsEmail, IsString, MinLength } from 'class-validator';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  senha: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const { accessToken, refreshToken, user } = await this.authService.login(dto.email, dto.senha);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { user };
  }

  @Post('refresh')
  async refresh(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: ExpressResponse) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('Refresh token não encontrado');

    const result = await this.authService.refreshSession(refreshToken);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { success: true };
  }

  @Post('logout')
  async logout(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: ExpressResponse) {
    const refreshToken = req.cookies['refresh_token'];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    return this.authService.getMe(req.user.sub);
  }
}
