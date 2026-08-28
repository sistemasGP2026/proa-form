import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicios } from './entities/servicios.entity';
import { CreateServicio, UpdateServicio } from './dto/servicio.dto';

@Injectable()
export class ServiciosService {
  constructor(
    @InjectRepository(Servicios)
    private readonly servicioRepository: Repository<Servicios>,
  ) {}

  async getAllActive(): Promise<Servicios[]> {
    return this.servicioRepository.find({ where: { activo: true } });
  }

  async getById(id: number): Promise<Servicios | null> {
    return this.servicioRepository.findOne({ where: { id } });
  }

  async create(data: CreateServicio): Promise<Servicios> {
    const existente = await this.servicioRepository.findOne({ where: { nombre: data.nombre } });
    if (existente) {
      throw new BadRequestException(`El servicio "${data.nombre}" ya existe`);
    }

    const nuevo = this.servicioRepository.create({
      nombre: data.nombre,
      activo: data.activo ?? true,
    });

    return this.servicioRepository.save(nuevo);
  }

  async delete(id: number): Promise<boolean> {
    const servicio = await this.servicioRepository.findOne({ where: { id } });
    if (!servicio) {
      throw new BadRequestException(`Servicio con id ${id} no existe o ya fue eliminado`);
    }

    servicio.activo = false;
    await this.servicioRepository.save(servicio);

    return true;
  }

  async update(id: number, data: UpdateServicio): Promise<Servicios> {
    const servicio = await this.servicioRepository.findOne({ where: { id } });
    if (!servicio) {
      throw new BadRequestException(`Servicio con id ${id} no existe o ya fue eliminado`);
    }

    if (data.nombre) {
      const existente = await this.servicioRepository.findOne({ where: { nombre: data.nombre } });
      if (existente && existente.id !== id) {
        throw new BadRequestException(`Ya existe un servicio con el nombre "${data.nombre}"`);
      }
    }

    Object.assign(servicio, data);
    return this.servicioRepository.save(servicio);
  }
}