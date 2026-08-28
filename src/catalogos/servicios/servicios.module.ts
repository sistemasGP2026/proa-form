import { Module } from '@nestjs/common';
import { ServiciosService } from './servicios.service';
import { ServiciosController } from './servicios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Servicios } from './entities/servicios.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Servicios])],
  controllers: [ServiciosController],
  providers: [ServiciosService],
  exports:[ServiciosService]
})
export class ServiciosModule {}
