import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Subdocumento embebido dentro de Solicitud.
 * En SQL Server era la tabla 'solicitud_evaluaciones' con relación 1:1;
 * no tiene sentido independiente, por eso se embebe.
 */
@Schema({ _id: false })
export class SolicitudEvaluacion {
  @Prop({ type: String, required: true, trim: true, maxlength: 150 })
  pacienteNombre!: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 30 })
  pacienteDocumento!: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 255 })
  diagnosticoPrincipal!: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 100 })
  diagnosticoRelacionado!: string;

  @Prop({ type: Boolean, default: false })
  pacienteInfectado!: boolean;

  @Prop({ type: Boolean, default: false })
  tratamientoPrevio!: boolean;

  @Prop({ type: String, default: null })
  tratamientoPrevioDesc!: string | null;

  @Prop({ type: Boolean, default: false })
  cultivosPrevios!: boolean;

  @Prop({ type: Boolean, default: false })
  ajustadoGuiaProa!: boolean;

  @Prop({ type: String, default: null })
  guiaIndicacion!: string | null;

  @Prop({ type: String, default: null })
  antecedentes!: string | null;

  @Prop({ type: String, default: null, maxlength: 255 })
  creatininaReporte!: string | null;
}

export const SolicitudEvaluacionSchema = SchemaFactory.createForClass(SolicitudEvaluacion);
