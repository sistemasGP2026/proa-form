import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateServicio {
  @IsString() @IsNotEmpty() @MaxLength(100)
  nombre!: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}

export class UpdateServicio {
  @IsOptional() @IsString() @MaxLength(100)
  nombre?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}