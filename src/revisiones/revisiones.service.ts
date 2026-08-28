import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Revision } from './entities/revision.entity';

export interface FiltrosRevision {
    solicitudId?: number;
    page?: number;
    limit?: number;
}

@Injectable()
export class RevisionesService {
    constructor(
        @InjectRepository(Revision)
        private readonly revisionRepository: Repository<Revision>,
    ) { }

    async listar(filtros: FiltrosRevision = {}) {
        const page = filtros.page ?? 1;
        const limit = filtros.limit ?? 20;

        const query = this.revisionRepository
            .createQueryBuilder('revision')
            .leftJoinAndSelect('revision.solicitud', 'solicitud')
            .leftJoinAndSelect('solicitud.evaluacion', 'evaluacion')
            .leftJoinAndSelect('revision.usuario', 'usuario')
            .orderBy('revision.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (filtros.solicitudId) {
            query.andWhere('revision.solicitudId = :solicitudId', { solicitudId: filtros.solicitudId });
        }

        const [data, total] = await query.getManyAndCount();

        return {
            data,
            meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        };
    }

    async findOne(id: number) {
        const revision = await this.revisionRepository.findOne({
            where: { id },
            relations: {
                usuario: true,
                solicitud: {
                    evaluacion: true,
                    items: {
                        antibiotico: true
                    }, 
                },
            },
        });

        if (!revision) {
            throw new NotFoundException(`La revisión #${id} no fue encontrada.`);
        }

        return revision;
    }
}