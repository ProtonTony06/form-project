import { DefaultSession } from "next-auth";

/**
 * Extiende el tipo `Session` de NextAuth para incluir `id` del usuario.
 * Se usa en `lib/auth.ts` callbacks y en componentes cliente para acceder
 * a `session.user.id`.
 *
 * La declaración `declare module "next-auth"` vive en `lib/auth.ts` para
 * mantener el módulo augmentable en el mismo archivo que los callbacks
 * que dependen de él. Aquí solo re-exportamos el tipo por conveniencia.
 */
export type SessionWithId = DefaultSession & {
  user: { id: string } & DefaultSession["user"];
};
