import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsNumberString,
  IsArray,
  ValidateNested,
  IsOptional,
  ArrayMinSize,
  IsInt,
  IsBoolean,
  ValidateIf,
  IsNumber,
  IsMongoId,
} from 'class-validator';
import { ProfilaxisDto } from './profilaxis.dto';

class MedicamentoDto {
  @IsMongoId({ message: 'El antibiótico seleccionado no es válido' })
  antibioticoId!: string;

  @Type(() => Number) cantidad!: number;

  @Type(() => Number)
  @IsNumber()
  dosis!: number;

  @IsString() @IsNotEmpty() unidadDosis!: string;
  @IsString() @IsNotEmpty() via!: string;
  @IsString() @IsNotEmpty() frecuencia!: string;
  @IsNumberString() duracion!: string;
  @IsString() fechaInicio!: string;

  @IsOptional() @IsString()
  fechaFin?: string;

  /** Texto libre cuando frecuencia === 'OTRO'. */
  @IsOptional() @IsString()
  frecuenciaOtro?: string;

  @IsOptional() @IsString()
  observaciones?: string;
}

export class CrearSolicitudDto {
  @IsString() @IsNotEmpty() nombrePaciente!: string;
  @IsString() @IsNotEmpty() documento!: string;
  @IsString() @IsNotEmpty() diagnosticoPrincipal!: string;
  @IsString() @IsNotEmpty() diagnostico!: string;

  @IsMongoId({ message: 'La sede seleccionada no es válida' })
  sede!: string;

  @IsString() @IsNotEmpty() servicio!: string;
  @IsString() @IsNotEmpty() habitacion!: string;
  @IsString() @IsNotEmpty() especialidad!: string;

  @IsIn(['TRATAMIENTO', 'PROFILAXIS'])
  indicacionAntibiotico!: string;

  @Type(() => Number)
  @IsInt()
  cantidad_antibioticos!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProfilaxisDto)
  profilaxis?: ProfilaxisDto;

  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MedicamentoDto)
  medicamentos!: MedicamentoDto[];

  @IsString() @IsNotEmpty() medicoPrescribe!: string;
  @IsString() @IsNotEmpty() medicoRedacta!: string;

  @Type(() => Boolean) @IsBoolean() pacienteInfectado!: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  tratamientoPrevio!: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  cultivosPrevios!: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  ajustadoGuiaProa!: boolean;

  @ValidateIf((o) => o.ajustadoGuiaProa)
  @IsNotEmpty()
  guiaIndicacion?: string;

  @IsOptional() @IsString() antecedentes?: string;
  @IsOptional() @IsString() creatininaReporte?: string;
  @IsOptional() @IsString() tratamientoPrevioDesc?: string;
}
