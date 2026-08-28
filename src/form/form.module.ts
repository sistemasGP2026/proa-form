import { Module } from '@nestjs/common';
import { FormService } from './form.service';
import { FormController } from './form.controller';
import { SedesModule } from 'src/catalogos/sedes/sedes.module';
import { ServiciosModule } from 'src/catalogos/servicios/servicios.module';
import { DiagnosticoModule } from 'src/catalogos/diagnostico_infeccioso/diagnostico.module';
import { EspecialidadTratanteModule } from 'src/catalogos/especialidad_tratante/especialidad_tratante.module';
import { AntibioticoModule } from 'src/antibiotico/antibiotico.module';

@Module({
  imports:[SedesModule, ServiciosModule, DiagnosticoModule, EspecialidadTratanteModule, AntibioticoModule],
  controllers: [FormController],
  providers: [FormService],
})
export class FormModule {}
