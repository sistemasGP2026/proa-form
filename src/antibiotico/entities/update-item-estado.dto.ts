import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { AntibioticoState } from './antibiotico.state';

export class UpdateItemEstadoDto {
  @IsEnum(AntibioticoState)
  estado!: AntibioticoState;

  @IsOptional()
  @IsString()
  observacion!: string;
}

export class BulkUpdateItemEstadoDto {
  @IsArray()
  @IsString({ each: true })
  itemIds!: string[];

  @IsEnum(AntibioticoState)
  estado!: AntibioticoState;

  @IsOptional()
  @IsString()
  observacion?: string;
}