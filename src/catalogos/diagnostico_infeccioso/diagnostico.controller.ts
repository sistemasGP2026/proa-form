import {Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Render, Req, UseGuards,} from '@nestjs/common';
import type { Request } from 'express';
import { CreateDiagnostico, UpdateDiagnostico } from './dto/diagnostico.dto';
import { DiagnosticoInfecciosoService } from './diagnostico_infeccioso.service';
import { DiagnosticoInfeccioso } from './entities/diagnosticos_infecciosos';
import { Public } from 'src/auth/decorator/is-public.decorator';

@Public()
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
  async getById(@Param('id', ParseIntPipe) id: number): Promise<DiagnosticoInfeccioso | null> {
    return this.diagnosticoService.getById(id);
  }

  @Post()
  async create(@Body() data: CreateDiagnostico): Promise<DiagnosticoInfeccioso> {
    return this.diagnosticoService.create(data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.diagnosticoService.delete(id);
    return { msg: 'Diagnóstico eliminado correctamente' };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateDiagnostico,
  ): Promise<DiagnosticoInfeccioso> {
    return this.diagnosticoService.update(id, data);
  }
}