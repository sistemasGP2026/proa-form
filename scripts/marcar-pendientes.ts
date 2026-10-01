/**
 * Marca como PENDIENTE los antibióticos de solicitudes que nunca se dictaminaron.
 *
 *   npm run marcar:pendientes              -> simulación, no escribe
 *   npm run marcar:pendientes -- --aplicar -> aplica los cambios
 *
 * Antes de este cambio todo nacía APROBADO, de modo que no se distinguía
 * lo revisado de lo que nadie había mirado. Una solicitud sin ninguna
 * revisión asociada nunca fue dictaminada: esos ítems pasan a PENDIENTE.
 *
 * Las solicitudes que SÍ tienen revisiones se dejan intactas: sus estados
 * son decisiones clínicas ya tomadas y no se reescriben.
 */
import 'dotenv/config';
import mongoose from 'mongoose';

import { Solicitud, SolicitudSchema } from '../src/solicitudes/entites/solicitud.entity';
import { Revision, RevisionSchema } from '../src/revisiones/entities/revision.entity';
import { AntibioticoState } from '../src/antibiotico/entities/antibiotico.state';

const URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/proa';
const APLICAR = process.argv.includes('--aplicar');

async function main() {
  console.log(APLICAR ? '→ MODO ESCRITURA (--aplicar)' : '→ MODO SIMULACIÓN (no escribe nada)');
  console.log(`→ Conectando a ${URI}`);
  await mongoose.connect(URI);

  const SolicitudModel = mongoose.model(Solicitud.name, SolicitudSchema);
  const RevisionModel = mongoose.model(Revision.name, RevisionSchema);

  const solicitudes = await SolicitudModel.find().lean().exec();
  console.log(`\n• ${solicitudes.length} solicitud(es) en la base.`);

  if (!solicitudes.length) {
    await mongoose.disconnect();
    return;
  }

  const dictaminadas = new Set(
    (await RevisionModel.distinct('solicitudId').exec()).map((id: any) => String(id)),
  );
  console.log(`• ${dictaminadas.size} con al menos una revisión registrada.`);

  let tocadas = 0;
  let itemsTocados = 0;

  for (const solicitud of solicitudes) {
    const id = String((solicitud as any)._id);
    if (dictaminadas.has(id)) continue;

    const items: any[] = (solicitud as any).items ?? [];
    const porCambiar = items.filter(
      (i) => i.state !== AntibioticoState.PENDIENTE && i.state !== AntibioticoState.SUSPENDIDO,
    );

    if (!porCambiar.length) continue;

    tocadas += 1;
    itemsTocados += porCambiar.length;

    const paciente = (solicitud as any).evaluacion?.pacienteNombre ?? '(sin nombre)';
    console.log(`    ${id}  ${String(paciente).padEnd(28)} ${porCambiar.length} ítem(s)`);

    if (APLICAR) {
      await SolicitudModel.updateOne(
        { _id: (solicitud as any)._id },
        { $set: { 'items.$[sinDictamen].state': AntibioticoState.PENDIENTE } },
        {
          arrayFilters: [
            {
              'sinDictamen.state': {
                $nin: [AntibioticoState.PENDIENTE, AntibioticoState.SUSPENDIDO],
              },
            },
          ],
          timestamps: false,
        },
      ).exec();
    }
  }

  console.log('\n── Resumen ──────────────────────────────────────');
  console.log(`  Solicitudes sin dictaminar   ${tocadas}`);
  console.log(`  Ítems que pasan a PENDIENTE  ${itemsTocados}`);
  console.log(`  Solicitudes ya dictaminadas  ${dictaminadas.size} (intactas)`);
  console.log('─────────────────────────────────────────────────');

  if (!APLICAR && itemsTocados) {
    console.log('\nNada fue escrito. Repita con: npm run marcar:pendientes -- --aplicar');
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('✖ Error marcando pendientes:', error?.message ?? error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
