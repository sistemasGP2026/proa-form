/**
 * Renombra el rol SOLICITANTE a AUDITOR_PROA en los usuarios existentes.
 *
 *   npm run migrar:roles
 *
 * Es idempotente y no destructivo: solo toca los documentos cuyo rol sea
 * exactamente 'SOLICITANTE'. Si no hay ninguno, no hace nada.
 */
import 'dotenv/config';
import mongoose from 'mongoose';

import { Usuario, UsuarioSchema } from '../src/usuarios/entities/usuarios.entities';
import { Rol } from '../src/usuarios/entities/rol.enum';

const URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/proa';
const ROL_ANTIGUO = 'SOLICITANTE';

async function main() {
  console.log(`→ Conectando a ${URI}`);
  await mongoose.connect(URI);

  const UsuarioModel = mongoose.model(Usuario.name, UsuarioSchema);

  const afectados = await UsuarioModel.find({ rol: ROL_ANTIGUO })
    .select('usuario nombreCompleto')
    .lean()
    .exec();

  if (!afectados.length) {
    console.log(`• No hay usuarios con el rol ${ROL_ANTIGUO}. Nada que migrar.`);
    await mongoose.disconnect();
    return;
  }

  console.log(`\n• ${afectados.length} usuario(s) con el rol ${ROL_ANTIGUO}:`);
  for (const usuario of afectados) {
    console.log(`    ${String((usuario as any).usuario).padEnd(20)} ${(usuario as any).nombreCompleto}`);
  }

  const resultado = await UsuarioModel.updateMany(
    { rol: ROL_ANTIGUO },
    { $set: { rol: Rol.AUDITOR_PROA } },
  ).exec();

  console.log(`\n✔ ${resultado.modifiedCount} usuario(s) actualizados a ${Rol.AUDITOR_PROA}.`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('✖ Error migrando los roles:', error?.message ?? error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
