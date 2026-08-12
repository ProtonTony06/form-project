/**
 * Configuración de NextAuth v5 (Auth.js).
 *
 * Migración a Supabase (Fase 1): ahora valida contra la tabla `admin_user`
 * con bcrypt (cost 12). Sigue soportando el fallback hardcoded (HARDCODE_ADMIN_*
 * en `.env.local`) para no romper el flujo de desarrollo.
 *
 * Orden de prioridad en `authorize`:
 *   1. Si las credenciales coinciden con HARDCODE_ADMIN_*, pasa.
 *      (útil para tests locales sin tener que sembrar la BD).
 *   2. Si no, valida contra la tabla `admin_user` con bcrypt.
 *   3. Cualquier otro caso → null (login falla).
 *
 * El resto (callbacks, página de login, middleware) NO cambia.
 */
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verificarCredencialesAdmin } from "@/lib/services/authService";

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
    "[auth] HARDCODE_ADMIN_EMAIL / HARDCODE_ADMIN_PASSWORD no están definidas. " +
      "Login solo funcionará contra la tabla admin_user de Supabase.",
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

        // ─── 1) Fallback hardcoded para dev rápido ──────────────────────
        if (
          HARDCODE_ADMIN_EMAIL &&
          HARDCODE_ADMIN_PASSWORD &&
          email === HARDCODE_ADMIN_EMAIL.trim().toLowerCase() &&
          password === HARDCODE_ADMIN_PASSWORD
        ) {
          return {
            id: "admin-hardcoded",
            email,
            name: "Admin (hardcoded)",
          };
        }

        // ─── 2) Validación real contra Supabase + bcrypt ────────────────
        try {
          const user = await verificarCredencialesAdmin(email, password);
          if (!user) return null;
          return {
            id: user.id,
            email: user.email,
            name: "Admin",
          };
        } catch (error) {
          // Si la BD no está accesible, no bloqueamos: devolvemos null
          // para que el usuario vea "credenciales inválidas" en vez de un 500.
          console.error("[auth] Error verificando credenciales:", error);
          return null;
        }
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