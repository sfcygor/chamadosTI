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

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 15 * 60000, // 15 minutes
      limit: 5,
    }]),
    PrismaModule,
    WebsocketsModule,
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
