export enum AntibioticoState {
  /**
   * Estado histórico. Ya no se genera: toda solicitud nueva nace APROBADA
   * y el auditor PROA solo suspende. Se conserva para poder leer registros
   * anteriores sin romper la validación del esquema.
   *
   * @deprecated
   */
  PENDIENTE = 'PENDIENTE',
  SUSPENDIDO = 'SUSPENDIDO',
  FINALIZADO = 'FINALIZADO',
  APROBADO = 'APROBADO',
}
