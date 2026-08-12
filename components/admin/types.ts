import type { PreguntaDraft } from "@/types/formulario";

/**
 * Tipos auxiliares compartidos por el árbol de componentes del builder.
 *
 * Se mantienen en `components/admin/` porque son detalles de implementación
 * de la UI (no parte del dominio de BD). El dominio vive en
 * `types/formulario.ts`.
 */

export type { PreguntaDraft } from "@/types/formulario";

/**
 * Estado de envío del formulario principal.
 * `idle` → editable. `submitting` → bloqueado, botón con spinner. `success` →
 * mostrada brevemente (toast inline) tras guardar. `error` → mensaje visible.
 */
export type SubmitState = "idle" | "submitting" | "success" | "error";

/**
 * Estructura que recibe el builder cuando está en modo "edit".
 * Coincide con `FormularioConPreguntas` del dominio salvo por el helper
 * de opcionalidad del id (que aún no existe al crear).
 */
export interface FormularioBuilderInitialData {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  activo: boolean;
  preguntas: Array<{
    id: string;
    formulario_id: string;
    orden: number;
    tipo: PreguntaDraft["tipo"];
    contenido: string;
    opciones: string[] | null;
    requerido: boolean;
  }>;
}

/**
 * Error de validación cliente. Se adjunta al campo correspondiente y a un
 * resumen general del builder.
 */
export interface ClientValidationError {
  field?: "titulo" | "slug" | "preguntas" | "general";
  message: string;
}
