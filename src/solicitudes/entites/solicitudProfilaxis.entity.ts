import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Condición de profilaxis enviada por el formulario.
 * En el modelo SQL Server llegaba en el DTO pero nunca se persistía.
 */
@Schema({ _id: false })
export class SolicitudProfilaxis {
  @Prop({ type: String, enum: ['SI', 'NO'], required: true })
  cirugiaOrtopedia!: string;

  @Prop({ type: String, enum: ['SI', 'NO', ''], default: '' })
  gustilloAnderson!: string;
}

export const SolicitudProfilaxisSchema = SchemaFactory.createForClass(SolicitudProfilaxis);
