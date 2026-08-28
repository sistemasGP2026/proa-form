import { Controller, Get, Param, ParseIntPipe, Query, Render, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { RevisionesService } from './revisiones.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';

@UseGuards(JwtAuthGuard)
@Controller('revisiones')
export class RevisionesController {
  constructor(private readonly revisionesService: RevisionesService) { }

  @Get()
  @Render('revisiones/revisiones_main')
  async listar(
    @Req() req: Request,
    @Query('solicitudId') solicitudId?: string,
    @Query('page') page?: string,
  ) {
    const { data, meta } = await this.revisionesService.listar({
      solicitudId: solicitudId ? Number(solicitudId) : undefined,
      page: page ? Number(page) : undefined,
    });

    const user = req.user as any;

    return {
      revisiones: data,
      meta,
      solicitudIdActual: solicitudId ?? '',
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
  async getDetalleRevision(@Param('id', ParseIntPipe) id: number) {
    const revision = await this.revisionesService.findOne(id);
    return { revision };
  }

}