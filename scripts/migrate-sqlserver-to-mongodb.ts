/**
 * Migración puntual de datos SQL Server (Proa_Form) → MongoDB (proa).
 *
 * NO es destructiva: no borra nada en MongoDB ni toca SQL Server.
 * Por defecto solo simula. Para escribir de verdad use --aplicar.
 *
 *   npm run migrate              -> simulación (dry-run), muestra estadísticas
 *   npm run migrate -- --aplicar -> inserta en MongoDB
 *
 * Requiere el paquete "mssql", que ya NO es dependencia de la aplicación.
 * Instálelo solo mientras haga la migración:
 *
 *   npm install --no-save mssql
 *
 * Variables en .env:
 *   SQLSERVER_HOST, SQLSERVER_PORT, SQLSERVER_USER,
 *   SQLSERVER_PASSWORD, SQLSERVER_DATABASE, MONGODB_URI
 */
import 'dotenv/config';
import mongoose from 'mongoose';

import { Usuario, UsuarioSchema } from '../src/usuarios/entities/usuarios.entities';
import { Sede, SedeSchema } from '../src/catalogos/sedes/entities/sede.entity';
import { Servicios, ServiciosSchema } from '../src/catalogos/servicios/entities/servicios.entity';
import {
  DiagnosticoInfeccioso,
  DiagnosticoInfecciosoSchema,
} from '../src/catalogos/diagnostico_infeccioso/entities/diagnosticos_infecciosos';
import {
  EspecialidadTratante,
  EspecialidadTratanteSchema,
} from '../src/catalogos/especialidad_tratante/entities/especialidadTratante';
import { Antibiotico, AntibioticoSchema } from '../src/antibiotico/entities/antibioticos.entity';
import { Solicitud, SolicitudSchema } from '../src/solicitudes/entites/solicitud.entity';
import { Revision, RevisionSchema } from '../src/revisiones/entities/revision.entity';
import { AntibioticoState } from '../src/antibiotico/entities/antibiotico.state';

const APLICAR = process.argv.includes('--aplicar');
const MONGO_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/proa';

/** Mapas id-SQL (number) → _id de MongoDB (ObjectId). */
type Mapa = Map<number, mongoose.Types.ObjectId>;

const estadisticas: Record<string, { leidos: number; insertados: number; omitidos: number }> = {};
const errores: string[] = [];

function registrar(coleccion: string, campo: 'leidos' | 'insertados' | 'omitidos', n = 1) {
  estadisticas[coleccion] ??= { leidos: 0, insertados: 0, omitidos: 0 };
  estadisticas[coleccion][campo] += n;
}

async function main() {
  let sql: any;
  try {
    // Carga perezosa: mssql no es dependencia de la app.
    sql = require('mssql');
  } catch {
    console.error(
      '✖ Falta el paquete "mssql". Instálelo solo para migrar:\n' +
        '    npm install --no-save mssql\n',
    );
    process.exit(1);
  }

  console.log(APLICAR ? '→ MODO ESCRITURA (--aplicar)' : '→ MODO SIMULACIÓN (sin escribir)');

  const pool = await sql.connect({
    server: process.env.SQLSERVER_HOST ?? 'localhost',
    port: Number(process.env.SQLSERVER_PORT ?? 1433),
    user: process.env.SQLSERVER_USER,
    password: process.env.SQLSERVER_PASSWORD,
    database: process.env.SQLSERVER_DATABASE ?? 'Proa_Form',
    options: { encrypt: false, trustServerCertificate: true },
  });
  console.log('✔ Conectado a SQL Server');

  await mongoose.connect(MONGO_URI);
  console.log(`✔ Conectado a MongoDB (${MONGO_URI})`);

  const modelos = {
    usuario: mongoose.model(Usuario.name, UsuarioSchema),
    sede: mongoose.model(Sede.name, SedeSchema),
    servicio: mongoose.model(Servicios.name, ServiciosSchema),
    diagnostico: mongoose.model(DiagnosticoInfeccioso.name, DiagnosticoInfecciosoSchema),
    especialidad: mongoose.model(EspecialidadTratante.name, EspecialidadTratanteSchema),
    antibiotico: mongoose.model(Antibiotico.name, AntibioticoSchema),
    solicitud: mongoose.model(Solicitud.name, SolicitudSchema),
    revision: mongoose.model(Revision.name, RevisionSchema),
  };

  const consultar = async (tabla: string): Promise<any[]> => {
    try {
      const resultado = await pool.request().query(`SELECT * FROM [${tabla}]`);
      return resultado.recordset ?? [];
    } catch (error: any) {
      errores.push(`No se pudo leer la tabla ${tabla}: ${error?.message ?? error}`);
      return [];
    }
  };

  // ── 1. Catálogos simples ───────────────────────────────────────────────
  const mapaSedes = await migrarCatalogo(
    'sedes',
    await consultar('sedes'),
    modelos.sede,
    (fila) => ({ codigo: fila.codigo, nombre: fila.nombre, activo: !!fila.activo }),
    { codigo: (fila) => fila.codigo },
  );

  await migrarCatalogo(
    'servicios',
    await consultar('servicios'),
    modelos.servicio,
    (fila) => ({ nombre: fila.nombre, activo: !!fila.activo }),
    { nombre: (fila) => fila.nombre },
  );

  await migrarCatalogo(
    'diagnosticos_infecciosos',
    await consultar('diagnosticos_infecciosos'),
    modelos.diagnostico,
    (fila) => ({ nombre: fila.nombre, activo: !!fila.activo }),
    { nombre: (fila) => fila.nombre },
  );

  await migrarCatalogo(
    'especialidades_tratantes',
    await consultar('especialidades_tratantes'),
    modelos.especialidad,
    (fila) => ({ nombre: fila.nombre, activo: !!fila.activo }),
    { nombre: (fila) => fila.nombre },
  );

  const mapaAntibioticos = await migrarCatalogo(
    'antibioticos',
    await consultar('antibioticos'),
    modelos.antibiotico,
    (fila) => ({
      codigo: fila.codigo,
      nombre: fila.nombre,
      tipo: fila.tipo,
      activo: !!fila.activo,
      state: fila.state ?? AntibioticoState.APROBADO,
    }),
    { codigo: (fila) => fila.codigo },
  );

  // Las contraseñas ya vienen hasheadas con bcrypt: se copian tal cual.
  const mapaUsuarios = await migrarCatalogo(
    'usuarios',
    await consultar('usuarios'),
    modelos.usuario,
    (fila) => ({
      nombreCompleto: fila.nombreCompleto,
      usuario: fila.usuario,
      contraseña: fila['contraseña'] ?? fila.contrasena,
      rol: fila.rol,
      activo: !!fila.activo,
    }),
    { usuario: (fila) => fila.usuario },
  );

  // ── 2. Solicitudes (con evaluación e ítems embebidos) ──────────────────
  const solicitudesSql = await consultar('solicitudes');
  const evaluacionesSql = await consultar('solicitud_evaluaciones');
  const itemsSql = await consultar('solicitud_items');

  const evaluacionPorSolicitud = new Map<number, any>();
  for (const fila of evaluacionesSql) evaluacionPorSolicitud.set(fila.solicitudId, fila);

  const itemsPorSolicitud = new Map<number, any[]>();
  for (const fila of itemsSql) {
    const lista = itemsPorSolicitud.get(fila.solicitudId) ?? [];
    lista.push(fila);
    itemsPorSolicitud.set(fila.solicitudId, lista);
  }

  const mapaSolicitudes: Mapa = new Map();

  for (const fila of solicitudesSql) {
    registrar('solicitudes', 'leidos');

    const sedeId = mapaSedes.get(fila.sedeId);
    if (!sedeId) {
      errores.push(`Solicitud ${fila.id}: no se encontró la sede ${fila.sedeId}`);
      registrar('solicitudes', 'omitidos');
      continue;
    }

    const evaluacion = evaluacionPorSolicitud.get(fila.id);
    if (!evaluacion) {
      errores.push(`Solicitud ${fila.id}: sin registro en solicitud_evaluaciones`);
      registrar('solicitudes', 'omitidos');
      continue;
    }

    const items = (itemsPorSolicitud.get(fila.id) ?? [])
      .map((item) => {
        const antibioticoId = mapaAntibioticos.get(item.antibioticoId);
        if (!antibioticoId) {
          errores.push(
            `Solicitud ${fila.id}: no se encontró el antibiótico ${item.antibioticoId}`,
          );
          return null;
        }
        return {
          antibioticoId,
          indicacion: item.indicacion,
          dosis: item.dosis,
          frecuencia: item.frecuencia,
          duracion: String(item.duracion),
          viaAdministracion: item.viaAdministracion,
          fechaInicio: item.fechaInicio,
          fechaFin: item.fechaFin,
          state: AntibioticoState.APROBADO,
          observaciones: null,
        };
      })
      .filter(Boolean);

    const _id = new mongoose.Types.ObjectId();
    mapaSolicitudes.set(fila.id, _id);

    const documento = {
      _id,
      sedeId,
      servicio: fila.servicio,
      habitacion: fila.habitacion,
      especialidad: fila.especialidad,
      medicoPrescribe: fila.medicoPrescribe,
      medicoRedacta: fila.medicoRedacta,
      submittedAt: fila.submittedAt,
      updatedAt: fila.updatedAt,
      evaluacion: {
        pacienteNombre: evaluacion.pacienteNombre,
        pacienteDocumento: evaluacion.pacienteDocumento,
        diagnosticoPrincipal: evaluacion.diagnosticoPrincipal,
        diagnosticoRelacionado: evaluacion.diagnosticoRelacionado,
        pacienteInfectado: !!evaluacion.pacienteInfectado,
        tratamientoPrevio: !!evaluacion.tratamientoPrevio,
        tratamientoPrevioDesc: evaluacion.tratamientoPrevioDesc ?? null,
        cultivosPrevios: !!evaluacion.cultivosPrevios,
        ajustadoGuiaProa: !!evaluacion.ajustadoGuiaProa,
        guiaIndicacion: evaluacion.guiaIndicacion ?? null,
        antecedentes: evaluacion.antecedentes ?? null,
        creatininaReporte: evaluacion.creatininaReporte ?? null,
      },
      items,
      profilaxis: null,
    };

    if (APLICAR) {
      await modelos.solicitud.create([documento], { timestamps: false });
    }
    registrar('solicitudes', 'insertados');
  }

  // ── 3. Revisiones ──────────────────────────────────────────────────────
  for (const fila of await consultar('revisiones')) {
    registrar('revisiones', 'leidos');

    const solicitudId = mapaSolicitudes.get(fila.solicitudId);
    const usuarioId = mapaUsuarios.get(fila.usuarioId);

    if (!solicitudId || !usuarioId) {
      errores.push(`Revisión ${fila.id}: solicitud o usuario no migrado`);
      registrar('revisiones', 'omitidos');
      continue;
    }

    if (APLICAR) {
      await modelos.revision.create(
        [
          {
            solicitudId,
            usuarioId,
            estado: fila.estado ?? AntibioticoState.APROBADO,
            itemsIds: [],
            observacion: fila.observacion ?? null,
            createdAt: fila.createdAt,
          },
        ],
        { timestamps: false },
      );
    }
    registrar('revisiones', 'insertados');
  }

  // ── Informe ────────────────────────────────────────────────────────────
  console.log('\n── Estadísticas ─────────────────────────────────────────');
  for (const [coleccion, datos] of Object.entries(estadisticas)) {
    console.log(
      `  ${coleccion.padEnd(28)} leídos: ${String(datos.leidos).padStart(5)} · ` +
        `insertados: ${String(datos.insertados).padStart(5)} · ` +
        `omitidos: ${String(datos.omitidos).padStart(5)}`,
    );
  }
  console.log('─────────────────────────────────────────────────────────');

  if (errores.length) {
    console.log(`\n⚠ ${errores.length} incidencia(s):`);
    errores.slice(0, 50).forEach((mensaje) => console.log(`  · ${mensaje}`));
    if (errores.length > 50) console.log(`  … y ${errores.length - 50} más`);
  }

  if (!APLICAR) {
    console.log('\nNada fue escrito. Repita con: npm run migrate -- --aplicar');
  }

  await pool.close();
  await mongoose.disconnect();
}

/**
 * Migra una tabla de catálogo evitando duplicados y devuelve
 * el mapa idSQL → ObjectId (necesario para reconstruir las relaciones).
 */
async function migrarCatalogo(
  coleccion: string,
  filas: any[],
  model: mongoose.Model<any>,
  transformar: (fila: any) => Record<string, any>,
  clave: Record<string, (fila: any) => any>,
): Promise<Mapa> {
  const mapa: Mapa = new Map();
  const [campoClave] = Object.keys(clave);

  for (const fila of filas) {
    registrar(coleccion, 'leidos');

    const filtro = { [campoClave]: clave[campoClave](fila) };
    const existente = await model.findOne(filtro).select('_id').lean().exec();

    if (existente) {
      mapa.set(fila.id, (existente as any)._id);
      registrar(coleccion, 'omitidos');
      continue;
    }

    const _id = new mongoose.Types.ObjectId();
    mapa.set(fila.id, _id);

    if (APLICAR) {
      await model.create([{ _id, ...transformar(fila) }], { timestamps: false });
    }
    registrar(coleccion, 'insertados');
  }

  return mapa;
}

main().catch(async (error) => {
  console.error('✖ Error en la migración:', error?.message ?? error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
