import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase para uso en el navegador (Client Components).
 * Usa la `anon` key (RLS se aplica).
 *
 * ⚠️ En este proyecto el acceso desde cliente es mínimo: casi todo pasa
 * por el servidor. Si necesitas queries desde el navegador, considera
 * mover la lógica a un Server Action.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
