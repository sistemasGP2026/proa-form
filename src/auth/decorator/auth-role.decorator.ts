import { SetMetadata } from '@nestjs/common';
import { Rol } from 'src/usuarios/entities/rol.enum';

export const ROLES_KEY = 'roles';
export const AuthRole = (...rol: Rol[]) => SetMetadata(ROLES_KEY, rol);