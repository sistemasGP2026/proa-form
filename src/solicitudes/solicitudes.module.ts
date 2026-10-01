import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudesController } from './solicitudes.controller';
import { SedesModule } from 'src/catalogos/sedes/sedes.module';
import { AntibioticoModule } from 'src/antibiotico/antibiotico.module';
import { Solicitud, SolicitudSchema } from './entites/solicitud.entity';
import { Revision, RevisionSchema } from 'src/revisiones/entities/revision.entity';
import { Usuario, UsuarioSchema } from 'src/usuarios/entities/usuarios.entities';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Solicitud.name, schema: SolicitudSchema },
      { name: Revision.name, schema: RevisionSchema },
      { name: Usuario.name, schema: UsuarioSchema },
    ]),
    SedesModule,
    AntibioticoModule,
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
  exports: [SolicitudesService, MongooseModule],
})
export class SolicitudesModule {}
