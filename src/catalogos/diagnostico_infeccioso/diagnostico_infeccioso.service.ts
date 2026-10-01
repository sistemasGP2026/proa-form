import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDiagnostico, UpdateDiagnostico } from './dto/diagnostico.dto';
import { DiagnosticoInfeccioso } from './entities/diagnosticos_infecciosos';
import { toObjectId, toPlain } from 'src/utils/mongo.util';

@Injectable()
export class DiagnosticoInfecciosoService {
  constructor(
    @InjectModel(DiagnosticoInfeccioso.name)
    private readonly diagnosticoModel: Model<DiagnosticoInfeccioso>,
  ) {}

  async getAllActive(): Promise<any[]> {
    const diagnosticos = await this.diagnosticoModel
      .find({ activo: true })
      .sort({ nombre: 1 })
      .lean()
      .exec();
    return toPlain(diagnosticos);
  }

  async getById(id: string): Promise<any | null> {
    const diagnostico = await this.diagnosticoModel
      .findById(toObjectId(id, 'diagnostico'))
      .lean()
      .exec();
    return diagnostico ? toPlain(diagnostico) : null;
  }

  async create(data: CreateDiagnostico): Promise<any> {
    const existente = await this.diagnosticoModel.exists({ nombre: data.nombre });
    if (existente) {
      throw new BadRequestException(`El diagnóstico "${data.nombre}" ya existe`);
    }

    const nuevo = await this.diagnosticoModel.create({
      nombre: data.nombre,
      activo: data.activo ?? true,
    });

    return toPlain(nuevo.toObject());
  }

  async delete(id: string): Promise<boolean> {
    const actualizado = await this.diagnosticoModel
      .findByIdAndUpdate(toObjectId(id, 'diagnostico'), { $set: { activo: false } })
      .lean()
      .exec();

    if (!actualizado) {
      throw new BadRequestException(`Diagnóstico con id ${id} no existe o ya fue eliminado`);
    }

    return true;
  }

  async update(id: string, data: UpdateDiagnostico): Promise<any> {
    const _id = toObjectId(id, 'diagnostico');

    const diagnostico = await this.diagnosticoModel.findById(_id).lean().exec();
    if (!diagnostico) {
      throw new BadRequestException(`Diagnóstico con id ${id} no existe o ya fue eliminado`);
    }

    if (data.nombre) {
      const existente = await this.diagnosticoModel
        .findOne({ nombre: data.nombre, _id: { $ne: _id } })
        .lean()
        .exec();
      if (existente) {
        throw new BadRequestException(`Ya existe un diagnóstico con el nombre "${data.nombre}"`);
      }
    }

    const actualizado = await this.diagnosticoModel
      .findByIdAndUpdate(_id, { $set: { ...data } }, { new: true })
      .lean()
      .exec();

    return toPlain(actualizado);
  }
}
