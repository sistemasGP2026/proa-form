import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SedesModule } from 'src/catalogos/sedes/sedes.module';
import { SolicitudesModule } from 'src/solicitudes/solicitudes.module';

@Module({
  imports:[SedesModule, SolicitudesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
