/**
 * Rate-limit + lockout progresivo para el login de admin.
 *
 * Tres capas, todas en memoria (conscientes del límite — ver lib/rateLimit.ts):
 *
 *   1. Por IP: 10 intentos / 10 min.
 *      → Evita que un atacante con una sola IP pruebe muchas passwords.
 *   2. Por email: 5 intentos / 15 min.
 *      → Evita credential stuffing distribuido (muchas IPs, un email).
 *   3. Lockout por email: 10 fallos acumulados → 1 hora de bloqueo.
 *      → Defensa contra ataques sostenidos en el tiempo.
 *
 * Si cualquiera de las tres capas rechaza, el endpoint responde 429 y NO
 * se ejecuta el `authorize` de NextAuth — así bcrypt ni se invoca.
 *
 * Importante: este módulo SOLO se usa desde `authorize`. Las claves
 * específicas de login usan el prefijo `login:` para no colisionar con
 * los buckets de `submit:` u otros rate-limits.
 */

import { rateLimit, resetRateLimit } from "@/lib/rateLimit";

/**
 * Ventanas y límites.
 *
 * Definidos aquí para tenerlos en un solo sitio y poder tunearlos sin
 * tocar la lógica. Los números son razonables para un admin de uso
 * personal: equivocarse 5 veces en 15 min es raro, 10 ya es síntoma
 * de ataque.
 */
export const LIMITS = {
  perIp: { max: 10, windowMs: 10 * 60 * 1000 },
  perEmail: { max: 5, windowMs: 15 * 60 * 1000 },
  lockoutThreshold: 10,
  lockoutDurationMs: 60 * 60 * 1000, // 1 hora
} as const;

interface Veredicto {
  ok: boolean;
  motivo?: "ip" | "email" | "lockout";
  retryAfterMs?: number;
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/**
 * Comprueba si un intento de login debe pasar.
 * Devuelve `{ ok: true }` si pasa, o `{ ok: false, motivo, retryAfterMs }`
 * si debe rechazarse.
 *
 * Esta función NO incrementa contadores — sólo comprueba. Para acumular
 * un fallo usa `registrarLoginFallido(email)`; para limpiar al tener
 * éxito, `registrarLoginExitoso(email)`.
 */
export function puedeIntentarLogin(ip: string, email: string): Veredicto {
  const emailNorm = normalizeEmail(email);

  // 1) Lockout por email — la más restrictiva, se chequea primero.
  const lockoutKey = `login:lockout:${emailNorm}`;
  if (
    !rateLimit(lockoutKey, LIMITS.lockoutThreshold, LIMITS.lockoutDurationMs)
  ) {
    return {
      ok: false,
      motivo: "lockout",
      retryAfterMs: LIMITS.lockoutDurationMs,
    };
  }

  // 2) Rate limit por IP.
  if (!rateLimit(`login:ip:${ip}`, LIMITS.perIp.max, LIMITS.perIp.windowMs)) {
    return {
      ok: false,
      motivo: "ip",
      retryAfterMs: LIMITS.perIp.windowMs,
    };
  }

  // 3) Rate limit por email.
  if (
    !rateLimit(
      `login:email:${emailNorm}`,
      LIMITS.perEmail.max,
      LIMITS.perEmail.windowMs,
    )
  ) {
    return {
      ok: false,
      motivo: "email",
      retryAfterMs: LIMITS.perEmail.windowMs,
    };
  }

  return { ok: true };
}

/**
 * Registra un login exitoso: limpia los contadores asociados a ese
 * email para que el usuario legítimo no quede penalizado.
 *
 * NO limpiamos el bucket por IP — debe seguir contando para proteger
 * otras cuentas que un atacante pueda intentar desde la misma IP.
 *
 * Nota: el "lockout" se mide por el propio bucket `login:lockout:${email}`,
 * que se incrementa automáticamente en cada llamada a `puedeIntentarLogin`.
 * No necesitamos un Map de "intentos fallidos" separado.
 */
export function registrarLoginExitoso(email: string): void {
  const emailNorm = normalizeEmail(email);
  resetRateLimit(`login:email:${emailNorm}`);
  resetRateLimit(`login:lockout:${emailNorm}`);
}