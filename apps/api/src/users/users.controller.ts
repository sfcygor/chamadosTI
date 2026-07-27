import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '../common/enums';
import { IsString, IsEmail, IsEnum, IsOptional, MinLength, IsBoolean } from 'class-validator';

class CreateUserDto {
  @IsString()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  senha: string;

  @IsOptional()
  @IsEnum(Role)
  papel?: Role;

  @IsOptional()
  @IsString()
  setor?: string;
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsEnum(Role)
  papel?: Role;

  @IsOptional()
  @IsString()
  setor?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(6)
  senha?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('agents')
  findAgents() {
    return this.usersService.findAgents();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
