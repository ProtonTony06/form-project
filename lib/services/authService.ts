/**
 * Servicio de autenticación administrativa.
 *
 * Usa `service_role` (bypasea RLS) porque `admin_user` no expone ninguna policy
 * para `anon` ni `authenticated`. Solo se usa desde código server-side.
 *
 * Las funciones aquí NO exponen el hash. Devuelven un objeto seguro con
 * `id` y `email` para que NextAuth lo meta en la sesión JWT.
 */
import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase/service";

export interface AdminUserSeguro {
  id: string;
  email: string;
}

/**
 * Verifica credenciales contra la tabla `admin_user`.
 * Devuelve el usuario seguro si coincide, o `null` si falla cualquier cosa.
 *
 * Importante: nunca revelar el motivo exacto del fallo (mismo mensaje
 * para "no existe" y "password incorrecto") para evitar user enumeration.
 */
export async function verificarCredencialesAdmin(
  email: string,
  password: string,
): Promise<AdminUserSeguro | null> {
  if (!email || !password) return null;

  const supabase = createServiceClient();
  const { data: user, error } = await supabase
    .from("admin_user")
    .select("id, email, password_hash")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error || !user) return null;

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  return { id: user.id, email: user.email };
}

/**
 * Crea o actualiza el password de un admin (uso en seed/admin scripts).
 */
export async function upsertAdminUser(
  email: string,
  password: string,
): Promise<AdminUserSeguro> {
  const hash = await bcrypt.hash(password, 12);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("admin_user")
    .upsert(
      { email: email.trim().toLowerCase(), password_hash: hash },
      { onConflict: "email" },
    )
    .select("id, email")
    .single();

  if (error || !data) {
    throw new Error(`upsertAdminUser: ${error?.message ?? "sin datos"}`);
  }
  return { id: data.id, email: data.email };
}