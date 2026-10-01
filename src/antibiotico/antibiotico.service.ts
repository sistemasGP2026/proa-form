import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Antibiotico } from './entities/antibioticos.entity';
import { TipoAntibiotico } from './entities/tipoAntibiotico.enum';
import { CreateAntibiotico, UpdateAntibiotico } from './dto/antibiotico.dto';
import { toObjectId, toPlain } from 'src/utils/mongo.util';

@Injectable()
export class AntibioticoService {
  constructor(
    @InjectModel(Antibiotico.name) private readonly antibioticoModel: Model<Antibiotico>,
  ) {}

  async getAntibioticosRestringidos(): Promise<any[]> {
    const antibioticos = await this.antibioticoModel
      .find({ tipo: TipoAntibiotico.RESTRINGIDO, activo: true })
      .sort({ nombre: 1 })
      .lean()
      .exec();
    return toPlain(antibioticos);
  }

  async getAntibioticosVigilado(): Promise<any[]> {
    const antibioticos = await this.antibioticoModel
      .find({ tipo: TipoAntibiotico.VIGILADO, activo: true })
      .sort({ nombre: 1 })
      .lean()
      .exec();
    return toPlain(antibioticos);
  }

  async getAllActive(): Promise<any[]> {
    const antibioticos = await this.antibioticoModel
      .find({ activo: true })
      .sort({ nombre: 1 })
      .lean()
      .exec();
    return toPlain(antibioticos);
  }

  async getById(id: string): Promise<any | null> {
    const antibiotico = await this.antibioticoModel
      .findById(toObjectId(id, 'antibiotico'))
      .lean()
      .exec();
    return antibiotico ? toPlain(antibiotico) : null;
  }

  /** Usado por SolicitudesService: solo devuelve antibióticos habilitados. */
  async getAntibioticoById(id: string | Types.ObjectId): Promise<any | null> {
    const antibiotico = await this.antibioticoModel
      .findOne({ _id: toObjectId(id, 'antibiotico'), activo: true })
      .lean()
      .exec();
    return antibiotico ? toPlain(antibiotico) : null;
  }

  async create(data: CreateAntibiotico): Promise<any> {
    const existeCodigo = await this.antibioticoModel.exists({ codigo: data.codigo });
    if (existeCodigo) {
      throw new BadRequestException(`El código "${data.codigo}" ya está en uso`);
    }

    const existeNombre = await this.antibioticoModel.exists({ nombre: data.nombre });
    if (existeNombre) {
      throw new BadRequestException(`El antibiótico "${data.nombre}" ya existe`);
    }

    const nuevo = await this.antibioticoModel.create({
      codigo: data.codigo,
      nombre: data.nombre,
      tipo: data.tipo,
      activo: data.activo ?? true,
    });

    return toPlain(nuevo.toObject());
  }

  async delete(id: string): Promise<boolean> {
    const actualizado = await this.antibioticoModel
      .findByIdAndUpdate(toObjectId(id, 'antibiotico'), { $set: { activo: false } })
      .lean()
      .exec();

    if (!actualizado) {
      throw new BadRequestException(`Antibiótico con id ${id} no existe o ya fue eliminado`);
    }

    return true;
  }

  async update(id: string, data: UpdateAntibiotico): Promise<any> {
    const _id = toObjectId(id, 'antibiotico');

    const antibiotico = await this.antibioticoModel.findById(_id).lean().exec();
    if (!antibiotico) {
      throw new BadRequestException(`Antibiótico con id ${id} no existe o ya fue eliminado`);
    }

    if (data.codigo) {
      const existeCodigo = await this.antibioticoModel
        .findOne({ codigo: data.codigo, _id: { $ne: _id } })
        .lean()
        .exec();
      if (existeCodigo) {
        throw new BadRequestException(`Ya existe un antibiótico con el código "${data.codigo}"`);
      }
    }

    if (data.nombre) {
      const existeNombre = await this.antibioticoModel
        .findOne({ nombre: data.nombre, _id: { $ne: _id } })
        .lean()
        .exec();
      if (existeNombre) {
        throw new BadRequestException(`Ya existe un antibiótico con el nombre "${data.nombre}"`);
      }
    }

    const actualizado = await this.antibioticoModel
      .findByIdAndUpdate(_id, { $set: { ...data } }, { new: true })
      .lean()
      .exec();

    return toPlain(actualizado);
  }
}
