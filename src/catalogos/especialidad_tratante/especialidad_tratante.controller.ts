import {Body,Controller,Delete,Get,Param,ParseIntPipe,Patch,Post,Render,Req} from '@nestjs/common';
import type { Request } from 'express';
import { EspecialidadTratanteService } from './especialidad_tratante.service';
import { EspecialidadTratante } from './entities/especialidadTratante';
import { CreateEspecialidad, UpdateEspecialidad } from './especialidad/especialidad.dto';
import { Public } from 'src/auth/decorator/is-public.decorator';

@Public()
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
  async getEspecialidadById(@Param('id', ParseIntPipe) id: number): Promise<EspecialidadTratante | null> {
    return this.especialidadTratanteService.getEspecialidadById(id);
  }

  @Post()
  async createEspecialidad(@Body() data: CreateEspecialidad): Promise<EspecialidadTratante> {
    return this.especialidadTratanteService.createEspecialidad(data);
  }

  @Delete(':id')
  async deleteEspecialidad(@Param('id', ParseIntPipe) id: number) {
    await this.especialidadTratanteService.deleteEspecialidad(id);
    return { msg: 'Especialidad eliminada correctamente' };
  }

  @Patch(':id')
  async updateEspecialidad(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateEspecialidad,
  ): Promise<EspecialidadTratante> {
    return this.especialidadTratanteService.updateEspecialidad(id, data);
  }
}