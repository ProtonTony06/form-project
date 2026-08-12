/**
 * Tipos de dominio de FormProject.
 * Independientes del esquema de BD para poder refactorizar sin tocar la UI.
 */

export type TipoPregunta = "opcion_multiple" | "texto_libre";

export interface Formulario {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pregunta {
  id: string;
  formulario_id: string;
  orden: number;
  tipo: TipoPregunta;
  contenido: string;
  opciones: string[] | null;
  requerido: boolean;
  created_at: string;
}

export interface FormularioConPreguntas extends Formulario {
  preguntas: Pregunta[];
}

/**
 * Tipo usado en el builder del admin (preguntas sin ID aún).
 * `esAutomatica` se usa solo en la capa de UI/servicio para bloquear
 * borrar las 2 preguntas automáticas que añade el service; no se persiste
 * (las automáticas se identifican por orden 0/1 en BD).
 */
export interface PreguntaDraft {
  id?: string; // presente al editar
  tipo: TipoPregunta;
  contenido: string;
  opciones: string[] | null;
  requerido: boolean;
  esAutomatica?: boolean;
}

// =============================================================================
// Respuestas (Fase 5 — pivot del MVP)
// =============================================================================

/** Cabecera de una respuesta (un envío). */
export interface Respuesta {
  id: string;
  formulario_id: string;
  ip: string | null;
  user_agent: string | null;
  submitted_at: string;
}

/** Detalle completo: cabecera + info del formulario + valores por pregunta. */
export interface RespuestaDetalle extends Respuesta {
  formulario: Pick<FormularioConPreguntas, "id" | "slug" | "titulo">;
  valores: Record<string, string>;
}
