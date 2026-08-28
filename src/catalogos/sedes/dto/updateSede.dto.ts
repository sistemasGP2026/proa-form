import { PartialType } from "@nestjs/mapped-types";
import { CreateSede } from "./createSede.dto";

export class UpdateSede extends PartialType(CreateSede){

}