import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';

import { SedesModule } from './catalogos/sedes/sedes.module';
import { FormModule } from './form/form.module';
import { ServiciosModule } from './catalogos/servicios/servicios.module';
import { DiagnosticoModule } from './catalogos/diagnostico_infeccioso/diagnostico.module';
import { AntibioticoModule } from './antibiotico/antibiotico.module';
import { EspecialidadTratanteModule } from './catalogos/especialidad_tratante/especialidad_tratante.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { RevisionesModule } from './revisiones/revisiones.module';
import { AdminModule } from './admin/admin.module';
import { UsuariosModule } from './usuarios/usuarios.module';
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

    // 2. Conexión a MongoDB (local o Atlas, según MONGODB_URI)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ?? 'mongodb://127.0.0.1:27017/proa',
        autoIndex: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),

    SedesModule,
    FormModule,
    ServiciosModule,
    DiagnosticoModule,
    EspecialidadTratanteModule,
    AntibioticoModule,
    SolicitudesModule,
    RevisionesModule,
    AdminModule,
    UsuariosModule,
    AuthModule,
  ],
})
export class AppModule {}
