import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Render,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';
import { SedesService } from './sedes.service';
import { CreateSede } from './dto/createSede.dto';
import { Sede } from './entities/sede.entity';
import { UpdateSede } from './dto/updateSede.dto';
import { Public } from 'src/auth/decorator/is-public.decorator';

@Public()
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
  async getSedeById(@Param('id', ParseIntPipe) id: number): Promise<Sede | null> {
    return this.sedesService.findSedeById(id);
  }

  @Post()
  async createSede(@Body() data: CreateSede): Promise<Sede> {
    return this.sedesService.createSede(data);
  }

  @Delete(':id')
  async deleteSede(@Param('id', ParseIntPipe) id: number) {
    await this.sedesService.deleteSede(id);
    return { msg: 'Sede eliminada correctamente' };
  }

  @Patch(':id')
  async updateSede(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateSede,
  ): Promise<Sede> {
    return this.sedesService.updateSede(id, data);
  }
}