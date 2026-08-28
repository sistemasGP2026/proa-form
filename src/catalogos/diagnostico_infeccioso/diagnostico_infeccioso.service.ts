import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDiagnostico, UpdateDiagnostico } from './dto/diagnostico.dto';
import { DiagnosticoInfeccioso } from './entities/diagnosticos_infecciosos';

@Injectable()
export class DiagnosticoInfecciosoService {
  constructor(
    @InjectRepository(DiagnosticoInfeccioso)
    private readonly diagnosticoRepository: Repository<DiagnosticoInfeccioso>,
  ) {}

  async getAllActive(): Promise<DiagnosticoInfeccioso[]> {
    return this.diagnosticoRepository.find({ where: { activo: true } });
  }

  async getById(id: number): Promise<DiagnosticoInfeccioso | null> {
    return this.diagnosticoRepository.findOne({ where: { id } });
  }

  async create(data: CreateDiagnostico): Promise<DiagnosticoInfeccioso> {
    const existente = await this.diagnosticoRepository.findOne({ where: { nombre: data.nombre } });
    if (existente) {
      throw new BadRequestException(`El diagnóstico "${data.nombre}" ya existe`);
    }

    const nuevo = this.diagnosticoRepository.create({
      nombre: data.nombre,
      activo: data.activo ?? true,
    });

    return this.diagnosticoRepository.save(nuevo);
  }

  async delete(id: number): Promise<boolean> {
    const diagnostico = await this.diagnosticoRepository.findOne({ where: { id } });
    if (!diagnostico) {
      throw new BadRequestException(`Diagnóstico con id ${id} no existe o ya fue eliminado`);
    }

    diagnostico.activo = false;
    await this.diagnosticoRepository.save(diagnostico);

    return true;
  }

  async update(id: number, data: UpdateDiagnostico): Promise<DiagnosticoInfeccioso> {
    const diagnostico = await this.diagnosticoRepository.findOne({ where: { id } });
    if (!diagnostico) {
      throw new BadRequestException(`Diagnóstico con id ${id} no existe o ya fue eliminado`);
    }

    if (data.nombre) {
      const existente = await this.diagnosticoRepository.findOne({ where: { nombre: data.nombre } });
      if (existente && existente.id !== id) {
        throw new BadRequestException(`Ya existe un diagnóstico con el nombre "${data.nombre}"`);
      }
    }

    Object.assign(diagnostico, data);
    return this.diagnosticoRepository.save(diagnostico);
  }
}