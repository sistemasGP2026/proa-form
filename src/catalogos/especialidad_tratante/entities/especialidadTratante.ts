import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EspecialidadTratanteDocument = HydratedDocument<EspecialidadTratante>;

@Schema({
  collection: 'especialidades_tratantes',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class EspecialidadTratante {
  @Prop({ type: String, required: true, unique: true, index: true, trim: true, maxlength: 100 })
  nombre!: string;

  @Prop({ type: Boolean, default: true, index: true })
  activo!: boolean;

  created_at!: Date;
  updated_at!: Date;
}

export const EspecialidadTratanteSchema = SchemaFactory.createForClass(EspecialidadTratante);
