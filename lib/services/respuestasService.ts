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

/* ------------------------------------------------------------------------- */
/*  Export JSON (admin — descarga completa de respuestas)                    */
/* ------------------------------------------------------------------------- */

/** Item de valor cruzado con su pregunta, para el JSON exportado. */
export interface RespuestaExportItem {
  pregunta_id: string;
  pregunta_orden: number;
  pregunta_contenido: string;
  pregunta_tipo: string;
  pregunta_opciones: string[] | null;
  valor: string;
}

/** Payload completo listo para `JSON.stringify` y descarga. */
export interface FormularioExportPayload {
  formulario: {
    id: string;
    slug: string;
    titulo: string;
    descripcion: string | null;
  };
  total: number;
  preguntas: Array<{
    id: string;
    orden: number;
    tipo: string;
    contenido: string;
    opciones: string[] | null;
    requerido: boolean;
  }>;
  respuestas: Array<{
    id: string;
    submitted_at: string;
    ip: string | null;
    user_agent: string | null;
    valores: RespuestaExportItem[];
  }>;
  exported_at: string;
}

const EXPORT_PAGE_SIZE = 1000;

/**
 * Construye el payload completo para exportar un formulario a JSON.
 *
 * A diferencia de `listarRespuestasPorFormulario` (cap a 50/200), aquí
 * paginamos internamente en bloques de 1000 para traer TODAS las
 * respuestas, cruzar cada valor con su pregunta y devolver un objeto
 * legible por humanos (cada valor lleva `pregunta_orden/contenido/tipo`).
 *
 * Devuelve `null` si el formulario no existe.
 */
export async function exportarRespuestasComoJSON(
  formularioId: string,
): Promise<FormularioExportPayload | null> {
  const supabase = createServiceClient();

  // 1. Cabecera del formulario.
  const { data: form, error: errForm } = await supabase
    .from("formularios")
    .select("id, slug, titulo, descripcion")
    .eq("id", formularioId)
    .maybeSingle();

  if (errForm) {
    throw new Error(`Error leyendo formulario: ${errForm.message}`);
  }
  if (!form) return null;

  // 2. Preguntas del formulario (ordenadas).
  const { data: preguntas, error: errPreg } = await supabase
    .from("preguntas")
    .select("id, orden, tipo, contenido, opciones, requerido")
    .eq("formulario_id", formularioId)
    .order("orden", { ascending: true });

  if (errPreg) {
    throw new Error(`Error leyendo preguntas: ${errPreg.message}`);
  }

  const preguntasOrdenadas = (preguntas ?? []) as Array<
    FormularioExportPayload["preguntas"][number]
  >;

  // Mapa pregunta_id → pregunta (para cruzar con valores en O(1)).
  const preguntasById = new Map(preguntasOrdenadas.map((p) => [p.id, p]));

  // 3. Total de respuestas (para saber cuántas páginas iterar).
  const total = await contarRespuestasPorFormulario(formularioId);

  // 4. Cabeceras de respuestas paginadas.
  const cabeceras: Respuesta[] = [];
  for (let offset = 0; offset < total; offset += EXPORT_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("respuestas")
      .select("id, formulario_id, ip, user_agent, submitted_at")
      .eq("formulario_id", formularioId)
      .order("submitted_at", { ascending: false })
      .range(offset, offset + EXPORT_PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Error listando respuestas: ${error.message}`);
    }
    cabeceras.push(...((data ?? []) as Respuesta[]));
  }

  // 5. Valores por respuesta (otra paginación, sobre respuesta_preguntas
  //    filtrando por las respuestas obtenidas). Para no hacer N queries,
  //    consultamos todos los valores del formulario en una sola query con
  //    un INNER JOIN lógico via filtro `respuesta_id IN (...)`.
  const respuestasIds = cabeceras.map((c) => c.id);
  const valoresPorRespuesta = new Map<string, Array<{ pregunta_id: string; valor: string }>>();

  if (respuestasIds.length > 0) {
    // Supabase PostgREST tiene un límite práctico en `IN (...)` (~algunos
    // miles). Paginar en lotes de EXPORT_PAGE_SIZE ids.
    for (let i = 0; i < respuestasIds.length; i += EXPORT_PAGE_SIZE) {
      const lote = respuestasIds.slice(i, i + EXPORT_PAGE_SIZE);
      const { data, error } = await supabase
        .from("respuesta_preguntas")
        .select("respuesta_id, pregunta_id, valor")
        .in("respuesta_id", lote);

      if (error) {
        throw new Error(`Error leyendo valores: ${error.message}`);
      }
      (data ?? []).forEach((v) => {
        const lista = valoresPorRespuesta.get(v.respuesta_id) ?? [];
        lista.push({ pregunta_id: v.pregunta_id, valor: v.valor });
        valoresPorRespuesta.set(v.respuesta_id, lista);
      });
    }
  }

  // 6. Ensamblar respuestas con valores cruzados y ordenados por pregunta.
  const respuestasExport = cabeceras.map((cab) => {
    const valoresCrudos = valoresPorRespuesta.get(cab.id) ?? [];
    const valores: RespuestaExportItem[] = valoresCrudos
      .map((v) => {
        const p = preguntasById.get(v.pregunta_id);
        if (!p) {
          // Pregunta borrada después de la respuesta — la omitimos.
          return null;
        }
        return {
          pregunta_id: p.id,
          pregunta_orden: p.orden,
          pregunta_contenido: p.contenido,
          pregunta_tipo: p.tipo,
          pregunta_opciones: p.opciones,
          valor: v.valor,
        };
      })
      .filter((v): v is RespuestaExportItem => v !== null)
      .sort((a, b) => a.pregunta_orden - b.pregunta_orden);

    return {
      id: cab.id,
      submitted_at: cab.submitted_at,
      ip: cab.ip,
      user_agent: cab.user_agent,
      valores,
    };
  });

  return {
    formulario: {
      id: form.id,
      slug: form.slug,
      titulo: form.titulo,
      descripcion: form.descripcion,
    },
    total,
    preguntas: preguntasOrdenadas,
    respuestas: respuestasExport,
    exported_at: new Date().toISOString(),
  };
}
