import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Render,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { SedesService } from './sedes.service';
import { CreateSede } from './dto/createSede.dto';
import { UpdateSede } from './dto/updateSede.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AuthRole } from 'src/auth/decorator/auth-role.decorator';
import { Rol } from 'src/usuarios/entities/rol.enum';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-objectid.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@AuthRole(Rol.ADMINISTRADOR)
@Controller('sedes')
export class SedesController {
  constructor(private readonly sedesService: SedesService) {}

  @Get()
  @Render('sedes/sedes_main')
  async getAll(@Req() req: Request) {
    const sedes = await this.sedesService.findAllSedesActive();
    const user = req.user as any;

    return {
      sedes,
      usuario: {
        nombre: user?.nombre || user?.usuario,
        rol: user?.rol,
      },
      currentPath: '/sedes',
    };
  }

  @Get(':id')
  async getSedeById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.sedesService.findSedeById(id);
  }

  @Post()
  async createSede(@Body() data: CreateSede) {
    return this.sedesService.createSede(data);
  }

  @Delete(':id')
  async deleteSede(@Param('id', ParseObjectIdPipe) id: string) {
    await this.sedesService.deleteSede(id);
    return { msg: 'Sede eliminada correctamente' };
  }

  @Patch(':id')
  async updateSede(@Param('id', ParseObjectIdPipe) id: string, @Body() data: UpdateSede) {
    return this.sedesService.updateSede(id, data);
  }

  /** Alias: la vista sedes_main enviaba PUT mientras el backend solo exponía PATCH. */
  @Put(':id')
  async updateSedePut(@Param('id', ParseObjectIdPipe) id: string, @Body() data: UpdateSede) {
    return this.sedesService.updateSede(id, data);
  }
}
