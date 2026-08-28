import { IsIn } from "class-validator";

export class ProfilaxisDto {
    @IsIn(['SI', 'NO'])
    cirugiaOrtopedia!: string;

    @IsIn(['SI', 'NO'])
    gustilloAnderson!: string;
}