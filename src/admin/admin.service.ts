import { Injectable } from '@nestjs/common';
import { Sede } from 'src/catalogos/sedes/entities/sede.entity';
import { SedesService } from 'src/catalogos/sedes/sedes.service';
import { Solicitud } from 'src/solicitudes/entites/solicitud.entity';
import { SolicitudesService } from 'src/solicitudes/solicitudes.service';

@Injectable()
export class AdminService {
    constructor(
        private readonly sedesService: SedesService,
        private readonly solicitudesService:SolicitudesService
    ) {}

    async getSedes():Promise<Sede[]>{
        return await this.sedesService.findAllSedesActive()
    }

    async getSolicitudes():Promise<Solicitud[]>{
        return await this.solicitudesService.getAllSolicitudes()
    }
}
