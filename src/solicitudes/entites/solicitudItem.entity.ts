import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import { AntibioticoState } from 'src/antibiotico/entities/antibiotico.state';

/**
 * Subdocumento embebido en Solicitud (antes tabla 'solicitud_items').
 * Conserva su propio _id, que es el identificador usado por
 * PATCH /solicitudes/:id/items/estado.
 */
@Schema({ _id: true })
export class SolicitudItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Antibiotico', required: true, index: true })
  antibioticoId!: Types.ObjectId;

  @Prop({ type: String, required: true, maxlength: 50 })
  indicacion!: string;

  @Prop({ type: String, required: true, maxlength: 50 })
  dosis!: string;

  @Prop({ type: String, required: true, maxlength: 50 })
  frecuencia!: string;

  @Prop({ type: String, required: true, maxlength: 50 })
  duracion!: string;

  @Prop({ type: String, required: true, maxlength: 50 })
  viaAdministracion!: string;

  @Prop({ type: Date, required: true })
  fechaInicio!: Date;

  @Prop({ type: Date, required: true })
  fechaFin!: Date;

  /**
   * Estado del ítem dentro de ESTA solicitud.
   * En SQL Server el estado se guardaba en el catálogo de antibióticos,
   * lo que propagaba la suspensión a todas las solicitudes.
   */
  @Prop({ type: String, enum: Object.values(AntibioticoState), default: AntibioticoState.APROBADO })
  state!: AntibioticoState;

  @Prop({ type: String, default: null, maxlength: 1000 })
  observaciones!: string | null;
}

export const SolicitudItemSchema = SchemaFactory.createForClass(SolicitudItem);
