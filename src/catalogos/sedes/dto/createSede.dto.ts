import { IsNotEmpty, IsString } from "class-validator"

export class CreateSede{
    @IsString()
    @IsNotEmpty()
    codigo!: string
    @IsString()
    @IsNotEmpty()
    nombre!: string
}