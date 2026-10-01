import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SedeDocument = HydratedDocument<Sede>;

@Schema({
  collection: 'sedes',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Sede {
  @Prop({ type: String, required: true, unique: true, index: true, trim: true, maxlength: 30 })
  codigo!: string;

  @Prop({ type: String, required: true, unique: true, index: true, trim: true, maxlength: 100 })
  nombre!: string;

  @Prop({ type: Boolean, default: true, index: true })
  activo!: boolean;

  created_at!: Date;
  updated_at!: Date;
}

export const SedeSchema = SchemaFactory.createForClass(Sede);
