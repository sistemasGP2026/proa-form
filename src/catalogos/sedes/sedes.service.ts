import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sede } from './entities/sede.entity';
import { CreateSede } from './dto/createSede.dto';
import { UpdateSede } from './dto/updateSede.dto';

@Injectable()
export class SedesService {
  constructor(
    @InjectRepository(Sede) private readonly sedeRepository: Repository<Sede>,
  ) { }

  async findAllSedesActive(): Promise<Sede[]> {
    return this.sedeRepository.find({ where: { activo: true } });
  }

  async findSedeById(id: number): Promise<Sede | null> {
    return this.sedeRepository.findOne({ where: { id, activo: true } });
  }

  async findSedeByNombre(nombre: string): Promise<Sede | null> {
    return this.sedeRepository.findOne({ where: { nombre, activo: true } });
  }
  async createSede(data: CreateSede): Promise<Sede> {
    const existeCodigo = await this.sedeRepository.findOne({ where: { codigo: data.codigo } });
    if (existeCodigo) {
      throw new BadRequestException(`Código de sede "${data.codigo}" ya está en uso`);
    }

    const existeNombre = await this.sedeRepository.findOne({ where: { nombre: data.nombre } });
    if (existeNombre) {
      throw new BadRequestException(`Nombre de sede "${data.nombre}" ya está en uso`);
    }

    const nuevaSede = this.sedeRepository.create({
      nombre: data.nombre,
      codigo: data.codigo,
      activo: true,
    });

    return this.sedeRepository.save(nuevaSede);
  }

  async deleteSede(id: number): Promise<boolean> {
    const sede = await this.sedeRepository.findOne({ where: { id, activo: true } });
    if (!sede) {
      throw new BadRequestException(`Sede ${id} no existe o ya fue eliminada`);
    }

    sede.activo = false;
    await this.sedeRepository.save(sede);

    return true;
  }

  async updateSede(id: number, data: UpdateSede): Promise<Sede> {
    const sede = await this.sedeRepository.findOne({ where: { id, activo: true } });
    if (!sede) {
      throw new BadRequestException(`La sede ${id} no existe o fue eliminada`);
    }

    if (data.codigo) {
      const existeCodigo = await this.sedeRepository.findOne({ where: { codigo: data.codigo } });
      if (existeCodigo && existeCodigo.id !== id) {
        throw new BadRequestException(`Ya existe una sede con el código ${data.codigo}`);
      }
    }

    if (data.nombre) {
      const existeNombre = await this.sedeRepository.findOne({ where: { nombre: data.nombre } });
      if (existeNombre && existeNombre.id !== id) {
        throw new BadRequestException(`Ya existe una sede con el nombre ${data.nombre}`);
      }
    }

    Object.assign(sede, data);
    return this.sedeRepository.save(sede);
  }
}