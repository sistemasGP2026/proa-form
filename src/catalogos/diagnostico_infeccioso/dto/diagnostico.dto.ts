import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDiagnostico {
  @IsString() @IsNotEmpty() @MaxLength(150)
  nombre!: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}

export class UpdateDiagnostico {
  @IsOptional() @IsString() @MaxLength(150)
  nombre?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}