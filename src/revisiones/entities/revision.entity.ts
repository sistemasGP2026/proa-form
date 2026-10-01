import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { AntibioticoState } from 'src/antibiotico/entities/antibiotico.state';

export type RevisionDocument = HydratedDocument<Revision>;

@Schema({
  collection: 'revisiones',
  timestamps: { createdAt: 'createdAt', updatedAt: false },
})
export class Revision {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Solicitud', required: true, index: true })
  solicitudId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Usuario', required: true, index: true })
  usuarioId!: Types.ObjectId;

  /** Estado dictaminado. La vista revisiones_main lo muestra y lo filtra. */
  @Prop({ type: String, enum: Object.values(AntibioticoState), required: true, index: true })
  estado!: AntibioticoState;

  /** Ítems de la solicitud alcanzados por el dictamen. */
  @Prop({ type: [MongooseSchema.Types.ObjectId], default: [] })
  itemsIds!: Types.ObjectId[];

  @Prop({ type: String, default: null, maxlength: 2000 })
  observacion!: string | null;

  createdAt!: Date;
}

export const RevisionSchema = SchemaFactory.createForClass(Revision);

RevisionSchema.index({ createdAt: -1 });
