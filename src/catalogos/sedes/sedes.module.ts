import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sede, SedeSchema } from './entities/sede.entity';
import { SedesService } from './sedes.service';
import { SedesController } from './sedes.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Sede.name, schema: SedeSchema }])],
  providers: [SedesService],
  controllers: [SedesController],
  exports: [SedesService, MongooseModule],
})
export class SedesModule {}
