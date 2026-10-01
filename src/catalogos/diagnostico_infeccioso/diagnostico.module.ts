import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiagnosticoInfecciosoService } from './diagnostico_infeccioso.service';
import { DiagnosticoController } from './diagnostico.controller';
import {
  DiagnosticoInfeccioso,
  DiagnosticoInfecciosoSchema,
} from './entities/diagnosticos_infecciosos';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DiagnosticoInfeccioso.name, schema: DiagnosticoInfecciosoSchema },
    ]),
  ],
  controllers: [DiagnosticoController],
  providers: [DiagnosticoInfecciosoService],
  exports: [DiagnosticoInfecciosoService, MongooseModule],
})
export class DiagnosticoModule {}
