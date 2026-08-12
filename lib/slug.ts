/**
 * Utilidades de slug para FormProject.
 *
 * - `slugify(text)`: convierte texto libre a kebab-case normalizado.
 * - `validarSlug(slug)`: comprueba el formato con la regex de la BD.
 * - `generarSlugUnico(base)`: devuelve un slug único (problema de colisiones
 *   resuelto con `nanoid` o timestamp como fallback).
 *
 * La regex es la MISMA que `formularios.formularios_slug_format` en la BD.
 * Si cambias una, cambia la otra.
 */

import { nanoid } from "nanoid";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Regex oficial: 1..40 chars, kebab-case, sin acentos.
 *   - empieza y termina por [a-z0-9]
 *   -中间最多 38 chars de [a-z0-9-]
 *   - sin '--' ni '-' al inicio/final (implícito por los anchors).
 */
export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

/**
 * Convierte un texto a slug kebab-case normalizado.
 * - minúsculas
 * - sin acentos (NFD + remove combining marks)
 * - solo [a-z0-9\s-]
 * - colapsa espacios y guiones
 * - trim de guiones al inicio/final
 * - máximo 40 chars
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** Valida que el slug cumple el formato permitido. */
export function validarSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

/**
 * Genera un slug único a partir de `base`:
 *  1. slugifica `base`. Si queda vacío, usa "formulario".
 *  2. si `baseSlug` está libre, lo devuelve.
 *  3. si está ocupado, prueba hasta 5 sufijos aleatorios (`-xxxx`).
 *  4. si todos chocan, hace fallback con timestamp base36.
 */
export async function generarSlugUnico(base: string): Promise<string> {
  const baseSlug = slugify(base) || "formulario";
  const supabase = createServiceClient();

  const libre = await existeSlug(supabase, baseSlug);
  if (!libre) return baseSlug;

  for (let i = 0; i < 5; i++) {
    const sufijo = nanoid(4).toLowerCase().replace(/[^a-z0-9]/g, "a");
    const candidato = `${baseSlug}-${sufijo}`.slice(0, 40);
    if (candidato.length < baseSlug.length + 2) continue; // demasiado corto
    const ocupado = await existeSlug(supabase, candidato);
    if (!ocupado) return candidato;
  }

  // Fallback: timestamp en base36. Prácticamente imposible que choque.
  return `${baseSlug}-${Date.now().toString(36)}`.slice(0, 40);
}

/** Helper interno: devuelve true si el slug ya existe. */
async function existeSlug(
  supabase: ReturnType<typeof createServiceClient>,
  slug: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("formularios")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    // Si falla la query no bloqueamos: log y asumimos libre.
    console.error(`[slug] Error comprobando '${slug}':`, error.message);
    return false;
  }
  return data !== null;
}