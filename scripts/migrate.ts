/**
 * Ejecuta las migraciones SQL de `supabase/migrations/` contra la base de
 * datos definida en `DATABASE_URL`. Lleva tracking en una tabla `_migrations`
 * para ser idempotente (re-ejecutable sin duplicar cambios).
 *
 * Uso: `npm run migrate`
 *
 * Importante: este script requiere acceso DDL directo, por lo que usa
 * `pg` (node-postgres) con `DATABASE_URL` en lugar del cliente Supabase JS.
 * La `service_role` key NO tiene permisos para CREATE TABLE/EXTENSION.
 */
import { Client } from "pg";
import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";

// Carga .env.local manualmente (los scripts se ejecutan fuera de Next).
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback a .env

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("✗ DATABASE_URL no definida. Configura .env.local antes de migrar.");
  process.exit(1);
}

const MIGRATIONS_DIR = path.resolve(process.cwd(), "supabase", "migrations");

/** Crea la tabla de tracking si no existe. */
async function ensureMigrationsTable(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public._migrations (
      filename   text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

/** Devuelve el set de migraciones ya aplicadas. */
async function getAppliedMigrations(client: Client): Promise<Set<string>> {
  const result = await client.query<{ filename: string }>(
    "SELECT filename FROM public._migrations ORDER BY filename ASC",
  );
  return new Set(result.rows.map((row) => row.filename));
}

/** Lee los `.sql` del directorio en orden lexicográfico. */
function readMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function main(): Promise<void> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    console.log("→ Conectado. Asegurando tabla de tracking…");
    await ensureMigrationsTable(client);

    const applied = await getAppliedMigrations(client);
    const files = readMigrationFiles();

    if (files.length === 0) {
      console.log(`(sin archivos .sql en ${MIGRATIONS_DIR})`);
      return;
    }

    let appliedCount = 0;
    let skippedCount = 0;

    for (const filename of files) {
      if (applied.has(filename)) {
        console.log(`= ${filename} (ya aplicada, se omite)`);
        skippedCount++;
        continue;
      }

      const fullPath = path.join(MIGRATIONS_DIR, filename);
      const sql = fs.readFileSync(fullPath, "utf8");

      console.log(`→ Aplicando ${filename}…`);
      try {
        // Cada migración se ejecuta en su propia transacción.
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          "INSERT INTO public._migrations (filename) VALUES ($1)",
          [filename],
        );
        await client.query("COMMIT");
        console.log(`✓ ${filename} aplicada`);
        appliedCount++;
      } catch (error) {
        await client.query("ROLLBACK");
        console.error(`✗ ${filename} falló:`);
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
        return;
      }
    }

    console.log(
      `\n✓ Migración completada (${appliedCount} nuevas, ${skippedCount} ya aplicadas).`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("\n✗ No se pudo conectar a la base de datos.");
  console.error("  Detalle:", error instanceof Error ? error.message : error);
  console.error("\nSi tu entorno no puede alcanzar el host directo (IPv6) o el");
  console.error("pooler, aplica la migración manualmente desde Supabase Studio:");
  console.error("  SQL Editor → New query → pega el contenido de");
  console.error("  supabase/migrations/20260811120000_init.sql → Run");
  process.exit(1);
});
