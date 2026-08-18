import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { WebsocketsModule } from '../websockets/websockets.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [WebsocketsModule, AuditModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
