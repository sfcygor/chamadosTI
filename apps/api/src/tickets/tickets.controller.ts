import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Priority, TicketStatus } from '../common/enums';

class CreateTicketDto {
  @IsString()
  @MinLength(5)
  titulo: string;

  @IsString()
  @MinLength(10)
  descricao: string;

  @IsString()
  categoriaId: string;
}

class UpdateTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(Priority)
  prioridade?: Priority;

  @IsOptional()
  @IsString()
  motivoPrioridade?: string;

  @IsOptional()
  @IsString()
  atribuidoAId?: string;

  @IsOptional()
  @IsString()
  categoriaId?: string;

  @IsOptional()
  @IsString()
  descricaoSolucao?: string;
}



@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  findAll(@Request() req, @Query() query: any) {
    return this.ticketsService.findAll(req.user, query);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.ticketsService.getStats(req.user);
  }

  @Get('history')
  getHistory(@Request() req, @Query() query: any) {
    return this.ticketsService.getHistory(req.user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.ticketsService.findOne(id, req.user);
  }

  @Post()
  create(@Body() dto: CreateTicketDto, @Request() req) {
    return this.ticketsService.create(dto, req.user.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto, @Request() req) {
    return this.ticketsService.update(id, dto, req.user);
  }

  @Post(':id/assume')
  assume(@Param('id') id: string, @Request() req) {
    return this.ticketsService.assume(id, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.ticketsService.deleteResolved(id, req.user);
  }

}
