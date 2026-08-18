import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role, Priority } from '../common/enums';
import { IsString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

class CreateCategoryDto {
  @IsString()
  nome: string;


  @IsInt()
  @Min(1)
  slaHoras: number;
}

class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  nome?: string;


  @IsOptional()
  @IsInt()
  slaHoras?: number;
}

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.AGENTE)
  @Get('admin')
  findAllAdmin() {
    return this.categoriesService.findAllAdmin();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateCategoryDto, @Request() req) {
    return this.categoriesService.create(dto, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @Request() req) {
    return this.categoriesService.update(id, dto, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.categoriesService.remove(id, req.user);
  }
}
