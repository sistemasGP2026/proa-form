import { Rol } from 'src/usuarios/entities/rol.enum';

/**
 * Módulos del sistema. Cada uno agrupa las rutas de una pestaña del menú.
 * 'solicitudes' cubre el tablero /admin, el listado /solicitudes y el detalle.
 */
export type Modulo =
  | 'solicitudes'
  | 'revisiones'
  | 'antibioticos'
  | 'servicios'
  | 'diagnosticos'
  | 'especialidades'
  | 'sedes'
  | 'usuarios';

export const PERMISOS: Record<Rol, Modulo[]> = {
  [Rol.ADMINISTRADOR]: [
    'solicitudes',
    'revisiones',
    'antibioticos',
    'servicios',
    'diagnosticos',
    'especialidades',
    'sedes',
    'usuarios',
  ],
  [Rol.AUDITOR_PROA]: [
    'solicitudes',
    'revisiones',
    'antibioticos',
    'servicios',
    'diagnosticos',
    'especialidades',
  ],
};

export function tieneAcceso(rol: unknown, modulo: unknown): boolean {
  const permitidos = PERMISOS[rol as Rol];
  if (!permitidos) return false;
  return permitidos.includes(modulo as Modulo);
}

/** Roles que pueden entrar a un módulo; se usa en los decoradores @AuthRole. */
export function rolesDe(modulo: Modulo): Rol[] {
  return (Object.keys(PERMISOS) as Rol[]).filter((rol) => PERMISOS[rol].includes(modulo));
}
