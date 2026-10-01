import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtokenService } from 'src/jwt/JwtToken.service';
import { UsuariosService } from 'src/usuarios/usuarios.service';
import { SignInResponse } from './dto/SignIn.response';
import { SignInDto } from './dto/SignIn.dto';
import { JwtTokenPayload } from 'src/jwt/dto/JwtTokenPayload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuariosService,
    private jwtService: JwtokenService,
  ) {}

  async signIn(request: SignInDto): Promise<SignInResponse> {
    const usuario = await this.usuarioService.getUserByUsuario(request.usuario);

    if (!usuario) {
      throw new UnauthorizedException(
        `El usuario ${request.usuario} no existe o esta inhabilitado`,
      );
    }

    const passwordCoded = await bcrypt.compare(request.contraseña, usuario.contraseña ?? '');

    if (!passwordCoded) throw new UnauthorizedException(`Credenciales invalidas`);

    const payloadToken: JwtTokenPayload = {
      nombreCompleto: usuario.nombreCompleto,
      rol: usuario.rol,
      sub: String(usuario.id),
      usuario: usuario.usuario,
    };

    const { contraseña, ...usuarioSinPassword } = usuario;

    return {
      token: this.jwtService.generateToken(payloadToken),
      usuario: usuarioSinPassword,
    };
  }
}
