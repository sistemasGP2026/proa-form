import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { AntibioticoState } from 'src/antibiotico/entities/antibiotico.state';

export class UpdateEstadoItemsDto {
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  itemsIds!: number[];

  @IsEnum(AntibioticoState)
  estado!: AntibioticoState;

  @IsOptional()
  @IsString()
  observacion?: string;
}