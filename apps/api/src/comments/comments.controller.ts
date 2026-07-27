import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';

class CreateCommentDto {
  @IsString()
  @MinLength(1)
  texto: string;

  @IsOptional()
  @IsBoolean()
  isNotaInterna?: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller('tickets/:ticketId/comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  findAll(@Param('ticketId') ticketId: string, @Request() req) {
    return this.commentsService.findByTicket(ticketId, req.user);
  }

  @Post()
  create(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateCommentDto,
    @Request() req,
  ) {
    return this.commentsService.create(ticketId, dto, req.user);
  }
}
