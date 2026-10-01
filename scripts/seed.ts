/**
 * Seed de datos iniciales para MongoDB.
 *
 *   npm run seed                -> crea únicamente el usuario administrador
 *   npm run seed -- --catalogos -> además carga catálogos base (sedes, servicios,
 *                                  diagnósticos, especialidades y antibióticos)
 *
 * Es idempotente: se puede ejecutar varias veces sin duplicar registros.
 * No borra nada.
 */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';

import { Usuario, UsuarioSchema } from '../src/usuarios/entities/usuarios.entities';
import { Rol } from '../src/usuarios/entities/rol.enum';
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
import { TipoAntibiotico } from '../src/antibiotico/entities/tipoAntibiotico.enum';

const URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/proa';
const CARGAR_CATALOGOS = process.argv.includes('--catalogos');

const ADMIN_USUARIO = process.env.SEED_ADMIN_USER ?? 'admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Proa2026*';
const ADMIN_NOMBRE = process.env.SEED_ADMIN_NOMBRE ?? 'Administrador PROA';

const SEDES = [
  { codigo: 'SFD', nombre: 'SAN FERNANDO' },
  { codigo: 'MAX', nombre: 'MARIA AUXILIADORA' },
  { codigo: 'AMB', nombre: 'AMBERES' },
  { codigo: 'SMT', nombre: 'SANTA MARTA' },
];

const SERVICIOS = [
  'Urgencias',
  'Hospitalización',
  'Unidad de Cuidados Intensivos',
  'Cirugía',
  'Pediatría',
  'Ginecobstetricia',
];

const DIAGNOSTICOS = [
  'Infección de vías urinarias',
  'Neumonía adquirida en la comunidad',
  'Neumonía asociada a la atención en salud',
  'Infección de piel y tejidos blandos',
  'Infección intraabdominal',
  'Bacteriemia',
  'Sepsis',
  'Infección de sitio operatorio',
];

const ESPECIALIDADES = [
  'Medicina Interna',
  'Infectología',
  'Cirugía General',
  'Ortopedia',
  'Pediatría',
  'Ginecología',
  'Urgenciología',
];

const ANTIBIOTICOS: Array<{ codigo: string; nombre: string; tipo: TipoAntibiotico }> = [
  { codigo: 'MER', nombre: 'Meropenem', tipo: TipoAntibiotico.RESTRINGIDO },
  { codigo: 'IMI', nombre: 'Imipenem/Cilastatina', tipo: TipoAntibiotico.RESTRINGIDO },
  { codigo: 'ERT', nombre: 'Ertapenem', tipo: TipoAntibiotico.RESTRINGIDO },
  { codigo: 'VAN', nombre: 'Vancomicina', tipo: TipoAntibiotico.RESTRINGIDO },
  { codigo: 'LIN', nombre: 'Linezolid', tipo: TipoAntibiotico.RESTRINGIDO },
  { codigo: 'DAP', nombre: 'Daptomicina', tipo: TipoAntibiotico.RESTRINGIDO },
  { codigo: 'COL', nombre: 'Colistina', tipo: TipoAntibiotico.RESTRINGIDO },
  { codigo: 'TIG', nombre: 'Tigeciclina', tipo: TipoAntibiotico.RESTRINGIDO },
  { codigo: 'PTZ', nombre: 'Piperacilina/Tazobactam', tipo: TipoAntibiotico.RESTRINGIDO },
  { codigo: 'CEF', nombre: 'Cefepime', tipo: TipoAntibiotico.RESTRINGIDO },
  { codigo: 'CTX', nombre: 'Ceftriaxona', tipo: TipoAntibiotico.VIGILADO },
  { codigo: 'AMS', nombre: 'Ampicilina/Sulbactam', tipo: TipoAntibiotico.VIGILADO },
  { codigo: 'CIP', nombre: 'Ciprofloxacina', tipo: TipoAntibiotico.VIGILADO },
  { codigo: 'CLI', nombre: 'Clindamicina', tipo: TipoAntibiotico.VIGILADO },
  { codigo: 'OXA', nombre: 'Oxacilina', tipo: TipoAntibiotico.VIGILADO },
  { codigo: 'AMK', nombre: 'Amikacina', tipo: TipoAntibiotico.VIGILADO },
  { codigo: 'MTZ', nombre: 'Metronidazol', tipo: TipoAntibiotico.VIGILADO },
  { codigo: 'FLU', nombre: 'Fluconazol', tipo: TipoAntibiotico.VIGILADO },
];

async function main() {
  console.log(`→ Conectando a ${URI}`);
  await mongoose.connect(URI);

  const UsuarioModel = mongoose.model(Usuario.name, UsuarioSchema);
  const SedeModel = mongoose.model(Sede.name, SedeSchema);
  const ServicioModel = mongoose.model(Servicios.name, ServiciosSchema);
  const DiagnosticoModel = mongoose.model(
    DiagnosticoInfeccioso.name,
    DiagnosticoInfecciosoSchema,
  );
  const EspecialidadModel = mongoose.model(
    EspecialidadTratante.name,
    EspecialidadTratanteSchema,
  );
  const AntibioticoModel = mongoose.model(Antibiotico.name, AntibioticoSchema);

  const resumen: Record<string, number> = {};

  // ── Usuario administrador ────────────────────────────────────────────
  const yaExiste = await UsuarioModel.exists({ usuario: ADMIN_USUARIO });

  if (yaExiste) {
    console.log(`• Usuario "${ADMIN_USUARIO}" ya existe, no se modifica.`);
  } else {
    await UsuarioModel.create({
      usuario: ADMIN_USUARIO,
      nombreCompleto: ADMIN_NOMBRE,
      rol: Rol.ADMINISTRADOR,
      contraseña: await bcrypt.hash(ADMIN_PASSWORD, 10),
      activo: true,
    });
    resumen['usuarios'] = 1;
    console.log(`• Usuario administrador creado: ${ADMIN_USUARIO} / ${ADMIN_PASSWORD}`);
    console.log('  ⚠ Cambie esta contraseña desde /usuarios después del primer ingreso.');
  }

  // ── Catálogos (opcional) ─────────────────────────────────────────────
  if (CARGAR_CATALOGOS) {
    resumen['sedes'] = await insertarFaltantes(SedeModel, SEDES, 'codigo');
    resumen['servicios'] = await insertarFaltantes(
      ServicioModel,
      SERVICIOS.map((nombre) => ({ nombre })),
      'nombre',
    );
    resumen['diagnosticos_infecciosos'] = await insertarFaltantes(
      DiagnosticoModel,
      DIAGNOSTICOS.map((nombre) => ({ nombre })),
      'nombre',
    );
    resumen['especialidades_tratantes'] = await insertarFaltantes(
      EspecialidadModel,
      ESPECIALIDADES.map((nombre) => ({ nombre })),
      'nombre',
    );
    resumen['antibioticos'] = await insertarFaltantes(AntibioticoModel, ANTIBIOTICOS, 'codigo');
  } else {
    console.log('• Catálogos omitidos. Use: npm run seed -- --catalogos');
  }

  console.log('\n── Resumen ──────────────────────────────');
  for (const [coleccion, cantidad] of Object.entries(resumen)) {
    console.log(`  ${coleccion.padEnd(28)} ${cantidad} nuevo(s)`);
  }
  console.log('─────────────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('✔ Seed finalizado.');
}

async function insertarFaltantes(
  model: mongoose.Model<any>,
  registros: Record<string, any>[],
  claveUnica: string,
): Promise<number> {
  let creados = 0;

  for (const registro of registros) {
    const filtro = { [claveUnica]: registro[claveUnica] };
    const existe = await model.exists(filtro);

    if (existe) continue;

    await model.create({ ...registro, activo: true });
    creados += 1;
  }

  return creados;
}

main().catch(async (error) => {
  console.error('✖ Error ejecutando el seed:', error?.message ?? error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
