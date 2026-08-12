/**
 * Servicio de formularios (CRUD).
 *
 * Usa `service_role` para bypasear RLS. Pensado para Server Actions y
 * Route Handlers administrativos. NO importar desde Client Components.
 *
 * Las operaciones de escritura (`crear`, `actualizar`, `eliminar`,
 * `toggleActivo`) hacen las preguntas en una transacción lógica (DELETE + INSERT
 * o INSERT en bloque). Si cualquier parte falla se propaga el error.
 */
import { createServiceClient } from "@/lib/supabase/service";
import type {
  Formulario,
  FormularioConPreguntas,
  Pregunta,
  TipoPregunta,
} from "@/types/formulario";
import type { Database } from "@/types/database";
import type {
  FormularioCreateInput,
  FormularioUpdateInput,
  PreguntaInput,
} from "@/lib/validators/formulario";

type PreguntaInsert = Database["public"]["Tables"]["preguntas"]["Insert"];

/** Error genérico con contexto para facilitar el logging. */
class FormulariosServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "FormulariosServiceError";
  }
}

/**
 * Lista todos los formularios (resumen, sin preguntas).
 * Ordena por `created_at` DESC para que los más recientes aparezcan arriba.
 */
export async function listarFormularios(): Promise<Formulario[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("formularios")
    .select("id, slug, titulo, descripcion, activo, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) throw new FormulariosServiceError("listarFormularios", error);
  return (data ?? []) as Formulario[];
}

/**
 * Devuelve un formulario por id con todas sus preguntas ordenadas.
 */
export async function obtenerFormularioPorId(
  id: string,
): Promise<FormularioConPreguntas | null> {
  const supabase = createServiceClient();

  const { data: formulario, error: errForm } = await supabase
    .from("formularios")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (errForm) {
    throw new FormulariosServiceError("obtenerFormularioPorId (form)", errForm);
  }
  if (!formulario) return null;

  const { data: preguntas, error: errPreg } = await supabase
    .from("preguntas")
    .select("*")
    .eq("formulario_id", id)
    .order("orden", { ascending: true });

  if (errPreg) {
    throw new FormulariosServiceError("obtenerFormularioPorId (preg)", errPreg);
  }

  return {
    ...(formulario as Formulario),
    preguntas: (preguntas ?? []) as Pregunta[],
  };
}

/**
 * Devuelve un formulario público por slug. SOLO si está `activo = true`.
 * Devuelve `null` si no existe, está inactivo o el slug es inválido.
 */
export async function obtenerFormularioPublicoPorSlug(
  slug: string,
): Promise<FormularioConPreguntas | null> {
  const supabase = createServiceClient();

  const { data: formulario, error: errForm } = await supabase
    .from("formularios")
    .select("id, slug, titulo, descripcion, activo, created_at, updated_at")
    .eq("slug", slug)
    .eq("activo", true)
    .maybeSingle();

  if (errForm) {
    throw new FormulariosServiceError(
      "obtenerFormularioPublicoPorSlug (form)",
      errForm,
    );
  }
  if (!formulario) return null;

  const { data: preguntas, error: errPreg } = await supabase
    .from("preguntas")
    .select("*")
    .eq("formulario_id", formulario.id)
    .order("orden", { ascending: true });

  if (errPreg) {
    throw new FormulariosServiceError(
      "obtenerFormularioPublicoPorSlug (preg)",
      errPreg,
    );
  }

  return {
    ...(formulario as Formulario),
    preguntas: (preguntas ?? []) as Pregunta[],
  };
}

/**
 * Crea un formulario (inactivo) con sus preguntas en bloque.
 * Devuelve el id y slug del formulario creado.
 */
export async function crearFormulario(
  input: FormularioCreateInput,
): Promise<{ id: string; slug: string }> {
  const supabase = createServiceClient();

  const { data: formulario, error: errInsert } = await supabase
    .from("formularios")
    .insert({
      slug: input.slug,
      titulo: input.titulo,
      descripcion: input.descripcion ?? null,
      activo: false,
    })
    .select("id, slug")
    .single();

  if (errInsert || !formulario) {
    throw new FormulariosServiceError("crearFormulario (insert)", errInsert);
  }

  const preguntasInsert: PreguntaInsert[] = input.preguntas.map(
    (p: PreguntaInput, index) => ({
      formulario_id: formulario.id,
      orden: index,
      tipo: p.tipo,
      contenido: p.contenido,
      opciones: p.tipo === "opcion_multiple" ? p.opciones : null,
      requerido: p.requerido,
    }),
  );

  const { error: errPreguntas } = await supabase
    .from("preguntas")
    .insert(preguntasInsert);

  if (errPreguntas) {
    // Si fallan las preguntas, intentamos limpiar el formulario creado.
    await supabase.from("formularios").delete().eq("id", formulario.id);
    throw new FormulariosServiceError(
      "crearFormulario (preguntas)",
      errPreguntas,
    );
  }

  return { id: formulario.id, slug: formulario.slug };
}

/**
 * Actualiza un formulario y reemplaza TODAS sus preguntas.
 *
 * Estrategia: UPDATE el `formulario`, luego DELETE todas las preguntas
 * existentes, y finalmente INSERT las nuevas. Si falla el INSERT, se
 * propaga el error y el formulario queda sin preguntas (rollback manual
 * sería complejo sin una transacción DDL).
 *
 * Devuelve `{ id }` para mantener la simetría con `crearFormulario` y el
 * contrato que esperan las Server Actions de Fase 3.
 */
export async function actualizarFormulario(
  input: FormularioUpdateInput,
): Promise<{ id: string }> {
  const supabase = createServiceClient();

  const { error: errUpdate } = await supabase
    .from("formularios")
    .update({
      slug: input.slug,
      titulo: input.titulo,
      descripcion: input.descripcion ?? null,
    })
    .eq("id", input.id);

  if (errUpdate) {
    throw new FormulariosServiceError("actualizarFormulario (update)", errUpdate);
  }

  // Reemplazo total de preguntas.
  const { error: errDelete } = await supabase
    .from("preguntas")
    .delete()
    .eq("formulario_id", input.id);

  if (errDelete) {
    throw new FormulariosServiceError(
      "actualizarFormulario (delete)",
      errDelete,
    );
  }

  const preguntasInsert: PreguntaInsert[] = input.preguntas.map(
    (p: PreguntaInput, index) => ({
      formulario_id: input.id,
      orden: index,
      tipo: p.tipo,
      contenido: p.contenido,
      opciones: p.tipo === "opcion_multiple" ? p.opciones : null,
      requerido: p.requerido,
    }),
  );

  if (preguntasInsert.length > 0) {
    const { error: errInsert } = await supabase
      .from("preguntas")
      .insert(preguntasInsert);

    if (errInsert) {
      throw new FormulariosServiceError(
        "actualizarFormulario (insert preguntas)",
        errInsert,
      );
    }
  }

  return { id: input.id };
}

/** Elimina un formulario (cascade borra preguntas). */
export async function eliminarFormulario(id: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("formularios").delete().eq("id", id);
  if (error) throw new FormulariosServiceError("eliminarFormulario", error);
}

/** Activa o desactiva un formulario. */
export async function toggleActivo(
  id: string,
  activo: boolean,
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("formularios")
    .update({ activo })
    .eq("id", id);
  if (error) throw new FormulariosServiceError("toggleActivo", error);
}

/**
 * Helper para Server Actions: cuenta cuántas preguntas tiene cada
 * formulario con una sola query.
 */
export async function contarPreguntasPorFormulario(
  ids: string[],
): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("preguntas")
    .select("formulario_id")
    .in("formulario_id", ids);

  if (error) {
    throw new FormulariosServiceError("contarPreguntasPorFormulario", error);
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const fid = (row as { formulario_id: string }).formulario_id;
    counts[fid] = (counts[fid] ?? 0) + 1;
  }
  return counts;
}

// Re-exports para tipos compartidos.
export type {
  Formulario,
  FormularioConPreguntas,
  Pregunta,
  TipoPregunta,
};