import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EspecialidadTratante } from './entities/especialidadTratante';
import { CreateEspecialidad, UpdateEspecialidad } from './especialidad/especialidad.dto';

@Injectable()
export class EspecialidadTratanteService {
  constructor(
    @InjectRepository(EspecialidadTratante)
    private readonly especialidadRepository: Repository<EspecialidadTratante>,
  ) {}

  async getAllEspecialidadesActive(): Promise<EspecialidadTratante[]> {
    return this.especialidadRepository.find({ where: { activo: true } });
  }

  async getEspecialidadById(id: number): Promise<EspecialidadTratante | null> {
    return this.especialidadRepository.findOne({ where: { id } });
  }

  async createEspecialidad(data: CreateEspecialidad): Promise<EspecialidadTratante> {
    const existente = await this.especialidadRepository.findOne({ where: { nombre: data.nombre } });
    if (existente) {
      throw new BadRequestException(`La especialidad "${data.nombre}" ya existe`);
    }

    const nuevaEspecialidad = this.especialidadRepository.create({
      nombre: data.nombre,
      activo: data.activo ?? true,
    });

    return this.especialidadRepository.save(nuevaEspecialidad);
  }

  async deleteEspecialidad(id: number): Promise<boolean> {
    const especialidad = await this.especialidadRepository.findOne({ where: { id } });
    if (!especialidad) {
      throw new BadRequestException(`Especialidad con id ${id} no existe o ya fue eliminada`);
    }

    especialidad.activo = false;
    await this.especialidadRepository.save(especialidad);

    return true;
  }

  async updateEspecialidad(id: number, data: UpdateEspecialidad): Promise<EspecialidadTratante> {
    const especialidad = await this.especialidadRepository.findOne({ where: { id } });
    if (!especialidad) {
      throw new BadRequestException(`Especialidad con id ${id} no existe o ya fue eliminada`);
    }

    if (data.nombre) {
      const existente = await this.especialidadRepository.findOne({ where: { nombre: data.nombre } });
      if (existente && existente.id !== id) {
        throw new BadRequestException(`Ya existe una especialidad con el nombre "${data.nombre}"`);
      }
    }

    Object.assign(especialidad, data); // ahora sí actualiza nombre Y activo
    return this.especialidadRepository.save(especialidad);
  }
}