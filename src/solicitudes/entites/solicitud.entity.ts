import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { SolicitudItem, SolicitudItemSchema } from './solicitudItem.entity';
import { SolicitudEvaluacion, SolicitudEvaluacionSchema } from './solicitudEvaluacion.entity';
import { SolicitudProfilaxis, SolicitudProfilaxisSchema } from './solicitudProfilaxis.entity';

export type SolicitudDocument = HydratedDocument<Solicitud>;

@Schema({
  collection: 'solicitudes',
  timestamps: { createdAt: 'submittedAt', updatedAt: 'updatedAt' },
})
export class Solicitud {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Sede', required: true, index: true })
  sedeId!: Types.ObjectId;

  @Prop({ type: String, required: true, maxlength: 50 })
  servicio!: string;

  @Prop({ type: String, required: true, maxlength: 30 })
  habitacion!: string;

  @Prop({ type: String, required: true, maxlength: 100 })
  especialidad!: string;

  @Prop({ type: String, required: true, maxlength: 150 })
  medicoPrescribe!: string;

  @Prop({ type: String, required: true, maxlength: 150 })
  medicoRedacta!: string;

  @Prop({ type: SolicitudEvaluacionSchema, required: true })
  evaluacion!: SolicitudEvaluacion;

  @Prop({ type: [SolicitudItemSchema], default: [] })
  items!: SolicitudItem[];

  @Prop({ type: SolicitudProfilaxisSchema, default: null })
  profilaxis!: SolicitudProfilaxis | null;

  /**
   * Anulación reversible. Una solicitud anulada desaparece de los listados
   * y de la consulta por paciente, pero se conserva en la base junto con
   * sus revisiones, para la trazabilidad del programa.
   */
  @Prop({ type: Boolean, default: false, index: true })
  anulada!: boolean;

  @Prop({ type: Date, default: null })
  anuladaEn!: Date | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Usuario', default: null })
  anuladaPor!: Types.ObjectId | null;

  @Prop({ type: String, default: null, maxlength: 500 })
  motivoAnulacion!: string | null;

  submittedAt!: Date;
  updatedAt!: Date;
}

export const SolicitudSchema = SchemaFactory.createForClass(Solicitud);

SolicitudSchema.index({ submittedAt: -1 });
SolicitudSchema.index({ 'evaluacion.pacienteDocumento': 1 });
