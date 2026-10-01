import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EspecialidadTratante } from './entities/especialidadTratante';
import { CreateEspecialidad, UpdateEspecialidad } from './especialidad/especialidad.dto';
import { toObjectId, toPlain } from 'src/utils/mongo.util';

@Injectable()
export class EspecialidadTratanteService {
  constructor(
    @InjectModel(EspecialidadTratante.name)
    private readonly especialidadModel: Model<EspecialidadTratante>,
  ) {}

  async getAllEspecialidadesActive(): Promise<any[]> {
    const especialidades = await this.especialidadModel
      .find({ activo: true })
      .sort({ nombre: 1 })
      .lean()
      .exec();
    return toPlain(especialidades);
  }

  async getEspecialidadById(id: string): Promise<any | null> {
    const especialidad = await this.especialidadModel
      .findById(toObjectId(id, 'especialidad'))
      .lean()
      .exec();
    return especialidad ? toPlain(especialidad) : null;
  }

  async createEspecialidad(data: CreateEspecialidad): Promise<any> {
    const existente = await this.especialidadModel.exists({ nombre: data.nombre });
    if (existente) {
      throw new BadRequestException(`La especialidad "${data.nombre}" ya existe`);
    }

    const nuevaEspecialidad = await this.especialidadModel.create({
      nombre: data.nombre,
      activo: data.activo ?? true,
    });

    return toPlain(nuevaEspecialidad.toObject());
  }

  async deleteEspecialidad(id: string): Promise<boolean> {
    const actualizada = await this.especialidadModel
      .findByIdAndUpdate(toObjectId(id, 'especialidad'), { $set: { activo: false } })
      .lean()
      .exec();

    if (!actualizada) {
      throw new BadRequestException(`Especialidad con id ${id} no existe o ya fue eliminada`);
    }

    return true;
  }

  async updateEspecialidad(id: string, data: UpdateEspecialidad): Promise<any> {
    const _id = toObjectId(id, 'especialidad');

    const especialidad = await this.especialidadModel.findById(_id).lean().exec();
    if (!especialidad) {
      throw new BadRequestException(`Especialidad con id ${id} no existe o ya fue eliminada`);
    }

    if (data.nombre) {
      const existente = await this.especialidadModel
        .findOne({ nombre: data.nombre, _id: { $ne: _id } })
        .lean()
        .exec();
      if (existente) {
        throw new BadRequestException(`Ya existe una especialidad con el nombre "${data.nombre}"`);
      }
    }

    const actualizada = await this.especialidadModel
      .findByIdAndUpdate(_id, { $set: { ...data } }, { new: true })
      .lean()
      .exec();

    return toPlain(actualizada);
  }
}
