import { Injectable } from '@nestjs/common';
import { SedesService } from 'src/catalogos/sedes/sedes.service';
import { SolicitudesService } from 'src/solicitudes/solicitudes.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly sedesService: SedesService,
    private readonly solicitudesService: SolicitudesService,
  ) {}

  async getSedes(): Promise<any[]> {
    return await this.sedesService.findAllSedesActive();
  }

  async getSolicitudes(soloAnuladas = false): Promise<any[]> {
    return await this.solicitudesService.getAllSolicitudes(soloAnuladas);
  }
}
