import { IsArray, IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { AntibioticoState } from 'src/antibiotico/entities/antibiotico.state';

export class UpdateEstadoItemsDto {
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsMongoId({ each: true, message: 'Uno de los ítems seleccionados no es válido' })
  itemsIds!: string[];

  @IsEnum(AntibioticoState, { message: 'El estado enviado no es válido' })
  estado!: AntibioticoState;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacion?: string;
}
