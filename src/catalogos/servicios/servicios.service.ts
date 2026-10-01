import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Servicios } from './entities/servicios.entity';
import { CreateServicio, UpdateServicio } from './dto/servicio.dto';
import { toObjectId, toPlain } from 'src/utils/mongo.util';

@Injectable()
export class ServiciosService {
  constructor(@InjectModel(Servicios.name) private readonly servicioModel: Model<Servicios>) {}

  async getAllActive(): Promise<any[]> {
    const servicios = await this.servicioModel
      .find({ activo: true })
      .sort({ nombre: 1 })
      .lean()
      .exec();
    return toPlain(servicios);
  }

  async getById(id: string): Promise<any | null> {
    const servicio = await this.servicioModel.findById(toObjectId(id, 'servicio')).lean().exec();
    return servicio ? toPlain(servicio) : null;
  }

  async create(data: CreateServicio): Promise<any> {
    const existente = await this.servicioModel.exists({ nombre: data.nombre });
    if (existente) {
      throw new BadRequestException(`El servicio "${data.nombre}" ya existe`);
    }

    const nuevo = await this.servicioModel.create({
      nombre: data.nombre,
      activo: data.activo ?? true,
    });

    return toPlain(nuevo.toObject());
  }

  async delete(id: string): Promise<boolean> {
    const actualizado = await this.servicioModel
      .findByIdAndUpdate(toObjectId(id, 'servicio'), { $set: { activo: false } })
      .lean()
      .exec();

    if (!actualizado) {
      throw new BadRequestException(`Servicio con id ${id} no existe o ya fue eliminado`);
    }

    return true;
  }

  async update(id: string, data: UpdateServicio): Promise<any> {
    const _id = toObjectId(id, 'servicio');

    const servicio = await this.servicioModel.findById(_id).lean().exec();
    if (!servicio) {
      throw new BadRequestException(`Servicio con id ${id} no existe o ya fue eliminado`);
    }

    if (data.nombre) {
      const existente = await this.servicioModel
        .findOne({ nombre: data.nombre, _id: { $ne: _id } })
        .lean()
        .exec();
      if (existente) {
        throw new BadRequestException(`Ya existe un servicio con el nombre "${data.nombre}"`);
      }
    }

    const actualizado = await this.servicioModel
      .findByIdAndUpdate(_id, { $set: { ...data } }, { new: true })
      .lean()
      .exec();

    return toPlain(actualizado);
  }
}
