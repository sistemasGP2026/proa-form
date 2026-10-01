import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { ROLES_KEY } from '../decorator/auth-role.decorator';
import { IS_PUBLIC_KEY } from '../decorator/is-public.decorator';
import { Rol } from 'src/usuarios/entities/rol.enum';

/**
 * Consumidor del decorador @AuthRole, que hasta ahora existía sin ningún
 * guard que lo leyera: la restricción por rol no se aplicaba en ninguna ruta.
 *
 * En las rutas que renderizan una vista se redirige al tablero en lugar de
 * devolver un 403 en JSON; en las llamadas de datos se lanza la excepción.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Una ruta marcada @Public() no exige rol, aunque su controlador
    // declare @AuthRole a nivel de clase. Sin esta comprobación el envío
    // público del formulario quedaba bloqueado con 403.
    const esPublica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (esPublica) return true;

    const permitidos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permitidos?.length) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const usuario = request.user as { rol?: Rol } | undefined;

    if (usuario?.rol && permitidos.includes(usuario.rol)) return true;

    const esVista = request.method === 'GET' && request.accepts('html') === 'html';

    if (esVista && !response.headersSent) {
      response.redirect('/admin');
      return false;
    }

    throw new ForbiddenException('Su rol no tiene acceso a este módulo');
  }
}
