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
import { ServiciosService } from './servicios.service';
import { CreateServicio, UpdateServicio } from './dto/servicio.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AuthRole } from 'src/auth/decorator/auth-role.decorator';
import { Rol } from 'src/usuarios/entities/rol.enum';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-objectid.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@AuthRole(Rol.ADMINISTRADOR, Rol.AUDITOR_PROA)
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
  async getById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.serviciosService.getById(id);
  }

  @Post()
  async create(@Body() data: CreateServicio) {
    return this.serviciosService.create(data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseObjectIdPipe) id: string) {
    await this.serviciosService.delete(id);
    return { msg: 'Servicio eliminado correctamente' };
  }

  @Patch(':id')
  async update(@Param('id', ParseObjectIdPipe) id: string, @Body() data: UpdateServicio) {
    return this.serviciosService.update(id, data);
  }
}
