import { Module } from '@nestjs/common';
import { TicketsGateway } from './tickets.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'atendeti-secret',
    }),
  ],
  providers: [TicketsGateway],
  exports: [TicketsGateway],
})
export class WebsocketsModule {}
