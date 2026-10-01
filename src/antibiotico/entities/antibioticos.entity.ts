import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TipoAntibiotico } from './tipoAntibiotico.enum';
import { AntibioticoState } from './antibiotico.state';

export type AntibioticoDocument = HydratedDocument<Antibiotico>;

@Schema({ collection: 'antibioticos', timestamps: true })
export class Antibiotico {
  @Prop({ type: String, required: true, unique: true, index: true, trim: true, maxlength: 30 })
  codigo!: string;

  @Prop({ type: String, required: true, index: true, trim: true, maxlength: 200 })
  nombre!: string;

  @Prop({ type: String, required: true, enum: Object.values(TipoAntibiotico), index: true })
  tipo!: TipoAntibiotico;

  @Prop({ type: Boolean, default: true, index: true })
  activo!: boolean;

  /**
   * Estado del antibiótico en el catálogo.
   * El estado por prescripción vive en cada ítem de la solicitud (SolicitudItem.state).
   */
  @Prop({ type: String, enum: Object.values(AntibioticoState), default: AntibioticoState.APROBADO })
  state!: AntibioticoState;

  createdAt!: Date;
  updatedAt!: Date;
}

export const AntibioticoSchema = SchemaFactory.createForClass(Antibiotico);
