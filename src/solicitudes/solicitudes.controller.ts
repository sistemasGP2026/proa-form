import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Render, Req, Res, UseGuards, } from '@nestjs/common';
import type { Request } from 'express';
import { SolicitudesService } from './solicitudes.service';
import { CrearSolicitudDto } from './dto/crear-solicitud.dto';
import { CrearRevisionDto } from 'src/revisiones/dto/crear-revision.dto';
import { Public } from 'src/auth/decorator/is-public.decorator';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';
import type { Response } from 'express';
import { UpdateEstadoItemsDto } from './dto/updateEstadoItemsDto';


@UseGuards(JwtAuthGuard)
@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) { }

  @Public()
  @Post()
  async postSolicitudes(@Body() data: CrearSolicitudDto) {
    return await this.solicitudesService.crearSolicitud(data);
  }
  @Public()
  @Get('download')
  async generateExcel(@Res() resp: Response) {
    return this.solicitudesService.exportarSolicitudesExcel(resp);
  }

  @Public()
  @Get()
  @Render('solicitudes/solicitudes')
  async getSolicitudesByStatus() {
    const solicitudes = await this.solicitudesService.getAllSolicitudes();

    return { solicitudes };
  }

  @Get(':id')
  @Render('solicitudes/solicitudes_details')
  async getSolicitudById(@Param('id', ParseIntPipe) id: number) {
    const solicitud = await this.solicitudesService.getSolicitudById(id);
    return {
      solicitud,
    };
  }

  @Patch(':id/items/estado')
  @HttpCode(HttpStatus.OK)
  async updateEstadoItems(@Param('id', ParseIntPipe) id: number,@Body() body: any) {
    return this.solicitudesService.updateEstadoItems(id, body);
  }

}