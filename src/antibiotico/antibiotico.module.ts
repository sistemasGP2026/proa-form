import { Module } from '@nestjs/common';
import { AntibioticoService } from './antibiotico.service';
import { AntibioticoController } from './antibiotico.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Antibiotico } from './entities/antibioticos.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Antibiotico])],
  controllers: [AntibioticoController],
  providers: [AntibioticoService],
  exports:[AntibioticoService]
})
export class AntibioticoModule {}
