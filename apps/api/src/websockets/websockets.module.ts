import { Module } from '@nestjs/common';
import { TicketsGateway } from './tickets.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [TicketsGateway],
  exports: [TicketsGateway],
})
export class WebsocketsModule {}
