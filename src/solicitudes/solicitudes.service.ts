import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Response } from 'express';
import { SedesService } from 'src/catalogos/sedes/sedes.service';
import { AntibioticoService } from 'src/antibiotico/antibiotico.service';
import { CrearSolicitudDto } from './dto/crear-solicitud.dto';
import { UpdateEstadoItemsDto } from './dto/updateEstadoItemsDto';
import { Solicitud } from './entites/solicitud.entity';
import { Revision } from 'src/revisiones/entities/revision.entity';
import { Antibiotico } from 'src/antibiotico/entities/antibioticos.entity';
import { AntibioticoState } from 'src/antibiotico/entities/antibiotico.state';
import { ExcelParser } from 'src/utils/excelParser';
import { toObjectId, toPlain } from 'src/utils/mongo.util';

const OPCIONES_FECHA: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectModel(Solicitud.name) private readonly solicitudModel: Model<Solicitud>,
    @InjectModel(Revision.name) private readonly revisionModel: Model<Revision>,
    private readonly antibioticoService: AntibioticoService,
    private readonly sedesService: SedesService,
  ) {}

  async crearSolicitud(data: CrearSolicitudDto) {
    const sede = await this.sedesService.findSedeById(data.sede);
    if (!sede) {
      throw new BadRequestException(`La sede: '${data.sede}' no existe o está desactivada`);
    }

    this.validarMedicamentos(data);

    const items = await Promise.all(
      data.medicamentos.map(async (med) => {
        const antibiotico = await this.antibioticoService.getAntibioticoById(med.antibioticoId);
        if (!antibiotico) {
          throw new BadRequestException(`El antibiótico con id ${med.antibioticoId} no existe`);
        }

        const frecuencia =
          med.frecuencia === 'OTRO' && med.frecuenciaOtro ? med.frecuenciaOtro : med.frecuencia;

        return {
          antibioticoId: toObjectId(med.antibioticoId, 'antibioticoId'),
          indicacion: data.indicacionAntibiotico,
          dosis: `${med.dosis} ${med.unidadDosis}`,
          frecuencia,
          duracion: med.duracion,
          viaAdministracion: med.via,
          fechaInicio: this.aFechaUtc(med.fechaInicio),
          fechaFin: this.calcularFechaFin(med.fechaInicio, Number(med.duracion)),
          // Nace aprobada: el auditor PROA solo interviene para suspender.
          state: AntibioticoState.APROBADO,
          observaciones: med.observaciones || null,
        };
      }),
    );

    const solicitud = await this.solicitudModel.create({
      sedeId: toObjectId(sede.id, 'sede'),
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
      },
      profilaxis:
        data.indicacionAntibiotico === 'PROFILAXIS' && data.profilaxis
          ? {
              cirugiaOrtopedia: data.profilaxis.cirugiaOrtopedia,
              gustilloAnderson: data.profilaxis.gustilloAnderson || '',
            }
          : null,
      items,
    });

    return toPlain(solicitud.toObject());
  }

  /** Listado para el personal. Por defecto oculta las solicitudes anuladas. */
  async getAllSolicitudes(soloAnuladas = false): Promise<any[]> {
    const solicitudes = await this.solicitudModel
      .find(soloAnuladas ? { anulada: true } : { anulada: { $ne: true } })
      .sort({ submittedAt: -1 })
      .populate({ path: 'sedeId', model: 'Sede' })
      .populate({ path: 'items.antibioticoId', model: Antibiotico.name })
      .lean()
      .exec();

    return solicitudes.map((solicitud) => this.mapearSolicitud(solicitud));
  }

  /**
   * Consulta pública: solicitudes de UN paciente, por su documento.
   *
   * Solo devuelve resultados con un documento concreto; nunca lista el
   * total de pacientes. Es lo que alimenta la vista de consulta a la que
   * llega el médico después de enviar el formulario.
   */
  async buscarPorDocumento(termino: string): Promise<any[]> {
    const buscado = String(termino ?? '').trim();

    // Sin término se listan todas las solicitudes vigentes; con término se
    // filtra por documento (coincidencia exacta) o por nombre (parcial).
    const filtro: Record<string, any> = { anulada: { $ne: true } };

    if (buscado) {
      const escapado = buscado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filtro.$or = [
        { 'evaluacion.pacienteDocumento': buscado },
        { 'evaluacion.pacienteNombre': { $regex: escapado, $options: 'i' } },
      ];
    }

    const solicitudes = await this.solicitudModel
      .find(filtro)
      .sort({ submittedAt: -1 })
      .populate({ path: 'sedeId', model: 'Sede' })
      .populate({ path: 'items.antibioticoId', model: Antibiotico.name })
      .lean()
      .exec();

    return solicitudes.map((solicitud) => this.mapearSolicitud(solicitud));
  }

  async getSolicitudById(id: string) {
    const _id = toObjectId(id, 'solicitud');

    const solicitud = await this.solicitudModel
      .findById(_id)
      .populate({ path: 'sedeId', model: 'Sede' })
      .populate({ path: 'items.antibioticoId', model: Antibiotico.name })
      .lean()
      .exec();

    if (!solicitud) {
      throw new NotFoundException(`La solicitud con ID #${id} no existe`);
    }

    const revisiones = await this.revisionModel
      .find({ solicitudId: _id })
      .sort({ createdAt: -1 })
      .populate({ path: 'usuarioId', model: 'Usuario' })
      .lean()
      .exec();

    const mapeada = this.mapearSolicitud(solicitud);

    return {
      ...mapeada,
      submittedAt: solicitud.submittedAt
        ? new Date(solicitud.submittedAt).toLocaleDateString('es-CO', OPCIONES_FECHA)
        : null,
      revisiones: revisiones.map((revision: any) => {
        const plana = toPlain(revision);
        return {
          ...plana,
          usuario: plana.usuarioId && typeof plana.usuarioId === 'object' ? plana.usuarioId : null,
          usuarioId:
            plana.usuarioId && typeof plana.usuarioId === 'object'
              ? plana.usuarioId.id
              : plana.usuarioId,
          createdAt: revision.createdAt
            ? new Date(revision.createdAt).toLocaleDateString('es-CO', OPCIONES_FECHA)
            : null,
        };
      }),
    };
  }

  /**
   * Dictamina en lote los ítems de una solicitud y deja constancia en Revisiones.
   * El estado se guarda en el ítem, no en el catálogo de antibióticos.
   */
  async updateEstadoItems(
    solicitudId: string,
    dto: UpdateEstadoItemsDto,
    usuario?: { id?: string; rol?: string },
  ) {
    const _id = toObjectId(solicitudId, 'solicitud');

    const itemsIdsArray = (Array.isArray(dto.itemsIds) ? dto.itemsIds : [dto.itemsIds])
      .filter((valor) => valor !== null && valor !== undefined && String(valor).trim() !== '')
      .map((valor) => toObjectId(valor, 'itemsIds'));

    if (!itemsIdsArray.length) {
      throw new BadRequestException('No se enviaron IDs de ítems válidos');
    }

    const solicitud = await this.solicitudModel.findById(_id).exec();
    if (!solicitud) {
      throw new NotFoundException(`La solicitud con ID #${solicitudId} no existe`);
    }

    const idsSolicitados = itemsIdsArray.map((valor) => valor.toString());
    const itemsEncontrados = (solicitud.items as any[]).filter((item) =>
      idsSolicitados.includes(item._id.toString()),
    );

    if (!itemsEncontrados.length) {
      throw new NotFoundException('No se encontraron los ítems especificados');
    }

    for (const item of itemsEncontrados) {
      item.state = dto.estado;
    }

    await solicitud.save();

    if (usuario?.id) {
      await this.revisionModel.create({
        solicitudId: _id,
        usuarioId: toObjectId(usuario.id, 'usuario'),
        estado: dto.estado,
        itemsIds: itemsEncontrados.map((item) => item._id),
        observacion: dto.observacion?.trim() ? dto.observacion.trim() : null,
      });
    }

    return { success: true, message: 'Estados actualizados correctamente' };
  }

  /**
   * Anula una solicitud sin borrarla. Reversible con reactivarSolicitud.
   * Solo el administrador llega aquí (lo restringe el controlador).
   */
  async anularSolicitud(
    solicitudId: string,
    usuario?: { id?: string },
    motivo?: string,
  ) {
    const _id = toObjectId(solicitudId, 'solicitud');

    const solicitud = await this.solicitudModel.findById(_id).lean().exec();
    if (!solicitud) {
      throw new NotFoundException(`La solicitud con ID #${solicitudId} no existe`);
    }

    if ((solicitud as any).anulada === true) {
      throw new BadRequestException('Esta solicitud ya se encuentra anulada');
    }

    await this.solicitudModel
      .findByIdAndUpdate(_id, {
        $set: {
          anulada: true,
          anuladaEn: new Date(),
          anuladaPor: usuario?.id ? toObjectId(usuario.id, 'usuario') : null,
          motivoAnulacion: motivo?.trim() ? motivo.trim() : null,
        },
      })
      .exec();

    return { success: true, message: 'Solicitud anulada correctamente' };
  }

  /** Devuelve a los listados una solicitud anulada. */
  async reactivarSolicitud(solicitudId: string) {
    const _id = toObjectId(solicitudId, 'solicitud');

    const solicitud = await this.solicitudModel.findById(_id).lean().exec();
    if (!solicitud) {
      throw new NotFoundException(`La solicitud con ID #${solicitudId} no existe`);
    }

    if ((solicitud as any).anulada !== true) {
      throw new BadRequestException('Esta solicitud no está anulada');
    }

    await this.solicitudModel
      .findByIdAndUpdate(_id, {
        $set: { anulada: false, anuladaEn: null, anuladaPor: null, motivoAnulacion: null },
      })
      .exec();

    return { success: true, message: 'Solicitud reactivada correctamente' };
  }

  /**
   * Borrado definitivo: elimina la solicitud y las revisiones que la
   * referencian, para no dejar registros huérfanos. No se puede deshacer.
   *
   * Exige que la solicitud esté anulada primero, de modo que un clic
   * accidental no destruya un registro en uso.
   */
  async eliminarSolicitudDefinitivo(solicitudId: string) {
    const _id = toObjectId(solicitudId, 'solicitud');

    const solicitud = await this.solicitudModel.findById(_id).lean().exec();
    if (!solicitud) {
      throw new NotFoundException(`La solicitud con ID #${solicitudId} no existe`);
    }

    if ((solicitud as any).anulada !== true) {
      throw new BadRequestException(
        'Antes de eliminarla definitivamente debe anular la solicitud',
      );
    }

    const revisiones = await this.revisionModel.deleteMany({ solicitudId: _id }).exec();
    await this.solicitudModel.findByIdAndDelete(_id).exec();

    return {
      success: true,
      message: 'Solicitud eliminada definitivamente',
      revisionesEliminadas: revisiones.deletedCount ?? 0,
    };
  }

  /**
   * Exporta a Excel con UNA FILA POR ANTIBIÓTICO: los datos de la solicitud
   * se repiten en cada fila, de modo que la hoja se puede filtrar y tabular
   * por antibiótico, por estado o por servicio.
   *
   * Las solicitudes anuladas quedan fuera, igual que en los listados.
   */
  async exportarSolicitudesExcel(res: Response): Promise<void> {
    const solicitudes = await this.getAllSolicitudes();

    const siNo = (valor: unknown) => (valor === true ? 'Sí' : 'No');

    const fechaHora = (valor: unknown) => {
      if (!valor) return '';
      const d = new Date(valor as any);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    };

    // Las fechas de vigencia se guardan a medianoche UTC: se leen en UTC
    // para que no se corran un día al formatearlas.
    const soloFecha = (valor: unknown) => {
      if (!valor) return '';
      const d = new Date(valor as any);
      if (Number.isNaN(d.getTime())) return '';
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}/${d.getUTCFullYear()}`;
    };

    const dataExportar: Record<string, any>[] = [];

    for (const sol of solicitudes) {
      const base = {
        submittedAt: fechaHora(sol.submittedAt),
        pacienteNombre: sol.evaluacion?.pacienteNombre ?? '',
        pacienteDocumento: sol.evaluacion?.pacienteDocumento ?? '',
        sede: sol.sede?.nombre ?? '',
        servicio: sol.servicio ?? '',
        habitacion: sol.habitacion ?? '',
        especialidad: sol.especialidad ?? '',
        diagnosticoPrincipal: sol.evaluacion?.diagnosticoPrincipal ?? '',
        diagnosticoRelacionado: sol.evaluacion?.diagnosticoRelacionado ?? '',
        medicoPrescribe: sol.medicoPrescribe ?? '',
        medicoRedacta: sol.medicoRedacta ?? '',
        pacienteInfectado: siNo(sol.evaluacion?.pacienteInfectado),
        cultivosPrevios: siNo(sol.evaluacion?.cultivosPrevios),
        tratamientoPrevio: siNo(sol.evaluacion?.tratamientoPrevio),
        ajustadoGuiaProa: siNo(sol.evaluacion?.ajustadoGuiaProa),
      };

      const items = sol.items ?? [];

      if (!items.length) {
        // Sin antibióticos: la solicitud igual aparece, con esas columnas vacías.
        dataExportar.push({
          ...base,
          antibiotico: '', tipo: '', indicacion: '', dosis: '', frecuencia: '',
          via: '', duracion: '', fechaInicio: '', fechaFin: '', estado: '',
        });
        continue;
      }

      for (const item of items) {
        dataExportar.push({
          ...base,
          antibiotico: item.antibiotico?.nombre ?? '',
          tipo: item.antibiotico?.tipo ?? '',
          indicacion: item.indicacion ?? '',
          dosis: item.dosis ?? '',
          frecuencia: item.frecuencia ?? '',
          via: item.viaAdministracion ?? '',
          duracion: item.duracion ?? '',
          fechaInicio: soloFecha(item.fechaInicio),
          fechaFin: soloFecha(item.fechaFin),
          estado: item.state ?? '',
        });
      }
    }

    const columns = [
      { header: 'Fecha de solicitud', key: 'submittedAt', width: 20 },
      { header: 'Paciente', key: 'pacienteNombre', width: 30 },
      { header: 'Identificación', key: 'pacienteDocumento', width: 18 },
      { header: 'Sede', key: 'sede', width: 22 },
      { header: 'Servicio', key: 'servicio', width: 22 },
      { header: 'Cama', key: 'habitacion', width: 10 },
      { header: 'Especialidad', key: 'especialidad', width: 24 },
      { header: 'Diagnóstico principal', key: 'diagnosticoPrincipal', width: 30 },
      { header: 'Diagnóstico relacionado', key: 'diagnosticoRelacionado', width: 28 },
      { header: 'Médico que prescribe', key: 'medicoPrescribe', width: 28 },
      { header: 'Médico que redacta', key: 'medicoRedacta', width: 28 },
      { header: 'Paciente infectado', key: 'pacienteInfectado', width: 16 },
      { header: 'Cultivos previos', key: 'cultivosPrevios', width: 15 },
      { header: 'Tratamiento previo', key: 'tratamientoPrevio', width: 17 },
      { header: 'Ajustado a guía PROA', key: 'ajustadoGuiaProa', width: 19 },
      { header: 'Antibiótico', key: 'antibiotico', width: 26 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Indicación', key: 'indicacion', width: 16 },
      { header: 'Dosis', key: 'dosis', width: 14 },
      { header: 'Frecuencia', key: 'frecuencia', width: 18 },
      { header: 'Vía', key: 'via', width: 16 },
      { header: 'Duración (días)', key: 'duracion', width: 14 },
      { header: 'Inicio', key: 'fechaInicio', width: 13 },
      { header: 'Fin', key: 'fechaFin', width: 13 },
      { header: 'Estado', key: 'estado', width: 15 },
    ];

    // Centradas: fecha, identificación, cama, los sí/no, duración, vigencia y estado.
    const centradas = [1, 3, 6, 12, 13, 14, 15, 17, 22, 23, 24, 25];

    const parser = new ExcelParser();

    await parser.exportToExcel(
      dataExportar, columns, res, 'solicitudes-proa.xlsx', 'Solicitudes', centradas,
    );
  }

  // ───────────────────────── privados ─────────────────────────

  /**
   * Reconstruye la forma que esperaban las vistas con TypeORM:
   * solicitud.sede, item.antibiotico e item.state calculado.
   */
  private mapearSolicitud(solicitud: any) {
    const plana = toPlain(solicitud);
    const hoy = this.hoyUtc();

    const sedePoblada = plana.sedeId && typeof plana.sedeId === 'object' ? plana.sedeId : null;

    const items = (plana.items ?? []).map((item: any) => {
      const antibiotico =
        item.antibioticoId && typeof item.antibioticoId === 'object' ? item.antibioticoId : null;

      return {
        ...item,
        antibiotico,
        antibioticoId: antibiotico ? antibiotico.id : item.antibioticoId,
        state: this.calcularEstadoItem(item, hoy),
      };
    });

    return {
      ...plana,
      sede: sedePoblada,
      sedeId: sedePoblada ? sedePoblada.id : plana.sedeId,
      items,
      status: this.calcularEstadoSolicitud(items),
    };
  }

  private calcularEstadoItem(item: any, hoy: Date): AntibioticoState {
    if (item.state === AntibioticoState.SUSPENDIDO) return AntibioticoState.SUSPENDIDO;

    // Los registros anteriores con el estado PENDIENTE, que ya no se genera,
    // se leen como aprobados: hoy toda solicitud nace aprobada.
    if (item.fechaFin) {
      const fin = new Date(item.fechaFin);
      if (!Number.isNaN(fin.getTime()) && fin.getTime() < hoy.getTime()) {
        return AntibioticoState.FINALIZADO;
      }
    }

    return AntibioticoState.APROBADO;
  }

  /**
   * Resumen de la solicitud. Prevalece lo que exige atención: lo suspendido.
   */
  private calcularEstadoSolicitud(items: any[]): string {
    if (!items.length) return '';
    if (items.some((item) => item.state === AntibioticoState.SUSPENDIDO)) {
      return AntibioticoState.SUSPENDIDO;
    }
    if (items.every((item) => item.state === AntibioticoState.FINALIZADO)) {
      return AntibioticoState.FINALIZADO;
    }
    return AntibioticoState.APROBADO;
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

  /** 'YYYY-MM-DD' -> medianoche UTC, sin corrimiento por zona horaria. */
  private aFechaUtc(fecha: string): Date {
    const parsed = new Date(fecha);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`La fecha "${fecha}" no es válida`);
    }
    return new Date(
      Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()),
    );
  }

  private calcularFechaFin(fechaInicioStr: string, dias: number): Date {
    const fecha = this.aFechaUtc(fechaInicioStr);
    const duracion = Number.isFinite(dias) && dias > 0 ? dias : 1;
    fecha.setUTCDate(fecha.getUTCDate() + duracion - 1);
    return fecha;
  }

  private hoyUtc(): Date {
    const ahora = new Date();
    return new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
  }
}
