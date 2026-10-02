import { Module } from '@nestjs/common';

import { CuentaController } from './cuenta.controller';
import { UsuariosModule } from 'src/usuarios/usuarios.module';

@Module({
  imports: [UsuariosModule],
  controllers: [CuentaController],
})
export class CuentaModule {}
