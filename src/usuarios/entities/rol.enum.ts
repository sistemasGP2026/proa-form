export enum Rol {
  ADMINISTRADOR = 'ADMINISTRADOR',
  AUDITOR_PROA = 'AUDITOR_PROA',
}

/** Etiqueta legible para la interfaz. */
export const ROL_ETIQUETA: Record<Rol, string> = {
  [Rol.ADMINISTRADOR]: 'Administrador',
  [Rol.AUDITOR_PROA]: 'Auditor PROA',
};
