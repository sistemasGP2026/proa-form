import { Module } from '@nestjs/common';
import { DiagnosticoInfecciosoService } from './diagnostico_infeccioso.service';
import { DiagnosticoController } from './diagnostico.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosticoInfeccioso } from './entities/diagnosticos_infecciosos';

@Module({
  imports:[TypeOrmModule.forFeature([DiagnosticoInfeccioso])],
  controllers: [DiagnosticoController],
  providers: [DiagnosticoInfecciosoService],
  exports:[DiagnosticoInfecciosoService]
})
export class DiagnosticoModule {}
