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
import { EspecialidadTratanteService } from './especialidad_tratante.service';
import { CreateEspecialidad, UpdateEspecialidad } from './especialidad/especialidad.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AuthRole } from 'src/auth/decorator/auth-role.decorator';
import { Rol } from 'src/usuarios/entities/rol.enum';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-objectid.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@AuthRole(Rol.ADMINISTRADOR, Rol.AUDITOR_PROA)
@Controller('especialidades')
export class EspecialidadTratanteController {
  constructor(private readonly especialidadTratanteService: EspecialidadTratanteService) {}

  @Get()
  @Render('especialidad/especialidades_main')
  async getAll(@Req() req: Request) {
    const especialidades = await this.especialidadTratanteService.getAllEspecialidadesActive();
    const user = req.user as any;

    return {
      especialidades,
      usuario: {
        nombre: user?.nombre || user?.usuario,
        rol: user?.rol,
      },
      currentPath: '/especialidades',
    };
  }

  @Get(':id')
  async getEspecialidadById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.especialidadTratanteService.getEspecialidadById(id);
  }

  @Post()
  async createEspecialidad(@Body() data: CreateEspecialidad) {
    return this.especialidadTratanteService.createEspecialidad(data);
  }

  @Delete(':id')
  async deleteEspecialidad(@Param('id', ParseObjectIdPipe) id: string) {
    await this.especialidadTratanteService.deleteEspecialidad(id);
    return { msg: 'Especialidad eliminada correctamente' };
  }

  @Patch(':id')
  async updateEspecialidad(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() data: UpdateEspecialidad,
  ) {
    return this.especialidadTratanteService.updateEspecialidad(id, data);
  }
}
