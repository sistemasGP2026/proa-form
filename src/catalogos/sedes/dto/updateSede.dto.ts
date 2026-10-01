import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateSede } from './createSede.dto';

export class UpdateSede extends PartialType(CreateSede) {
  /**
   * El modal de sedes envía "activo"; sin declararlo aquí la ValidationPipe
   * (whitelist: true) lo descartaba silenciosamente.
   */
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
