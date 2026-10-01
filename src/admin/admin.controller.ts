import { Controller, Get, Query, Render, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AuthRole } from 'src/auth/decorator/auth-role.decorator';
import { Rol } from 'src/usuarios/entities/rol.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@AuthRole(Rol.ADMINISTRADOR, Rol.AUDITOR_PROA)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get()
  @Render("admin/dashboard")
  async loadAdminPage(@Req() req: Request, @Query('anuladas') anuladas?: string) {
    const verAnuladas = anuladas === '1';

    const sedes = await this.adminService.getSedes();
    const solicitudes = await this.adminService.getSolicitudes(verAnuladas);
    const user = req.user as any;

    return {
      sedes,
      solicitudes,
      verAnuladas,
      // Solo el administrador ve las acciones de anular / eliminar.
      esAdministrador: user?.rol === Rol.ADMINISTRADOR,
      usuario: {
        nombre: user?.nombre,
        usuario: user?.usuario,
        rol: user?.rol
      },
      currentPath: '/solicitudes'
    };
  }
}