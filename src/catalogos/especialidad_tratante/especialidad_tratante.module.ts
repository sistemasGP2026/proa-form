import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EspecialidadTratanteService } from './especialidad_tratante.service';
import { EspecialidadTratanteController } from './especialidad_tratante.controller';
import {
  EspecialidadTratante,
  EspecialidadTratanteSchema,
} from './entities/especialidadTratante';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EspecialidadTratante.name, schema: EspecialidadTratanteSchema },
    ]),
  ],
  controllers: [EspecialidadTratanteController],
  providers: [EspecialidadTratanteService],
  exports: [EspecialidadTratanteService, MongooseModule],
})
export class EspecialidadTratanteModule {}
