import { DefaultSession } from "next-auth";

/**
 * Extiende el tipo `Session` de NextAuth para incluir `id` del usuario.
 * Se usa en `lib/auth.ts` callbacks y en componentes cliente para acceder
 * a `session.user.id`.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
