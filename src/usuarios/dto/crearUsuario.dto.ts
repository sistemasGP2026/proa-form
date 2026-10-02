import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Rol } from '../entities/rol.enum';

export class CrearUsuario {
  @IsString() @IsNotEmpty()
  nombreCompleto!: string;

  @IsString() @IsNotEmpty()
  usuario!: string;

  /**
   * Opcional: si no se envia, la cuenta nace con la contraseña inicial
   * y queda marcada para que la persona la cambie al ingresar.
   */
  @IsOptional() @IsString() @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contraseña?: string;

  @IsEnum(Rol, { message: 'El rol seleccionado no es válido' })
  rol!: Rol;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}

export class ActualizarUsuario {
  @IsOptional() @IsString() @IsNotEmpty()
  nombreCompleto?: string;

  @IsOptional() @IsString() @IsNotEmpty()
  usuario?: string;

  @IsOptional() @IsString() @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contraseña?: string;

  @IsOptional() @IsEnum(Rol, { message: 'El rol seleccionado no es válido' })
  rol?: Rol;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}