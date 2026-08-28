import { Controller, Get, Render, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  @Render("admin/dashboard")
  async loadAdminPage(@Req() req: Request) {
    const sedes = await this.adminService.getSedes();
    const solicitudes = await this.adminService.getSolicitudes();
    const user = req.user as any;

    return {
      sedes,
      solicitudes,
      usuario: {
        nombre: user?.nombre,
        usuario: user?.usuario,
        rol: user?.rol
      },
      currentPath: '/solicitudes'
    };
  }
}