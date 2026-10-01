import { Injectable } from '@nestjs/common';
import { AntibioticoService } from 'src/antibiotico/antibiotico.service';
import { DiagnosticoInfecciosoService } from 'src/catalogos/diagnostico_infeccioso/diagnostico_infeccioso.service';
import { EspecialidadTratanteService } from 'src/catalogos/especialidad_tratante/especialidad_tratante.service';
import { SedesService } from 'src/catalogos/sedes/sedes.service';
import { ServiciosService } from 'src/catalogos/servicios/servicios.service';

@Injectable()
export class FormService {
  constructor(
    private readonly sedesService: SedesService,
    private readonly serviciosService: ServiciosService,
    private readonly diagnosticoService: DiagnosticoInfecciosoService,
    private readonly especialidadTratante: EspecialidadTratanteService,
    private readonly antibioticoService: AntibioticoService,
  ) {}

  async getAllSedes(): Promise<any[]> {
    return await this.sedesService.findAllSedesActive();
  }

  async getAllServicios(): Promise<any[]> {
    return await this.serviciosService.getAllActive();
  }

  async getAllDiagnostico(): Promise<any[]> {
    return await this.diagnosticoService.getAllActive();
  }

  async getAllEspecialidades(): Promise<any[]> {
    return await this.especialidadTratante.getAllEspecialidadesActive();
  }

  async getAntibioticoRestringido(): Promise<any[]> {
    return await this.antibioticoService.getAntibioticosRestringidos();
  }

  async getAntibioticovigilados(): Promise<any[]> {
    return await this.antibioticoService.getAntibioticosVigilado();
  }
}
