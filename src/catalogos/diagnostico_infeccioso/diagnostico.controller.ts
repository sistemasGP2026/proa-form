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
import { CreateDiagnostico, UpdateDiagnostico } from './dto/diagnostico.dto';
import { DiagnosticoInfecciosoService } from './diagnostico_infeccioso.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AuthRole } from 'src/auth/decorator/auth-role.decorator';
import { Rol } from 'src/usuarios/entities/rol.enum';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-objectid.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@AuthRole(Rol.ADMINISTRADOR, Rol.AUDITOR_PROA)
@Controller('diagnosticos')
export class DiagnosticoController {
  constructor(private readonly diagnosticoService: DiagnosticoInfecciosoService) {}

  @Get()
  @Render('diagnosticos/diagnosticos_main')
  async getAll(@Req() req: Request) {
    const diagnosticos = await this.diagnosticoService.getAllActive();
    const user = req.user as any;

    return {
      diagnosticos,
      usuario: { nombre: user?.nombre || user?.usuario, rol: user?.rol },
      currentPath: '/diagnosticos',
    };
  }

  @Get(':id')
  async getById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.diagnosticoService.getById(id);
  }

  @Post()
  async create(@Body() data: CreateDiagnostico) {
    return this.diagnosticoService.create(data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseObjectIdPipe) id: string) {
    await this.diagnosticoService.delete(id);
    return { msg: 'Diagnóstico eliminado correctamente' };
  }

  @Patch(':id')
  async update(@Param('id', ParseObjectIdPipe) id: string, @Body() data: UpdateDiagnostico) {
    return this.diagnosticoService.update(id, data);
  }
}
