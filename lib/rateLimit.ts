/**
 * Rate limiter in-memory por clave (típicamente `submit:${ip}`).
 *
 * Limitaciones conscientes:
 *   - El Map vive en el proceso Node.js; cada deploy/restart lo resetea.
 *   - En multi-instancia cada réplica lleva su propio contador.
 * Para un MVP single-tenant esto es aceptable; si el tráfico sube o se
 * añaden workers, migrar a Redis/Upstash (Fase 7+).
 *
 * API:
 *   rateLimit(key, max, windowMs) → true si la request se admite,
 *                                   false si se debe rechazar (429).
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Comprueba y, si procede, consume 1 unidad del bucket de `key`.
 * Devuelve `true` si la request está dentro del límite, `false` si se
 * agotó (la API debería responder 429).
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= max) {
    return false;
  }

  bucket.count++;
  return true;
}

/**
 * Limpieza periódica de buckets expirados.
 * - Sólo se registra si `setInterval` está disponible (lo está en Node,
 *   pero NO en Edge runtime — ahí simplemente no se ejecuta la limpieza).
 * - `.unref?.()` evita que el timer mantenga vivo el proceso en tests.
 */
if (typeof setInterval !== "undefined") {
  const cleanup = setInterval(() => {
    const now = Date.now();
    buckets.forEach((v, k) => {
      if (v.resetAt < now) buckets.delete(k);
    });
  }, 60_000);

  // `unref` existe en Node pero no siempre está en los typings; intentamos
  // invocarlo de forma tolerante a fallos.
  type MaybeUnref = { unref?: () => void };
  (cleanup as unknown as MaybeUnref).unref?.();
}
