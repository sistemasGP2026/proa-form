import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { SedesService } from 'src/catalogos/sedes/sedes.service';
import { AntibioticoService } from 'src/antibiotico/antibiotico.service';
import { CrearSolicitudDto } from './dto/crear-solicitud.dto';
import { Solicitud } from './entites/solicitud.entity';
import { SolicitudItem } from './entites/solicitudItem.entity';
import { SolicitudEvaluacion } from './entites/solicitudEvaluacion.entity';
import { ExcelParser } from 'src/utils/excelParser';
import { Response } from 'express';
import { Revision } from 'src/revisiones/entities/revision.entity';
import { AntibioticoState } from 'src/antibiotico/entities/antibiotico.state';
import { Antibiotico } from 'src/antibiotico/entities/antibioticos.entity';
@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(Solicitud)
    private readonly solicitudRepository: Repository<Solicitud>,

    @InjectRepository(SolicitudItem)
    private readonly solicitudItemRepository: Repository<SolicitudItem>,

    @InjectRepository(Revision)
    private readonly revisionRepository: Repository<Revision>,

    private readonly antibioticoService: AntibioticoService,
    private readonly sedesService: SedesService,
  ) { }

  async crearSolicitud(data: CrearSolicitudDto) {
    const sede = await this.sedesService.findSedeById(data.sede);
    if (!sede) {
      throw new BadRequestException(`La sede: '${data.sede}' no existe o está desactivada`);
    }

    this.validarMedicamentos(data);

    const items = await Promise.all(data.medicamentos.map(async (med) => {
      const antibioticoId = Number(med.antibioticoId);
      const antibiotico = await this.antibioticoService.getAntibioticoById(antibioticoId);
      if (!antibiotico) {
        throw new BadRequestException(`El antibiótico con id ${antibioticoId} no existe`);
      }

      return this.solicitudRepository.manager.create(SolicitudItem, {
        antibioticoId,
        indicacion: data.indicacionAntibiotico,
        dosis: `${med.dosis} ${med.unidadDosis}`,
        frecuencia: med.frecuencia,
        duracion: med.duracion,
        viaAdministracion: med.via,
        fechaInicio: new Date(med.fechaInicio),
        fechaFin: this.calcularFechaFin(med.fechaInicio, Number(med.duracion)),
      });
    }),
    );

    const solicitud = this.solicitudRepository.create({
      sedeId: sede.id,
      servicio: data.servicio,
      habitacion: data.habitacion,
      especialidad: data.especialidad,
      medicoPrescribe: data.medicoPrescribe,
      medicoRedacta: data.medicoRedacta,
      evaluacion: {
        pacienteNombre: data.nombrePaciente,
        pacienteDocumento: data.documento,
        diagnosticoPrincipal: data.diagnosticoPrincipal,
        diagnosticoRelacionado: data.diagnostico,
        pacienteInfectado: data.pacienteInfectado === true,
        tratamientoPrevio: data.tratamientoPrevio === true,
        tratamientoPrevioDesc: data.tratamientoPrevioDesc || null,
        cultivosPrevios: data.cultivosPrevios === true,
        ajustadoGuiaProa: data.ajustadoGuiaProa === true,
        guiaIndicacion: data.guiaIndicacion || null,
        antecedentes: data.antecedentes || null,
        creatininaReporte: data.creatininaReporte || null,
      } as SolicitudEvaluacion,
      items,
    });

    return this.solicitudRepository.save(solicitud);
  }

  async getAllSolicitudes(): Promise<Solicitud[]> {
    return await this.solicitudRepository.find({
      relations: { evaluacion: true, sede: true, items: { antibiotico: true } },
      order: { submittedAt: 'DESC' },
    });
  }

  async getSolicitudById(id: number) {
    const { entities, raw } = await this.solicitudRepository
      .createQueryBuilder('solicitud')
      .leftJoinAndSelect('solicitud.sede', 'sede')
      .leftJoinAndSelect('solicitud.evaluacion', 'evaluacion')
      .leftJoinAndSelect('solicitud.items', 'item')
      .leftJoinAndSelect('item.antibiotico', 'antibiotico')
      .leftJoinAndSelect('solicitud.revisiones', 'revision')
      .leftJoinAndSelect('revision.usuario', 'usuario')
      .addSelect(
        `CASE
         WHEN antibiotico.state = '${AntibioticoState.SUSPENDIDO}' THEN '${AntibioticoState.SUSPENDIDO}'
         WHEN item.fechaFin < CAST(GETDATE() AS date) THEN '${AntibioticoState.FINALIZADO}'
         ELSE '${AntibioticoState.APROBADO}'
       END`,
        'item_state',
      )
      .where('solicitud.id = :id', { id })
      .orderBy('revision.createdAt', 'DESC')
      .getRawAndEntities();

    const solicitud = entities[0];

    if (!solicitud) {
      throw new NotFoundException(`La solicitud con ID #${id} no existe`);
    }

    // Mapear el estado calculado hacia cada item asegurando el tipo
    const itemsConEstado = solicitud.items.map((item) => {
      const rawMatch = raw.find((r) => r.item_id === item.id);
      return {
        ...item,
        state: rawMatch ? rawMatch.item_state : (item.antibiotico?.state || AntibioticoState.APROBADO),
      };
    });

    const optionsFecha: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    return {
      ...solicitud,
      items: itemsConEstado,
      submittedAt: solicitud.submittedAt
        ? new Date(solicitud.submittedAt).toLocaleDateString('es-CO', optionsFecha)
        : null,
      revisiones: solicitud.revisiones.map((rev) => ({
        ...rev,
        createdAt: rev.createdAt
          ? new Date(rev.createdAt).toLocaleDateString('es-CO', optionsFecha)
          : null,
      })),
    };
  }

  async exportarSolicitudesExcel(res: Response): Promise<void> {
    const solicitudes = await this.solicitudRepository.find({
      relations: {
        evaluacion: true,
        sede: true,
        items: {
          antibiotico: true,
        },
      },
    });

    const dataExportar = solicitudes.map((sol) => ({
      id: sol.id,
      submittedAt: sol.submittedAt,
      pacienteNombre: sol.evaluacion?.pacienteNombre ?? '—',
      sede: sol.sede?.nombre ?? '—',
      servicio: sol.servicio,
      habitacion: sol.habitacion,
      especialidad: sol.especialidad,
      medicoPrescribe: sol.medicoPrescribe,
      medicoRedacta: sol.medicoRedacta,
    }));

    const columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Fecha', key: 'submittedAt', width: 20 },
      { header: 'Paciente', key: 'pacienteNombre', width: 30 },
      { header: 'Sede', key: 'sede', width: 25 },
      { header: 'Servicio', key: 'servicio', width: 25 },
      { header: 'Habitación', key: 'habitacion', width: 15 },
      { header: 'Especialidad', key: 'especialidad', width: 25 },
      { header: 'Médico que prescribe', key: 'medicoPrescribe', width: 30 },
      { header: 'Médico que redacta', key: 'medicoRedacta', width: 30 },
      { header: 'Estado', key: 'status', width: 20 },
    ];

    const parser = new ExcelParser();

    await parser.exportToExcel(dataExportar, columns, res, 'solicitudes-proa.xlsx', 'Solicitudes');
  }

  private validarMedicamentos(data: CrearSolicitudDto): void {
    if (Number(data.cantidad_antibioticos) !== data.medicamentos.length) {
      throw new BadRequestException(
        `La cantidad indicada (${data.cantidad_antibioticos}) no coincide con la cantidad formulada (${data.medicamentos.length})`,
      );
    }

    if (data.indicacionAntibiotico === 'PROFILAXIS' && data.medicamentos.length > 2) {
      throw new BadRequestException('En Profilaxis solo se permiten hasta 2 antibióticos');
    }

    if (data.indicacionAntibiotico === 'TRATAMIENTO' && data.medicamentos.length > 3) {
      throw new BadRequestException('En Tratamiento solo se permiten hasta 3 antibióticos');
    }
  }

  async updateEstadoItems(solicitudId: number,dto: { itemsIds: number | number[]; estado: AntibioticoState; observacion?: string }) {
    // 1. Garantizar que siempre sea un Arreglo (iterable)
    const itemsIdsArray = Array.isArray(dto.itemsIds)
      ? dto.itemsIds
      : [dto.itemsIds].filter(Boolean);

    if (!itemsIdsArray.length) {
      throw new BadRequestException('No se enviaron IDs de ítems válidos');
    }

    const items = await this.solicitudItemRepository.find({
      where: {
        id: In(itemsIdsArray),
        solicitudId: solicitudId
      },
      relations: { antibiotico: true },
    });

    if (!items || items.length === 0) {
      throw new NotFoundException('No se encontraron los ítems especificados');
    }

    // 3. Actualizar el estado en cada antibiótico
    for (const item of items) {
      if (item.antibiotico) {
        item.antibiotico.state = dto.estado;
        await this.antibioticoService.update(item.antibioticoId, item.antibiotico);
      }
    }

    return { success: true, message: 'Estados actualizados correctamente' };
  }

  private calcularFechaFin(fechaInicioStr: string, dias: number): Date {
    const fecha = new Date(fechaInicioStr);
    fecha.setDate(fecha.getDate() + dias - 1);
    return fecha;
  }
}