import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase con `service_role` (bypasea RLS).
 *
 * ⚠️ SOLO usar en servidor (Server Actions, Route Handlers, scripts).
 * NUNCA exponer al cliente. NUNCA importar desde un Client Component.
 *
 * Usos legítimos en este proyecto:
 *  - CRUD de formularios en Server Actions admin
 *  - Lectura de definiciones en el endpoint público `/api/submit/[slug]`
 *  - Scripts de seed y migración
 */
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
