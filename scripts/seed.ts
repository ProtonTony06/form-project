/**
 * Crea (o actualiza) el usuario administrador en la tabla `admin_user`.
 *
 * Pide email y password por consola, hashea con bcrypt (cost 12) y hace
 * UPSERT en la tabla. Idempotente: si el email ya existe, actualiza el hash.
 *
 * Uso: `npm run seed`
 */
import { createServiceClient } from "../lib/supabase/service";
import bcrypt from "bcryptjs";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

async function main(): Promise<void> {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    const emailRaw = await rl.question("Email admin: ");
    const password = await rl.question("Password admin: ");
    const email = emailRaw.trim().toLowerCase();

    if (!email || !password) {
      throw new Error("Email y password son obligatorios.");
    }
    if (password.length < 8) {
      throw new Error("El password debe tener al menos 8 caracteres.");
    }

    console.log("→ Hasheando password (bcrypt cost 12)…");
    const password_hash = await bcrypt.hash(password, 12);

    console.log("→ Insertando/actualizando admin_user…");
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("admin_user")
      .upsert(
        { email, password_hash },
        { onConflict: "email", count: "exact" },
      )
      .select("id, email, created_at")
      .single();

    if (error) {
      throw new Error(`Error de Supabase: ${error.message}`);
    }

    console.log("✓ Admin user guardado:");
    console.log(`  id     = ${data.id}`);
    console.log(`  email  = ${data.email}`);
    console.log(`  created= ${data.created_at}`);
    console.log("\nYa puedes iniciar sesión en /admin/login con estas credenciales.");
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error("✗ Seed falló:", error instanceof Error ? error.message : error);
  process.exit(1);
});