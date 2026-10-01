/**
 * Festivos de Colombia calculados por algoritmo: no hay tabla que actualizar
 * cada año. Combina las fechas fijas, la Ley 51 de 1983 (Ley Emiliani, que
 * traslada varios festivos al lunes siguiente) y el ciclo de Pascua.
 */

const ZONA = 'America/Bogota';

/** Domingo de Pascua (algoritmo de Butcher), en UTC. */
function domingoDePascua(anio: number): Date {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(Date.UTC(anio, mes - 1, dia));
}

function sumarDias(fecha: Date, dias: number): Date {
  const copia = new Date(fecha.getTime());
  copia.setUTCDate(copia.getUTCDate() + dias);
  return copia;
}

/** Ley Emiliani: si no cae lunes, se traslada al lunes siguiente. */
function trasladarALunes(fecha: Date): Date {
  const diaSemana = fecha.getUTCDay(); // 0 domingo … 6 sábado
  if (diaSemana === 1) return fecha;
  const faltan = diaSemana === 0 ? 1 : 8 - diaSemana;
  return sumarDias(fecha, faltan);
}

const clave = (fecha: Date): string => fecha.toISOString().slice(0, 10);

const cache = new Map<number, Map<string, string>>();

/** Festivos del año indicado: clave 'YYYY-MM-DD' -> nombre. */
export function festivosDelAnio(anio: number): Map<string, string> {
  const enCache = cache.get(anio);
  if (enCache) return enCache;

  const festivos = new Map<string, string>();
  const agregar = (fecha: Date, nombre: string) => festivos.set(clave(fecha), nombre);

  // Fechas fijas
  agregar(new Date(Date.UTC(anio, 0, 1)), 'Año Nuevo');
  agregar(new Date(Date.UTC(anio, 4, 1)), 'Día del Trabajo');
  agregar(new Date(Date.UTC(anio, 6, 20)), 'Día de la Independencia');
  agregar(new Date(Date.UTC(anio, 7, 7)), 'Batalla de Boyacá');
  agregar(new Date(Date.UTC(anio, 11, 8)), 'Inmaculada Concepción');
  agregar(new Date(Date.UTC(anio, 11, 25)), 'Navidad');

  // Trasladables al lunes (Ley Emiliani)
  agregar(trasladarALunes(new Date(Date.UTC(anio, 0, 6))), 'Reyes Magos');
  agregar(trasladarALunes(new Date(Date.UTC(anio, 2, 19))), 'San José');
  agregar(trasladarALunes(new Date(Date.UTC(anio, 5, 29))), 'San Pedro y San Pablo');
  agregar(trasladarALunes(new Date(Date.UTC(anio, 7, 15))), 'Asunción de la Virgen');
  agregar(trasladarALunes(new Date(Date.UTC(anio, 9, 12))), 'Día de la Raza');
  agregar(trasladarALunes(new Date(Date.UTC(anio, 10, 1))), 'Todos los Santos');
  agregar(trasladarALunes(new Date(Date.UTC(anio, 10, 11))), 'Independencia de Cartagena');

  // Ciclo de Pascua
  const pascua = domingoDePascua(anio);
  agregar(sumarDias(pascua, -3), 'Jueves Santo');
  agregar(sumarDias(pascua, -2), 'Viernes Santo');
  agregar(sumarDias(pascua, 43), 'Ascensión del Señor');
  agregar(sumarDias(pascua, 64), 'Corpus Christi');
  agregar(sumarDias(pascua, 71), 'Sagrado Corazón');

  cache.set(anio, festivos);
  return festivos;
}

export function nombreFestivo(fecha: Date): string | null {
  return festivosDelAnio(fecha.getUTCFullYear()).get(clave(fecha)) ?? null;
}

export function esFestivo(fecha: Date): boolean {
  return nombreFestivo(fecha) !== null;
}

/**
 * Fecha calendario actual en Colombia, normalizada a medianoche UTC,
 * independientemente de la zona horaria del servidor.
 */
export function hoyEnColombia(): Date {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const [anio, mes, dia] = partes.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function describirFecha(fecha: Date): string {
  return `${DIAS[fecha.getUTCDay()]} ${fecha.getUTCDate()} de ${MESES[fecha.getUTCMonth()]} de ${fecha.getUTCFullYear()}`;
}

export interface ResultadoDia {
  permitido: boolean;
  motivo: string;
}

/**
 * Regla de dispensación: el personal auxiliar de farmacia solo puede
 * intervenir solicitudes los viernes, sábados, domingos y los lunes
 * que sean festivos.
 */
export function auxiliarPuedeIntervenir(fecha: Date = hoyEnColombia()): ResultadoDia {
  const diaSemana = fecha.getUTCDay();
  const descripcion = describirFecha(fecha);

  if (diaSemana === 5) return { permitido: true, motivo: `Viernes (${descripcion})` };
  if (diaSemana === 6) return { permitido: true, motivo: `Sábado (${descripcion})` };
  if (diaSemana === 0) return { permitido: true, motivo: `Domingo (${descripcion})` };

  if (diaSemana === 1) {
    const festivo = nombreFestivo(fecha);
    if (festivo) {
      return { permitido: true, motivo: `Lunes festivo — ${festivo} (${descripcion})` };
    }
    return {
      permitido: false,
      motivo: `Hoy es ${descripcion} y no es festivo. El personal de dispensación solo puede intervenir solicitudes los viernes, sábados, domingos y lunes festivos.`,
    };
  }

  return {
    permitido: false,
    motivo: `Hoy es ${descripcion}. El personal de dispensación solo puede intervenir solicitudes los viernes, sábados, domingos y lunes festivos.`,
  };
}
