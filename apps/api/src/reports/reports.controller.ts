import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '../common/enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.AGENTE)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('summary')
  getSummary(@Query('periodo') periodo?: string) {
    return this.reportsService.getSummary(periodo);
  }

  @Get('export')
  async exportCsv(@Query() filters: any, @Res() res: Response) {
    const csv = await this.reportsService.exportToCsv(filters);
    res.header('Content-Type', 'text/csv');
    res.attachment('relatorio_chamados.csv');
    return res.send(csv);
  }
  @Get('export-json')
  async exportJson(@Query() filters: any) {
    return this.reportsService.getExportData(filters);
  }

}
