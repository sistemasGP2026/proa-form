import { BadRequestException, Injectable } from '@nestjs/common';
import { Antibiotico } from './entities/antibioticos.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoAntibiotico } from './entities/tipoAntibiotico.enum';
import { CreateAntibiotico, UpdateAntibiotico } from './dto/antibiotico.dto';

@Injectable()
export class AntibioticoService {
  constructor(@InjectRepository(Antibiotico) private readonly antibioticoRepository: Repository<Antibiotico>) { }

  async getAntibioticosRestringidos(): Promise<Antibiotico[]> {
    return await this.antibioticoRepository.find({
      where: { tipo: TipoAntibiotico.RESTRINGIDO, activo: true }
    })
  }

  async getAntibioticosVigilado(): Promise<Antibiotico[]> {
    return await this.antibioticoRepository.find({
      where: { tipo: TipoAntibiotico.VIGILADO, activo: true }
    })
  }

  async getAllActive(): Promise<Antibiotico[]> {
    return this.antibioticoRepository.find({ where: { activo: true } });
  }

  async getById(id: number): Promise<Antibiotico | null> {
    return this.antibioticoRepository.findOne({ where: { id } });
  }

  async create(data: CreateAntibiotico): Promise<Antibiotico> {
    const existeCodigo = await this.antibioticoRepository.findOne({ where: { codigo: data.codigo } });
    if (existeCodigo) {
      throw new BadRequestException(`El código "${data.codigo}" ya está en uso`);
    }

    const existeNombre = await this.antibioticoRepository.findOne({ where: { nombre: data.nombre } });
    if (existeNombre) {
      throw new BadRequestException(`El antibiótico "${data.nombre}" ya existe`);
    }

    const nuevo = this.antibioticoRepository.create({
      codigo: data.codigo,
      nombre: data.nombre,
      tipo: data.tipo,
      activo: data.activo ?? true,
    });

    return this.antibioticoRepository.save(nuevo);
  }

  async delete(id: number): Promise<boolean> {
    const antibiotico = await this.antibioticoRepository.findOne({ where: { id } });
    if (!antibiotico) {
      throw new BadRequestException(`Antibiótico con id ${id} no existe o ya fue eliminado`);
    }

    antibiotico.activo = false;
    await this.antibioticoRepository.save(antibiotico);

    return true;
  }
  async update(id: number, data: UpdateAntibiotico): Promise<Antibiotico> {
    const antibiotico = await this.antibioticoRepository.findOne({ where: { id } });
    if (!antibiotico) {
      throw new BadRequestException(`Antibiótico con id ${id} no existe o ya fue eliminado`);
    }

    if (data.codigo) {
      const existeCodigo = await this.antibioticoRepository.findOne({ where: { codigo: data.codigo } });
      if (existeCodigo && existeCodigo.id !== id) {
        throw new BadRequestException(`Ya existe un antibiótico con el código "${data.codigo}"`);
      }
    }

    if (data.nombre) {
      const existeNombre = await this.antibioticoRepository.findOne({ where: { nombre: data.nombre } });
      if (existeNombre && existeNombre.id !== id) {
        throw new BadRequestException(`Ya existe un antibiótico con el nombre "${data.nombre}"`);
      }
    }

    Object.assign(antibiotico, data);
    return this.antibioticoRepository.save(antibiotico);
  }

  async getAntibioticoById(id: number): Promise<Antibiotico | null> {
    return await this.antibioticoRepository.findOne({
      where: { id, activo: true }
    })
  }

}
