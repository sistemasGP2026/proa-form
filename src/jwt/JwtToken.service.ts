import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from "@nestjs/jwt";
import { JwtTokenPayload } from './dto/JwtTokenPayload.interface';

@Injectable()
export class JwtokenService {
    constructor(private jwtService: JwtService) { }

    generateToken(payload: JwtTokenPayload): string {
        return this.jwtService.sign(payload);
    }

    verifyToken(token: string): JwtTokenPayload {
        try {
            return this.jwtService.verify<JwtTokenPayload>(token);
        } catch (error) {
            throw new UnauthorizedException('Token inválido o expirado');
        }
    }
}
