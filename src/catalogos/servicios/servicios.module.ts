import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiciosService } from './servicios.service';
import { ServiciosController } from './servicios.controller';
import { Servicios, ServiciosSchema } from './entities/servicios.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Servicios.name, schema: ServiciosSchema }])],
  controllers: [ServiciosController],
  providers: [ServiciosService],
  exports: [ServiciosService, MongooseModule],
})
export class ServiciosModule {}
