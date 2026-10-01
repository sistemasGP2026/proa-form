import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AntibioticoService } from './antibiotico.service';
import { AntibioticoController } from './antibiotico.controller';
import { Antibiotico, AntibioticoSchema } from './entities/antibioticos.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Antibiotico.name, schema: AntibioticoSchema }])],
  controllers: [AntibioticoController],
  providers: [AntibioticoService],
  exports: [AntibioticoService, MongooseModule],
})
export class AntibioticoModule {}
