import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Antibiotico } from './antibiotico/entities/antibioticos.entity';
import { Solicitud } from './solicitudes/entites/solicitud.entity';
import { SolicitudItem } from './solicitudes/entites/solicitudItem.entity';
import { SedesController } from './catalogos/sedes/sedes.controller';
import { SedesService } from './catalogos/sedes/sedes.service';
import { Sede } from './catalogos/sedes/entities/sede.entity';
import { SedesModule } from './catalogos/sedes/sedes.module';
import { FormModule } from './form/form.module';
import { ServiciosModule } from './catalogos/servicios/servicios.module';
import { DiagnosticoModule } from './catalogos/diagnostico_infeccioso/diagnostico.module';
import { AntibioticoModule } from './antibiotico/antibiotico.module';
import { EspecialidadTratanteModule } from './catalogos/especialidad_tratante/especialidad_tratante.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { SolicitudEvaluacion } from './solicitudes/entites/solicitudEvaluacion.entity';
import { RevisionesModule } from './revisiones/revisiones.module';
import { Revision } from './revisiones/entities/revision.entity';
import { AdminModule } from './admin/admin.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // 1. Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'views'),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT') ? Number(configService.get<number>('DB_PORT')) : 1433,
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),

        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    TypeOrmModule.forFeature([
      Sede,
      Antibiotico,
      Solicitud,
      SolicitudEvaluacion,
      SolicitudItem,
      Revision
    ]),
    SedesModule,
    FormModule,
    ServiciosModule,
    DiagnosticoModule,
    EspecialidadTratanteModule,
    AntibioticoModule,
    EspecialidadTratanteModule,
    SolicitudesModule,
    RevisionesModule,
    AdminModule,
    UsuariosModule,
    JwtModule,
    AuthModule,
  ],

  controllers: [ SedesController],
  providers: [SedesService],
})
export class AppModule {}