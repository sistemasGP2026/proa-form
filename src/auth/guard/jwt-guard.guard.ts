import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { IS_PUBLIC_KEY } from '../decorator/is-public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    if (isPublic) {
      const isSignInRoute = request.url.includes('/auth/sign-in');
      const hasToken = !!request?.cookies?.access_token;
      if (isSignInRoute && hasToken) {
        response.redirect('/admin');
        return false;
      }
      return true;
    }

    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      if (!response.headersSent) {
        response.redirect('/auth/sign-in');
      }
      return false;
    }
  }
  
}