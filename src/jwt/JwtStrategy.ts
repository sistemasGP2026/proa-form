import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { JwtTokenPayload } from './dto/JwtTokenPayload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {

  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (request) => {
        return request?.cookies?.access_token;
      },

      ignoreExpiration: false,

      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtTokenPayload) {
  return {
    id: payload.sub,
    nombre: payload.nombreCompleto ,
    usuario: payload.usuario,
    rol: payload.rol,
  };
}
}