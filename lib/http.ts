/**
 * Extracción de IP del cliente en runtime Node (route handlers).
 *
 * Orden de prioridad:
 *   1. Primer valor de `x-forwarded-for` (cadena separada por comas
 *      ordenada por cercanía al cliente). Es lo que mete Render como
 *      proxy inverso.
 *   2. `x-real-ip` (algunos proxies usan este en lugar de XFF).
 *   3. Fallback "unknown" para que el rate limit siga contando sin
 *      colapsar a "0.0.0.0".
 *
 * Importante: NO se debe confiar ciegamente en estos headers si la app
 * estuviera expuesta sin un proxy de confianza. En nuestro caso Render
 * siempre prepende la IP del cliente, así que es seguro.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}