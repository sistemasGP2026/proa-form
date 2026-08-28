import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sede } from './entities/sede.entity';
import { SedesService } from './sedes.service';
import { SedesController } from './sedes.controller';

@Module({
    imports:[TypeOrmModule.forFeature([Sede])],
    providers:[SedesService],
    controllers:[SedesController],
    exports:[SedesService]
})
export class SedesModule {}
