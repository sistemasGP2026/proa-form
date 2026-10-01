import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Render,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SolicitudesService } from './solicitudes.service';
import { CrearSolicitudDto } from './dto/crear-solicitud.dto';
import { UpdateEstadoItemsDto } from './dto/updateEstadoItemsDto';
import { Public } from 'src/auth/decorator/is-public.decorator';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AuthRole } from 'src/auth/decorator/auth-role.decorator';
import { Rol } from 'src/usuarios/entities/rol.enum';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-objectid.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@AuthRole(Rol.ADMINISTRADOR, Rol.AUDITOR_PROA)
@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  /**
   * Envío del formulario clínico (público, el médico no inicia sesión).
   * Tras registrar, lleva al médico a la consulta de ese paciente en vez
   * de devolver el JSON crudo que antes quedaba en pantalla.
   */
  @Public()
  @Post()
  async postSolicitudes(@Body() data: CrearSolicitudDto, @Res() res: Response) {
    const solicitud = await this.solicitudesService.crearSolicitud(data);

    const documento = encodeURIComponent(String(data.documento ?? '').trim());

    return res.redirect(
      `/solicitudes?documento=${documento}&creada=${encodeURIComponent(String(solicitud.id))}`,
    );
  }

  @Get('download')
  async generateExcel(@Res() resp: Response) {
    return this.solicitudesService.exportarSolicitudesExcel(resp);
  }

  /**
   * Consulta pública de solicitudes por identificación del paciente.
   *
   * Es abierta a propósito —el médico que diligencia el formulario no tiene
   * sesión—, pero exige el documento: sin él no se lista ningún paciente.
   * El listado completo para el personal sigue estando en /admin.
   */
  @Public()
  @Get()
  @Render('solicitudes/solicitudes')
  async consultarPorDocumento(
    @Query('documento') documento?: string,
    @Query('creada') creada?: string,
  ) {
    const buscado = String(documento ?? '').trim();

    // Sin término se muestran todas; el término filtra por cédula o nombre.
    const solicitudes = await this.solicitudesService.buscarPorDocumento(buscado);

    return {
      solicitudes,
      documentoActual: buscado,
      hayFiltro: buscado.length > 0,
      sinResultados: solicitudes.length === 0,
      total: solicitudes.length,
      recienCreada: creada ? String(creada) : '',
    };
  }

  @Get(':id')
  @Render('solicitudes/solicitudes_details')
  async getSolicitudById(@Param('id', ParseObjectIdPipe) id: string, @Req() req: Request) {
    const solicitud = await this.solicitudesService.getSolicitudById(id);
    const user = req.user as any;

    return {
      solicitud,
      // El personal de dispensacion consulta, pero no aprueba ni suspende.
      puedeDictaminar: user?.rol === Rol.ADMINISTRADOR || user?.rol === Rol.AUDITOR_PROA,
      usuario: { nombre: user?.nombre || user?.usuario, rol: user?.rol },
      currentPath: '/solicitudes',
    };
  }

  /**
   * Anulación (reversible). Reservada al administrador: el @AuthRole del
   * método sobreescribe el de la clase.
   */
  @AuthRole(Rol.ADMINISTRADOR)
  @Patch(':id/anular')
  @HttpCode(HttpStatus.OK)
  async anular(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: { motivo?: string },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.solicitudesService.anularSolicitud(id, { id: user?.id }, body?.motivo);
  }

  @AuthRole(Rol.ADMINISTRADOR)
  @Patch(':id/reactivar')
  @HttpCode(HttpStatus.OK)
  async reactivar(@Param('id', ParseObjectIdPipe) id: string) {
    return this.solicitudesService.reactivarSolicitud(id);
  }

  /** Borrado definitivo. Solo administrador y solo si ya está anulada. */
  @AuthRole(Rol.ADMINISTRADOR)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async eliminar(@Param('id', ParseObjectIdPipe) id: string) {
    return this.solicitudesService.eliminarSolicitudDefinitivo(id);
  }

  /**
   * Dictamen de los antibiotico(s). El personal de dispensacion no
   * aprueba ni suspende: solo consulta.
   */
  @AuthRole(Rol.ADMINISTRADOR, Rol.AUDITOR_PROA)
  @Patch(':id/items/estado')
  @HttpCode(HttpStatus.OK)
  async updateEstadoItems(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: UpdateEstadoItemsDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.solicitudesService.updateEstadoItems(id, body, {
      id: user?.id,
      rol: user?.rol,
    });
  }
}
