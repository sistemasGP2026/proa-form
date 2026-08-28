import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TipoAntibiotico } from '../entities/tipoAntibiotico.enum';

export class CreateAntibiotico {
  @IsString() @IsNotEmpty() @MaxLength(30)
  codigo!: string;

  @IsString() @IsNotEmpty() @MaxLength(200)
  nombre!: string;

  @IsEnum(TipoAntibiotico, { message: 'El tipo debe ser RESTRINGIDO o VIGILADO' })
  tipo!: TipoAntibiotico;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}

export class UpdateAntibiotico {
  @IsOptional() @IsString() @MaxLength(30)
  codigo?: string;

  @IsOptional() @IsString() @MaxLength(200)
  nombre?: string;

  @IsOptional() @IsEnum(TipoAntibiotico, { message: 'El tipo debe ser RESTRINGIDO o VIGILADO' })
  tipo?: TipoAntibiotico;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}