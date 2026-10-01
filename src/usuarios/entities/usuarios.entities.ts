import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Rol } from './rol.enum';

export type UsuarioDocument = HydratedDocument<Usuario>;

@Schema({ collection: 'usuarios', timestamps: true })
export class Usuario {
  @Prop({ type: String, required: true, trim: true, maxlength: 150 })
  nombreCompleto!: string;

  @Prop({ type: String, required: true, unique: true, index: true, trim: true, maxlength: 50 })
  usuario!: string;

  @Prop({ type: String, required: true, select: false })
  contraseña!: string;

  @Prop({ type: String, required: true, enum: Object.values(Rol), index: true })
  rol!: Rol;

  @Prop({ type: Boolean, default: true, index: true })
  activo!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
