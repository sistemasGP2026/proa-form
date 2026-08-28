import { IsNotEmpty, IsString } from "class-validator"

export class SignInDto{
    @IsString()
    @IsNotEmpty()
    usuario!:string

    @IsString()
    @IsNotEmpty()
    contraseña!:string
}