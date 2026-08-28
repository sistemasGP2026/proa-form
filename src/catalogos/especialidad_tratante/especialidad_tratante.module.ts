import { Module } from '@nestjs/common';
import { EspecialidadTratanteService } from './especialidad_tratante.service';
import { EspecialidadTratanteController } from './especialidad_tratante.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EspecialidadTratante } from './entities/especialidadTratante';

@Module({
  imports:[TypeOrmModule.forFeature([EspecialidadTratante])],
  controllers: [EspecialidadTratanteController],
  providers: [EspecialidadTratanteService],
  exports: [EspecialidadTratanteService]
})
export class EspecialidadTratanteModule {}
