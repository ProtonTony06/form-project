/**
 * Configuración de NextAuth v5 (Auth.js).
 *
 * Estado actual (Fase 2): credenciales hardcoded en variables de entorno.
 *   - HARDCODE_ADMIN_EMAIL
 *   - HARDCODE_ADMIN_PASSWORD  (texto plano, solo para desarrollo)
 *
 * Migración a Supabase (Fase 1 o posterior):
 *   1. Crear tabla `admin_user` con columnas: id, email, password_hash, created_at.
 *   2. Reemplazar el `authorize` de abajo por una query a Supabase que compare
 *      `email` y verifique `password_hash` con bcrypt (ver `lib/utils.ts`).
 *   3. Mantener el `id` que viene de BD para que `session.user.id` siga funcionando.
 *
 * El resto (callbacks, página de login, middleware) NO cambia.
 */
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
  }
}

const HARDCODE_ADMIN_EMAIL = process.env.HARDCODE_ADMIN_EMAIL;
const HARDCODE_ADMIN_PASSWORD = process.env.HARDCODE_ADMIN_PASSWORD;

if (!HARDCODE_ADMIN_EMAIL || !HARDCODE_ADMIN_PASSWORD) {
  // Aviso en consola pero no rompemos el build: las variables se validan
  // dentro de `authorize` con un error legible.
  console.warn(
    "[auth] HARDCODE_ADMIN_EMAIL / HARDCODE_ADMIN_PASSWORD no están definidas. El login fallará hasta configurarlas."
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 días
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;
        if (!HARDCODE_ADMIN_EMAIL || !HARDCODE_ADMIN_PASSWORD) return null;

        // Comparación simple en texto plano (solo dev). En producción usar bcrypt contra la BD.
        const expectedEmail = HARDCODE_ADMIN_EMAIL.trim().toLowerCase();
        if (email !== expectedEmail) return null;
        if (password !== HARDCODE_ADMIN_PASSWORD) return null;

        // Devolvemos un id estable (en Supabase será el id real de la fila).
        return {
          id: "admin-hardcoded",
          email: expectedEmail,
          name: "Admin",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Solo se ejecuta la primera vez que el usuario hace login.
      if (user) {
        token.id = (user as { id?: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      const tokenId = (token as { id?: string } | null)?.id;
      if (tokenId && session.user) {
        session.user.id = tokenId;
      }
      return session;
    },
  },
});
