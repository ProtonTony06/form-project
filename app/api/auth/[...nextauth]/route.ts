/**
 * Route handler de NextAuth v5.
 * Re-exporta los handlers generados en `lib/auth.ts`.
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
