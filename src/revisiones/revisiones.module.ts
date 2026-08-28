import { Module } from '@nestjs/common';
import { RevisionesService } from './revisiones.service';
import { RevisionesController } from './revisiones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Revision } from './entities/revision.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Revision])],
  controllers: [RevisionesController],
  providers: [RevisionesService],
})
export class RevisionesModule {}
