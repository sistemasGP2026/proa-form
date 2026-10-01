import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Revision } from './entities/revision.entity';
import { Antibiotico } from 'src/antibiotico/entities/antibioticos.entity';
import { isObjectId, toObjectId, toPlain } from 'src/utils/mongo.util';

export interface FiltrosRevision {
  solicitudId?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class RevisionesService {
  constructor(@InjectModel(Revision.name) private readonly revisionModel: Model<Revision>) {}

  async listar(filtros: FiltrosRevision = {}) {
    const page = filtros.page && filtros.page > 0 ? filtros.page : 1;
    const limit = filtros.limit && filtros.limit > 0 ? filtros.limit : 20;

    const where: FilterQuery<Revision> = {};

    if (filtros.solicitudId && isObjectId(filtros.solicitudId)) {
      where.solicitudId = toObjectId(filtros.solicitudId, 'solicitudId');
    }

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    const [registros, total] = await Promise.all([
      this.revisionModel
        .find(where)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: 'solicitudId', model: 'Solicitud' })
        .populate({ path: 'usuarioId', model: 'Usuario' })
        .lean()
        .exec(),
      this.revisionModel.countDocuments(where).exec(),
    ]);

    return {
      data: registros.map((registro) => this.mapearRevision(registro)),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async findOne(id: string) {
    const revision = await this.revisionModel
      .findById(toObjectId(id, 'revision'))
      .populate({
        path: 'solicitudId',
        model: 'Solicitud',
        populate: { path: 'items.antibioticoId', model: Antibiotico.name },
      })
      .populate({ path: 'usuarioId', model: 'Usuario' })
      .lean()
      .exec();

    if (!revision) {
      throw new NotFoundException(`La revisión #${id} no fue encontrada.`);
    }

    return this.mapearRevision(revision);
  }

  /** Devuelve revision.solicitud / revision.usuario como esperaban las vistas. */
  private mapearRevision(revision: any) {
    const plana = toPlain(revision);

    const solicitud =
      plana.solicitudId && typeof plana.solicitudId === 'object' ? plana.solicitudId : null;
    const usuario = plana.usuarioId && typeof plana.usuarioId === 'object' ? plana.usuarioId : null;

    if (solicitud?.items) {
      solicitud.items = solicitud.items.map((item: any) => ({
        ...item,
        antibiotico:
          item.antibioticoId && typeof item.antibioticoId === 'object' ? item.antibioticoId : null,
      }));
    }

    return {
      ...plana,
      solicitud,
      solicitudId: solicitud ? solicitud.id : plana.solicitudId,
      usuario,
      usuarioId: usuario ? usuario.id : plana.usuarioId,
    };
  }
}
