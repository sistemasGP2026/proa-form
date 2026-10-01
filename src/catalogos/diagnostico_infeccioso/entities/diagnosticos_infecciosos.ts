import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DiagnosticoInfecciosoDocument = HydratedDocument<DiagnosticoInfeccioso>;

@Schema({
  collection: 'diagnosticos_infecciosos',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class DiagnosticoInfeccioso {
  @Prop({ type: String, required: true, unique: true, index: true, trim: true, maxlength: 150 })
  nombre!: string;

  @Prop({ type: Boolean, default: true, index: true })
  activo!: boolean;

  created_at!: Date;
  updated_at!: Date;
}

export const DiagnosticoInfecciosoSchema = SchemaFactory.createForClass(DiagnosticoInfeccioso);
