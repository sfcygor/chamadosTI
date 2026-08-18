import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { WebsocketsModule } from '../websockets/websockets.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [WebsocketsModule, AuditModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
