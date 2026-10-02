import { Body, Controller, Get, Post, Render, Res, } from '@nestjs/common';

import type { Response } from 'express';

import { AuthService } from './auth.service';
import { SignInDto } from './dto/SignIn.dto';
import { Public } from './decorator/is-public.decorator';

@Public()
@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
  ) { }


  @Get('sign-in')
  @Render('auth/login')
  signInPage() {
    return {};
  }

  @Post('sign-in')
  async signIn(@Body() data: SignInDto, @Res() res: Response,) {
    try {
      const result = await this.authService.signIn(data);

      res.cookie('access_token', result.token, {
        httpOnly: true,
        // "secure" solo cuando el sitio se sirva por HTTPS. Atarlo a
        // NODE_ENV rompia el acceso por HTTP en la red interna: el
        // navegador descartaba la cookie y el ingreso parecia recargar
        // la pagina de login. Se activa con COOKIE_SECURE=true.
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000,
      });

      return res.redirect('/admin');

    } catch (error: any) {

      return res.status(401).render('auth/login', {
        error: error.message || 'Credenciales inválidas',
        usuario: data.usuario,
      });
    }
  }
  
  @Public()
  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('access_token');
    return res.redirect('/auth/sign-in');
  }
}