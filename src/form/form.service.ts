import { Injectable } from '@nestjs/common';
import { AntibioticoService } from 'src/antibiotico/antibiotico.service';
import { Antibiotico } from 'src/antibiotico/entities/antibioticos.entity';
import { DiagnosticoInfecciosoService } from 'src/catalogos/diagnostico_infeccioso/diagnostico_infeccioso.service';
import { DiagnosticoInfeccioso } from 'src/catalogos/diagnostico_infeccioso/entities/diagnosticos_infecciosos';
import { EspecialidadTratante } from 'src/catalogos/especialidad_tratante/entities/especialidadTratante';
import { EspecialidadTratanteService } from 'src/catalogos/especialidad_tratante/especialidad_tratante.service';
import { Sede } from 'src/catalogos/sedes/entities/sede.entity';
import { SedesService } from 'src/catalogos/sedes/sedes.service';
import { Servicios } from 'src/catalogos/servicios/entities/servicios.entity';
import { ServiciosService } from 'src/catalogos/servicios/servicios.service';

@Injectable()
export class FormService {
    constructor(
        private readonly sedesService: SedesService,
        private readonly serviciosService: ServiciosService,
        private readonly diagnosticoService: DiagnosticoInfecciosoService,
        private readonly especialidadTratante: EspecialidadTratanteService,
        private readonly antibioticoService: AntibioticoService,
    ) { }

    async getAllSedes(): Promise<Sede[]> {
        return await this.sedesService.findAllSedesActive();
    }

    async getAllServicios(): Promise<Servicios[]> {
        return await this.serviciosService.getAllActive();
    }

    async getAllDiagnostico(): Promise<DiagnosticoInfeccioso[]> {
        return await this.diagnosticoService.getAllActive();
    }

    async getAllEspecialidades(): Promise<EspecialidadTratante[]> {
        return await this.especialidadTratante.getAllEspecialidadesActive();
    }

    async getAntibioticoRestringido(): Promise<Antibiotico[]> {
        return await this.antibioticoService.getAntibioticosRestringidos();
    }

    async getAntibioticovigilados(): Promise<Antibiotico[]> {
        return await this.antibioticoService.getAntibioticosVigilado();
    }
}
