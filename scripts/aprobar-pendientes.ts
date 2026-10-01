/**
 * Pasa a APROBADO todos los antibióticos que quedaron en PENDIENTE.
 *
 *   npm run aprobar:pendientes              -> simulación, no escribe
 *   npm run aprobar:pendientes -- --aplicar -> aplica los cambios
 *
 * El estado PENDIENTE se retiró: toda solicitud nace aprobada y el auditor
 * PROA solo suspende. Este script deja la base coherente con esa regla.
 *
 * Lo SUSPENDIDO no se toca: son decisiones clínicas ya tomadas.
 * Es idempotente: se puede correr las veces que haga falta.
 */
import 'dotenv/config';
import mongoose from 'mongoose';

import { Solicitud, SolicitudSchema } from '../src/solicitudes/entites/solicitud.entity';
import { AntibioticoState } from '../src/antibiotico/entities/antibiotico.state';

const URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/proa';
const APLICAR = process.argv.includes('--aplicar');

async function main() {
  console.log(APLICAR ? '→ MODO ESCRITURA (--aplicar)' : '→ MODO SIMULACIÓN (no escribe nada)');
  console.log(`→ Conectando a ${URI}`);
  await mongoose.connect(URI);

  const SolicitudModel = mongoose.model(Solicitud.name, SolicitudSchema);

  const solicitudes = await SolicitudModel.find({
    'items.state': AntibioticoState.PENDIENTE,
  })
    .lean()
    .exec();

  console.log(`\n• ${solicitudes.length} solicitud(es) con ítems en PENDIENTE.`);

  if (!solicitudes.length) {
    console.log('  Nada que hacer: la base ya está coherente.');
    await mongoose.disconnect();
    return;
  }

  let itemsTocados = 0;

  for (const solicitud of solicitudes) {
    const items: any[] = (solicitud as any).items ?? [];
    const porCambiar = items.filter((i) => i.state === AntibioticoState.PENDIENTE);
    itemsTocados += porCambiar.length;

    const paciente = (solicitud as any).evaluacion?.pacienteNombre ?? '(sin nombre)';
    const nombres = porCambiar
      .map((i) => i.dosis ?? '')
      .filter(Boolean)
      .join(', ');

    console.log(
      `    ${String((solicitud as any)._id)}  ${String(paciente).padEnd(28)} ` +
        `${porCambiar.length} ítem(s)${nombres ? `  [${nombres}]` : ''}`,
    );

    if (APLICAR) {
      await SolicitudModel.updateOne(
        { _id: (solicitud as any)._id },
        { $set: { 'items.$[pendiente].state': AntibioticoState.APROBADO } },
        {
          arrayFilters: [{ 'pendiente.state': AntibioticoState.PENDIENTE }],
          timestamps: false,
        },
      ).exec();
    }
  }

  console.log('\n── Resumen ──────────────────────────────────────');
  console.log(`  Solicitudes afectadas        ${solicitudes.length}`);
  console.log(`  Ítems que pasan a APROBADO   ${itemsTocados}`);
  console.log('  Ítems SUSPENDIDOS            intactos');
  console.log('─────────────────────────────────────────────────');

  if (!APLICAR) {
    console.log('\nNada fue escrito. Repita con: npm run aprobar:pendientes -- --aplicar');
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('✖ Error aprobando pendientes:', error?.message ?? error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
