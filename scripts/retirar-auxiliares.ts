/**
 * Desactiva las cuentas con el rol AUX_FARMACIA, que ya no existe.
 *
 *   npm run retirar:auxiliares
 *
 * No borra nada: solo pone activo = false, de modo que esas cuentas no
 * pueden iniciar sesión pero siguen en la base. Para revertirlo basta con
 * cambiarles el rol y reactivarlas desde /usuarios.
 *
 * Es idempotente: si no hay cuentas con ese rol, no hace nada.
 */
import 'dotenv/config';
import mongoose from 'mongoose';

import { Usuario, UsuarioSchema } from '../src/usuarios/entities/usuarios.entities';

const URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/proa';
const ROL_RETIRADO = 'AUX_FARMACIA';

async function main() {
  console.log(`→ Conectando a ${URI}`);
  await mongoose.connect(URI);

  const UsuarioModel = mongoose.model(Usuario.name, UsuarioSchema);

  const cuentas = await UsuarioModel.find({ rol: ROL_RETIRADO })
    .select('usuario nombreCompleto activo')
    .lean()
    .exec();

  if (!cuentas.length) {
    console.log(`• No hay cuentas con el rol ${ROL_RETIRADO}. Nada que hacer.`);
    await mongoose.disconnect();
    return;
  }

  console.log(`\n• ${cuentas.length} cuenta(s) con el rol ${ROL_RETIRADO}:`);
  for (const c of cuentas) {
    const estado = (c as any).activo ? 'activa' : 'ya inactiva';
    console.log(`    ${String((c as any).usuario).padEnd(20)} ${(c as any).nombreCompleto}  [${estado}]`);
  }

  const resultado = await UsuarioModel.updateMany(
    { rol: ROL_RETIRADO, activo: true },
    { $set: { activo: false } },
  ).exec();

  console.log(`\n✔ ${resultado.modifiedCount} cuenta(s) desactivadas. No se borró ningún registro.`);
  console.log('  El personal de dispensación consulta ahora en /solicitudes, sin iniciar sesión.');

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('✖ Error retirando las cuentas:', error?.message ?? error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
