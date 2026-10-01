import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RevisionesService } from './revisiones.service';
import { RevisionesController } from './revisiones.controller';
import { Revision, RevisionSchema } from './entities/revision.entity';
import { Solicitud, SolicitudSchema } from 'src/solicitudes/entites/solicitud.entity';
import { Usuario, UsuarioSchema } from 'src/usuarios/entities/usuarios.entities';
import { Antibiotico, AntibioticoSchema } from 'src/antibiotico/entities/antibioticos.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Revision.name, schema: RevisionSchema },
      { name: Solicitud.name, schema: SolicitudSchema },
      { name: Usuario.name, schema: UsuarioSchema },
      { name: Antibiotico.name, schema: AntibioticoSchema },
    ]),
  ],
  controllers: [RevisionesController],
  providers: [RevisionesService],
  exports: [RevisionesService, MongooseModule],
})
export class RevisionesModule {}
