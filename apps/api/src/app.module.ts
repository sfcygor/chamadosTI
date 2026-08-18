import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { CategoriesModule } from './categories/categories.module';
import { CommentsModule } from './comments/comments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { UploadsModule } from './uploads/uploads.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 15 * 60000,
      limit: 50, // Temporariamente 50 para dev
    }]),
    PrismaModule,
    WebsocketsModule,
    AuditModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    CategoriesModule,
    CommentsModule,
    ReportsModule,
    UploadsModule,
  ],
})
export class AppModule {}
