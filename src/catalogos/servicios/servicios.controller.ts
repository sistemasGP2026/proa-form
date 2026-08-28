import {Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Render, Req} from '@nestjs/common';
import type { Request } from 'express';
import { ServiciosService } from './servicios.service';
import { Servicios } from './entities/servicios.entity';
import { CreateServicio, UpdateServicio } from './dto/servicio.dto';
import { Public } from 'src/auth/decorator/is-public.decorator';


@Public()
@Controller('servicios')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Get()
  @Render('servicios/servicios_main')
  async getAll(@Req() req: Request) {
    const servicios = await this.serviciosService.getAllActive();
    const user = req.user as any;

    return {
      servicios,
      usuario: { nombre: user?.nombre || user?.usuario, rol: user?.rol },
      currentPath: '/servicios',
    };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<Servicios | null> {
    return this.serviciosService.getById(id);
  }

  @Post()
  async create(@Body() data: CreateServicio): Promise<Servicios> {
    return this.serviciosService.create(data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.serviciosService.delete(id);
    return { msg: 'Servicio eliminado correctamente' };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateServicio,
  ): Promise<Servicios> {
    return this.serviciosService.update(id, data);
  }
}