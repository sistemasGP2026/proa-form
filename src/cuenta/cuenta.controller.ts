import { Body, Controller, Get, Post, Query, Render, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';

import { UsuariosService } from 'src/usuarios/usuarios.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AuthRole } from 'src/auth/decorator/auth-role.decorator';
import { Rol } from 'src/usuarios/entities/rol.enum';
import { CambiarClaveDto } from './dto/cambiar-clave.dto';

/**
 * Cuenta propia. A diferencia de /usuarios, que es solo del administrador,
 * aqui entra cualquiera con sesion para cambiar su propia contraseña.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@AuthRole(Rol.ADMINISTRADOR, Rol.AUDITOR_PROA)
@Controller('cuenta')
export class CuentaController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('clave')
  @Render('cuenta/clave')
  mostrarFormulario(@Req() req: Request, @Query('inicial') inicial?: string) {
    const user = req.user as any;

    return {
      // Llega marcado cuando la cuenta todavia tiene la contraseña inicial.
      esInicial: inicial === '1',
      usuario: { nombre: user?.nombre || user?.usuario, rol: user?.rol },
      currentPath: '/cuenta',
    };
  }

  @Post('clave')
  async cambiar(@Body() data: CambiarClaveDto, @Req() req: Request, @Res() res: Response) {
    const user = req.user as any;

    const volver = (error: string) =>
      res.status(400).render('cuenta/clave', {
        error,
        esInicial: false,
        usuario: { nombre: user?.nombre || user?.usuario, rol: user?.rol },
        currentPath: '/cuenta',
      });

    if (data.nueva !== data.confirmacion) {
      return volver('La confirmacion no coincide con la contraseña nueva');
    }

    try {
      await this.usuariosService.cambiarClavePropia(String(user?.id), data.actual, data.nueva);
    } catch (error: any) {
      return volver(error?.message ?? 'No fue posible cambiar la contraseña');
    }

    return res.redirect('/admin?clave=cambiada');
  }
}
