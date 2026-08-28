// usuarios.controller.ts
import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Render, Req, UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';
import { Usuario } from './entities/usuarios.entities';
import { ActualizarUsuario, CrearUsuario } from './dto/crearUsuario.dto';

@UseGuards(JwtAuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @Render('usuarios/usuarios_main')
  async getAll(@Req() req: Request) {
    const usuarios = await this.usuariosService.getAllActive();
    const user = req.user as any;

    return {
      usuarios,
      usuario: { nombre: user?.nombre || user?.usuario, rol: user?.rol },
      currentPath: '/usuarios',
    };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<Usuario | null> {
    return this.usuariosService.getById(id);
  }

  @Post()
  async create(@Body() data: CrearUsuario) {
    return this.usuariosService.createUsuario(data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.usuariosService.delete(id);
    return { msg: 'Usuario eliminado correctamente' };
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: ActualizarUsuario) {
    return this.usuariosService.update(id, data);
  }
}