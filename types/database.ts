/**
 * Tipos de la base de datos Supabase.
 *
 * En Fase 1 se generarán automáticamente con:
 *   `npm run db:types`
 * (requiere `SUPABASE_PROJECT_ID` real en `.env.local` y CLI de Supabase).
 *
 * Por ahora dejamos un placeholder mínimo para que los clientes
 * `createBrowserClient<Database>`, `createServerClient<Database>` y
 * `createClient<Database>` compilen sin errores.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
