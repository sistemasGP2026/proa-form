import { Controller, Get, Param, Query, Render, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { RevisionesService } from './revisiones.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AuthRole } from 'src/auth/decorator/auth-role.decorator';
import { Rol } from 'src/usuarios/entities/rol.enum';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-objectid.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@AuthRole(Rol.ADMINISTRADOR, Rol.AUDITOR_PROA)
@Controller('revisiones')
export class RevisionesController {
  constructor(private readonly revisionesService: RevisionesService) {}

  @Get()
  @Render('revisiones/revisiones_main')
  async listar(
    @Req() req: Request,
    @Query('solicitudId') solicitudId?: string,
    @Query('estado') estado?: string,
    @Query('page') page?: string,
  ) {
    const { data, meta } = await this.revisionesService.listar({
      solicitudId: solicitudId || undefined,
      estado: estado || undefined,
      page: page ? Number(page) : undefined,
    });

    const user = req.user as any;

    return {
      revisiones: data,
      meta,
      solicitudIdActual: solicitudId ?? '',
      estadoActual: estado ?? '',
      hasAnterior: meta.page > 1,
      hasSiguiente: meta.page < meta.totalPages,
      paginaAnterior: meta.page - 1,
      paginaSiguiente: meta.page + 1,
      usuario: { nombre: user?.nombre || user?.usuario, rol: user?.rol },
      currentPath: '/revisiones',
    };
  }

  @Get(':id')
  @Render('revisiones/revision_detalle')
  async getDetalleRevision(@Param('id', ParseObjectIdPipe) id: string, @Req() req: Request) {
    const revision = await this.revisionesService.findOne(id);
    const user = req.user as any;

    return {
      revision,
      usuario: { nombre: user?.nombre || user?.usuario, rol: user?.rol },
      currentPath: '/revisiones',
    };
  }
}
