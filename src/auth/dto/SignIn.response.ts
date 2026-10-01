import { Rol } from 'src/usuarios/entities/rol.enum';

export interface UsuarioResponse {
  id: string;
  nombreCompleto: string;
  usuario: string;
  rol: Rol;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SignInResponse {
  usuario!: UsuarioResponse;
  token!: string;
}
