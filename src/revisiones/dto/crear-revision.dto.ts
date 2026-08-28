import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearRevisionDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  observacion?: string;
}