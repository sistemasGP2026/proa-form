import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosModule } from 'src/usuarios/usuarios.module';
import { JwtokenModule } from 'src/jwt/Jwt.module';
import { JwtStrategy } from 'src/jwt/JwtStrategy';

@Module({
  imports:[JwtokenModule, UsuariosModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
