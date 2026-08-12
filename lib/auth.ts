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
 * Seguridad adicional (ver `lib/loginThrottle.ts`):
 *   - Rate-limit por IP (10/10min) y por email (5/15min).
 *   - Lockout por email tras 10 fallos (1h).
 *   - Si cualquiera rechaza, devolvemos null SIN ejecutar bcrypt — así
 *     evitamos fugas de timing y ahorramos CPU bajo ataque.
 *   - Login exitoso resetea los contadores del email.
 *
 * Implementación: usamos lazy init (`NextAuth(req => config)`) para poder
 * leer los headers de la request en `authorize` (la API de Auth.js no
 * inyecta el `request` en el callback `authorize` directamente).
 */
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verificarCredencialesAdmin } from "@/lib/services/authService";
import {
  puedeIntentarLogin,
  registrarLoginExitoso,
} from "@/lib/loginThrottle";
import { getClientIp } from "@/lib/http";

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
  console.warn(
    "[auth] HARDCODE_ADMIN_EMAIL / HARDCODE_ADMIN_PASSWORD no están definidas. " +
      "Login solo funcionará contra la tabla admin_user de Supabase.",
  );
}

/**
 * Lazy init de NextAuth v5: la función recibe el `request` por cada
 * invocación y devuelve la config. Esto nos permite cerrar sobre `req`
 * dentro de `authorize` y leer los headers (XFF, X-Real-IP) para el
 * rate-limit por IP.
 *
 * Truco: el `request` que Auth.js pasa a esta función es un objeto
 * `NextAuthRequest` (con `headers`, `body`, `method`). Headers tiene
 * la API estándar de `Headers`, así que `getClientIp` funciona igual.
 */
export const { handlers, auth, signIn, signOut } = NextAuth((request) => {
  // Capturamos el `headers` para que `authorize` lo pueda leer vía
  // closure. Si request es null (caso sin request, ej. en build),
  // caemos a un fallback vacío.
  const headers: Headers =
    (request as { headers?: Headers } | undefined)?.headers ?? new Headers();

  return {
    trustHost: true,
    // En producción forzamos cookies Secure (HTTPS). En dev usamos cookies
    // sin flag secure para que el login funcione sobre http://localhost.
    useSecureCookies: process.env.NODE_ENV === "production",
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
          const ip = getClientIp({ headers } as unknown as Request);

          const email = String(credentials?.email ?? "").trim().toLowerCase();
          const password = String(credentials?.password ?? "");

          if (!email || !password) return null;

          // ─── Rate-limit (IP + email + lockout) ──────────────────
          const verdict = puedeIntentarLogin(ip, email);
          if (!verdict.ok) {
            // Devolvemos null — NextAuth pintará "credenciales inválidas"
            // genérico, que es lo que queremos (no revelamos que hay
            // rate-limit ni enumeración por email).
            return null;
          }

          // ─── 1) Fallback hardcoded para dev rápido ──────────────
          if (
            HARDCODE_ADMIN_EMAIL &&
            HARDCODE_ADMIN_PASSWORD &&
            email === HARDCODE_ADMIN_EMAIL.trim().toLowerCase() &&
            password === HARDCODE_ADMIN_PASSWORD
          ) {
            registrarLoginExitoso(email);
            return {
              id: "admin-hardcoded",
              email,
              name: "Admin (hardcoded)",
            };
          }

          // ─── 2) Validación real contra Supabase + bcrypt ────────
          try {
            const user = await verificarCredencialesAdmin(email, password);
            if (!user) return null;
            registrarLoginExitoso(email);
            return {
              id: user.id,
              email: user.email,
              name: "Admin",
            };
          } catch (error) {
            console.error("[auth] Error verificando credenciales:", error);
            return null;
          }
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
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
  };
});