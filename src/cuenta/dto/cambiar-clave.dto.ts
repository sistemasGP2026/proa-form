import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CambiarClaveDto {
  @IsString() @IsNotEmpty({ message: 'Escriba su contraseña actual' })
  actual!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña nueva debe tener al menos 6 caracteres' })
  nueva!: string;

  @IsString() @IsNotEmpty({ message: 'Confirme la contraseña nueva' })
  confirmacion!: string;
}
