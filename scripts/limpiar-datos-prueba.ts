/**
 * Limpia TODOS los formularios y preguntas de Supabase.
 *
 * Pensado para usarse tras el pivot del MVP (email → persistencia en BD):
 * borra los 3 formularios de prueba del seed anterior para empezar limpio.
 *
 * Uso:  npm run limpiar-datos-prueba
 *
 * IMPORTANTE: este script es IRREVERSIBLE. Úsalo solo si estás seguro.
 * Requiere `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y
 * `SUPABASE_SERVICE_ROLE_KEY` (usa `createServiceClient`, bypasea RLS).
 */
import { createServiceClient } from "../lib/supabase/service";
import * as dotenv from "dotenv";

// Cargamos `.env.local` manualmente (los scripts se ejecutan fuera de Next).
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback a .env

async function main(): Promise<void> {
  const supabase = createServiceClient();

  console.log("→ Listando formularios existentes…");
  const { data: forms, error: err1 } = await supabase
    .from("formularios")
    .select("id, slug");

  if (err1) {
    throw new Error(`Error listando formularios: ${err1.message}`);
  }

  const total = forms?.length ?? 0;
  console.log(`Encontrados ${total} formularios:`);
  forms?.forEach((f) => console.log(`  - ${f.slug}`));

  if (total === 0) {
    console.log("Nada que eliminar.");
    return;
  }

  console.log("→ Borrando (cascade eliminará preguntas y respuestas)…");
  const ids = forms!.map((f) => f.id);
  const { error: err2 } = await supabase
    .from("formularios")
    .delete()
    .in("id", ids);

  if (err2) {
    throw new Error(`Error eliminando formularios: ${err2.message}`);
  }

  console.log(`✓ ${total} formularios eliminados.`);
}

main().catch((error) => {
  console.error(
    "✗ Limpieza falló:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
