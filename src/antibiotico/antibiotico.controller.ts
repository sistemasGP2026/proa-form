import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Render,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AntibioticoService } from './antibiotico.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AuthRole } from 'src/auth/decorator/auth-role.decorator';
import { Rol } from 'src/usuarios/entities/rol.enum';
import { CreateAntibiotico, UpdateAntibiotico } from './dto/antibiotico.dto';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-objectid.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@AuthRole(Rol.ADMINISTRADOR, Rol.AUDITOR_PROA)
@Controller('antibioticos')
export class AntibioticoController {
  constructor(private readonly antibioticoService: AntibioticoService) {}

  @Get()
  @Render('antibioticos/antibioticos_main')
  async getAll(@Req() req: Request) {
    const antibioticos = await this.antibioticoService.getAllActive();
    const user = req.user as any;

    return {
      antibioticos,
      usuario: { nombre: user?.nombre || user?.usuario, rol: user?.rol },
      currentPath: '/antibioticos',
    };
  }

  @Get(':id')
  async getById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.antibioticoService.getById(id);
  }

  @Post()
  async create(@Body() data: CreateAntibiotico) {
    return this.antibioticoService.create(data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseObjectIdPipe) id: string) {
    await this.antibioticoService.delete(id);
    return { msg: 'Antibiótico eliminado correctamente' };
  }

  @Patch(':id')
  async update(@Param('id', ParseObjectIdPipe) id: string, @Body() data: UpdateAntibiotico) {
    return this.antibioticoService.update(id, data);
  }
}
