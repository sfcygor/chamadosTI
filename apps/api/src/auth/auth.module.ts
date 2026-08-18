import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuditModule } from '../audit/audit.module';
import * as fs from 'fs';
import * as path from 'path';

const privateKey = fs.existsSync(path.join(process.cwd(), 'keys/private.pem')) ? fs.readFileSync(path.join(process.cwd(), 'keys/private.pem'), 'utf8') : undefined;
const publicKey = fs.existsSync(path.join(process.cwd(), 'keys/public.pem')) ? fs.readFileSync(path.join(process.cwd(), 'keys/public.pem'), 'utf8') : undefined;

@Module({
  imports: [
    PassportModule,
    AuditModule,
    JwtModule.register({
      privateKey: privateKey || (process.env.JWT_PRIVATE_KEY ? process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n') : 'fallback_for_compilation'),
      publicKey: publicKey || (process.env.JWT_PUBLIC_KEY ? process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n') : 'fallback_for_compilation'),
      signOptions: { 
        algorithm: 'RS256', 
        expiresIn: process.env.JWT_EXPIRES_IN || '15m' 
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
