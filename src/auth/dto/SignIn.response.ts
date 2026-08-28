import { Rol } from "src/usuarios/entities/rol.enum";
import { Usuario } from "src/usuarios/entities/usuarios.entities";

export interface UsuarioResponse {
    id: number;
    nombreCompleto: string;
    usuario: string;
    rol: Rol;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export class SignInResponse{
    usuario!:UsuarioResponse
    token!:string
}