import { Body, Controller, Get, Post, Render } from '@nestjs/common';
import { FormService } from './form.service';
import { Public } from 'src/auth/decorator/is-public.decorator';

@Controller('form')
export class FormController {
  constructor(private readonly formService: FormService) { }


  @Public()
  @Get()
  @Render('form')
  async generateForm() {
    const sedes = await this.formService.getAllSedes();
    const servicios = await this.formService.getAllServicios();
    const diagnostico = await this.formService.getAllDiagnostico();
    const especialidad = await this.formService.getAllEspecialidades();
    const restringidos = await this.formService.getAntibioticoRestringido();
    const vigilados = await this.formService.getAntibioticovigilados();

    return {
      sedes,
      servicios,
      diagnostico,
      especialidad,
      restringidos,
      vigilados
    };
  }
}