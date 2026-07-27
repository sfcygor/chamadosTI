import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const publicKey = fs.existsSync(path.join(process.cwd(), 'keys/public.pem')) ? fs.readFileSync(path.join(process.cwd(), 'keys/public.pem'), 'utf8') : undefined;

const extractJwtFromCookie = (req: Request) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['access_token'];
  }
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractJwtFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: publicKey || (process.env.JWT_PUBLIC_KEY ? process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n') : 'fallback_for_compilation'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    return { sub: payload.sub, email: payload.email, papel: payload.papel };
  }
}
