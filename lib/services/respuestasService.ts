/**
 * Servicio de respuestas (Fase 5 — pivot del MVP).
 *
 * - `listarRespuestasPorFormulario` / `obtenerRespuestaDetalle` /
 *   `contarRespuestasPorFormulario` / `contarRespuestasBatch` →
 *   lecturas usadas por el dashboard admin (otro agente las consume).
 * - `crearRespuesta` → escritura usada por el endpoint público
 *   `POST /api/submit/[slug]`.
 *
 * Usa `createServiceClient()` porque bypasea RLS — las tablas
 * `respuestas` y `respuesta_preguntas` NO exponen policies de SELECT
 * para `anon`, así que el cliente NO puede leerlas directamente.
 *
 * Server-only: nunca importar desde Client Components.
 */
import { createServiceClient } from "@/lib/supabase/service";
import type {
  FormularioConPreguntas,
  Pregunta,
} from "@/types/formulario";

/** Cabecera de una respuesta persistida. */
export interface Respuesta {
  id: string;
  formulario_id: string;
  ip: string | null;
  user_agent: string | null;
  submitted_at: string;
}

/** Respuesta con cabecera + metadatos del formulario + mapa pregunta→valor. */
export interface RespuestaDetalle extends Respuesta {
  formulario: Pick<FormularioConPreguntas, "id" | "slug" | "titulo">;
  valores: Record<string, string>;
}

/**
 * Lista respuestas de un formulario con paginación sencilla.
 * Ordena por `submitted_at DESC` (más recientes primero).
 */
export async function listarRespuestasPorFormulario(
  formularioId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<{ data: Respuesta[]; total: number }> {
  const supabase = createServiceClient();
  const { limit = 50, offset = 0 } = options;

  const { data, error, count } = await supabase
    .from("respuestas")
    .select("id, formulario_id, ip, user_agent, submitted_at", {
      count: "exact",
    })
    .eq("formulario_id", formularioId)
    .order("submitted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Error listando respuestas: ${error.message}`);
  }
  return { data: (data ?? []) as Respuesta[], total: count ?? 0 };
}

/**
 * Detalle completo de una respuesta: cabecera + info del formulario +
 * mapa pregunta_id → valor.
 *
 * Devuelve `null` si no existe la respuesta o el formulario asociado.
 */
export async function obtenerRespuestaDetalle(
  respuestaId: string,
): Promise<RespuestaDetalle | null> {
  const supabase = createServiceClient();

  const { data: resp, error: err1 } = await supabase
    .from("respuestas")
    .select("id, formulario_id, ip, user_agent, submitted_at")
    .eq("id", respuestaId)
    .single();

  if (err1 || !resp) {
    if (err1) console.error("Error leyendo respuesta:", err1.message);
    return null;
  }

  const { data: form, error: err2 } = await supabase
    .from("formularios")
    .select("id, slug, titulo")
    .eq("id", (resp as Respuesta).formulario_id)
    .single();

  if (err2 || !form) {
    if (err2) console.error("Error leyendo formulario:", err2.message);
    return null;
  }

  const { data: vals, error: err3 } = await supabase
    .from("respuesta_preguntas")
    .select("pregunta_id, valor")
    .eq("respuesta_id", respuestaId);

  if (err3) {
    throw new Error(`Error obteniendo valores: ${err3.message}`);
  }

  const valores: Record<string, string> = {};
  (vals ?? []).forEach((v) => {
    valores[v.pregunta_id] = v.valor;
  });

  return {
    ...(resp as Respuesta),
    formulario: form as Pick<FormularioConPreguntas, "id" | "slug" | "titulo">,
    valores,
  };
}

/** Cuenta respuestas de un único formulario (badge individual). */
export async function contarRespuestasPorFormulario(
  formularioId: string,
): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from("respuestas")
    .select("id", { count: "exact", head: true })
    .eq("formulario_id", formularioId);

  if (error) {
    throw new Error(`Error contando respuestas: ${error.message}`);
  }
  return count ?? 0;
}

/**
 * Cuenta respuestas para varios formularios en una sola query
 * (usado por el dashboard para pintar los badges de cada formulario).
 *
 * Devuelve `Record<formulario_id, count>`; si un id no tiene respuestas,
 * el valor es 0.
 */
export async function contarRespuestasBatch(
  formularioIds: string[],
): Promise<Record<string, number>> {
  if (formularioIds.length === 0) return {};
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("respuestas")
    .select("formulario_id")
    .in("formulario_id", formularioIds);

  if (error) {
    throw new Error(`Error contando respuestas: ${error.message}`);
  }

  const counts: Record<string, number> = {};
  formularioIds.forEach((id) => {
    counts[id] = 0;
  });
  (data ?? []).forEach((r) => {
    counts[r.formulario_id] = (counts[r.formulario_id] ?? 0) + 1;
  });
  return counts;
}

/**
 * Inserta una respuesta completa (cabecera + valores de cada pregunta).
 *
 * Implementación: dos queries (INSERT cabecera, INSERT bulk de valores).
 * Si la segunda falla, hace rollback manual (DELETE cabecera) para no
 * dejar respuestas huérfanas sin valores.
 *
 * @param formularioId id del formulario al que se responde.
 * @param valores mapa `pregunta_id → valor` (validado previamente por
 *                `validateRespuestasContraFormulario`).
 * @param meta `ip` y `userAgent` del cliente (informativos).
 */
export async function crearRespuesta(
  formularioId: string,
  valores: Record<string, string>,
  meta: { ip: string; userAgent: string },
): Promise<Respuesta> {
  const supabase = createServiceClient();

  // 1. Insert cabecera.
  const { data: resp, error: err1 } = await supabase
    .from("respuestas")
    .insert({
      formulario_id: formularioId,
      ip: meta.ip,
      user_agent: meta.userAgent,
    })
    .select("id, formulario_id, ip, user_agent, submitted_at")
    .single();

  if (err1 || !resp) {
    throw new Error(
      `Error creando respuesta: ${err1?.message ?? "sin data"}`,
    );
  }

  const respuestaId = (resp as Respuesta).id;

  // 2. Insert bulk de valores (una fila por pregunta respondida).
  const valoresRows = Object.entries(valores).map(([pregunta_id, valor]) => ({
    respuesta_id: respuestaId,
    pregunta_id,
    valor,
  }));

  if (valoresRows.length > 0) {
    const { error: err2 } = await supabase
      .from("respuesta_preguntas")
      .insert(valoresRows);

    if (err2) {
      // Rollback manual: borrar la cabecera creada.
      await supabase.from("respuestas").delete().eq("id", respuestaId);
      throw new Error(`Error guardando valores: ${err2.message}`);
    }
  }

  return resp as Respuesta;
}

/**
 * Tipo helper exportado por si la UI quiere renderizar un mapa
 * `pregunta_id → valor` con su pregunta.
 */
export interface RespuestaConPreguntas {
  respuesta: Respuesta;
  pregunta: Pregunta;
  valor: string;
}
