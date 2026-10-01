import { IsIn, IsOptional } from 'class-validator';

export class ProfilaxisDto {
  @IsIn(['SI', 'NO'])
  cirugiaOrtopedia!: string;

  @IsOptional()
  @IsIn(['SI', 'NO', ''])
  gustilloAnderson?: string;
}
