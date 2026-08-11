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
 */
export interface PreguntaDraft {
  id?: string; // presente al editar
  tipo: TipoPregunta;
  contenido: string;
  opciones: string[] | null;
  requerido: boolean;
}
