import { Module } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudesController } from './solicitudes.controller';
import { SedesModule } from 'src/catalogos/sedes/sedes.module';
import { Solicitud } from './entites/solicitud.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AntibioticoModule } from 'src/antibiotico/antibiotico.module';
import { SolicitudItem } from './entites/solicitudItem.entity';
import { Revision } from 'src/revisiones/entities/revision.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Solicitud, SolicitudItem, Revision]),
    SedesModule, AntibioticoModule],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
  exports: [SolicitudesService]
})
export class SolicitudesModule { }
