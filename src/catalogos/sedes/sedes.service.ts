import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sede } from './entities/sede.entity';
import { CreateSede } from './dto/createSede.dto';
import { UpdateSede } from './dto/updateSede.dto';
import { toObjectId, toPlain } from 'src/utils/mongo.util';

@Injectable()
export class SedesService {
  constructor(@InjectModel(Sede.name) private readonly sedeModel: Model<Sede>) {}

  async findAllSedesActive(): Promise<any[]> {
    const sedes = await this.sedeModel.find({ activo: true }).sort({ nombre: 1 }).lean().exec();
    return toPlain(sedes);
  }

  async findSedeById(id: string): Promise<any | null> {
    const sede = await this.sedeModel
      .findOne({ _id: toObjectId(id, 'sede'), activo: true })
      .lean()
      .exec();
    return sede ? toPlain(sede) : null;
  }

  async findSedeByNombre(nombre: string): Promise<any | null> {
    const sede = await this.sedeModel.findOne({ nombre, activo: true }).lean().exec();
    return sede ? toPlain(sede) : null;
  }

  async createSede(data: CreateSede): Promise<any> {
    const existeCodigo = await this.sedeModel.exists({ codigo: data.codigo });
    if (existeCodigo) {
      throw new BadRequestException(`Código de sede "${data.codigo}" ya está en uso`);
    }

    const existeNombre = await this.sedeModel.exists({ nombre: data.nombre });
    if (existeNombre) {
      throw new BadRequestException(`Nombre de sede "${data.nombre}" ya está en uso`);
    }

    const nuevaSede = await this.sedeModel.create({
      nombre: data.nombre,
      codigo: data.codigo,
      activo: true,
    });

    return toPlain(nuevaSede.toObject());
  }

  async deleteSede(id: string): Promise<boolean> {
    const _id = toObjectId(id, 'sede');

    const resultado = await this.sedeModel
      .findOneAndUpdate({ _id, activo: true }, { $set: { activo: false } })
      .lean()
      .exec();

    if (!resultado) {
      throw new BadRequestException(`Sede ${id} no existe o ya fue eliminada`);
    }

    return true;
  }

  async updateSede(id: string, data: UpdateSede): Promise<any> {
    const _id = toObjectId(id, 'sede');

    const sede = await this.sedeModel.findOne({ _id, activo: true }).lean().exec();
    if (!sede) {
      throw new BadRequestException(`La sede ${id} no existe o fue eliminada`);
    }

    if (data.codigo) {
      const existeCodigo = await this.sedeModel
        .findOne({ codigo: data.codigo, _id: { $ne: _id } })
        .lean()
        .exec();
      if (existeCodigo) {
        throw new BadRequestException(`Ya existe una sede con el código ${data.codigo}`);
      }
    }

    if (data.nombre) {
      const existeNombre = await this.sedeModel
        .findOne({ nombre: data.nombre, _id: { $ne: _id } })
        .lean()
        .exec();
      if (existeNombre) {
        throw new BadRequestException(`Ya existe una sede con el nombre ${data.nombre}`);
      }
    }

    const actualizada = await this.sedeModel
      .findByIdAndUpdate(_id, { $set: { ...data } }, { new: true })
      .lean()
      .exec();

    return toPlain(actualizada);
  }
}
