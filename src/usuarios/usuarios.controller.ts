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
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AuthRole } from 'src/auth/decorator/auth-role.decorator';
import { Rol } from 'src/usuarios/entities/rol.enum';
import { ActualizarUsuario, CrearUsuario } from './dto/crearUsuario.dto';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-objectid.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@AuthRole(Rol.ADMINISTRADOR)
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
  async getById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.usuariosService.getById(id);
  }

  @Post()
  async create(@Body() data: CrearUsuario) {
    return this.usuariosService.createUsuario(data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseObjectIdPipe) id: string) {
    await this.usuariosService.delete(id);
    return { msg: 'Usuario eliminado correctamente' };
  }

  @Patch(':id')
  async update(@Param('id', ParseObjectIdPipe) id: string, @Body() data: ActualizarUsuario) {
    return this.usuariosService.update(id, data);
  }
}
