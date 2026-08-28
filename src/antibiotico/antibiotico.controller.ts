import {Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Render, Req, UseGuards} from '@nestjs/common';
import type { Request } from 'express';
import { AntibioticoService } from './antibiotico.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-guard.guard';
import { Antibiotico } from './entities/antibioticos.entity';
import { CreateAntibiotico, UpdateAntibiotico } from './dto/antibiotico.dto';

@UseGuards(JwtAuthGuard)
@Controller('antibioticos')
export class AntibioticoController {
  constructor(private readonly antibioticoService: AntibioticoService) {}

  @Get()
  @Render('antibioticos/antibioticos_main')
  async getAll(@Req() req: Request) {
    const antibioticos = await this.antibioticoService.getAllActive();
    const user = req.user as any;

    return {
      antibioticos,
      usuario: { nombre: user?.nombre || user?.usuario, rol: user?.rol },
      currentPath: '/antibioticos',
    };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<Antibiotico | null> {
    return this.antibioticoService.getById(id);
  }

  @Post()
  async create(@Body() data: CreateAntibiotico): Promise<Antibiotico> {
    return this.antibioticoService.create(data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.antibioticoService.delete(id);
    return { msg: 'Antibiótico eliminado correctamente' };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateAntibiotico,
  ): Promise<Antibiotico> {
    return this.antibioticoService.update(id, data);
  }
}