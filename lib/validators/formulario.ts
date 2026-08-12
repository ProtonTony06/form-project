/**
 * Validadores Zod para formularios y preguntas (capa de transporte).
 *
 * Las reglas de formato y longitudes deben alinearse con las CHECK constraints
 * de la BD (ver `supabase/migrations/20260811120000_init.sql`). Si cambias
 * los límites aquí, cámbialos allí también.
 */
import { z } from "zod";

/** Regex oficial del slug (misma que en BD y en `lib/slug.ts`). */
export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

/**
 * Pregunta discriminada por `tipo`:
 *   - `opcion_multiple` → `opciones` es array de strings (2..20, cada uno 1..200).
 *   - `texto_libre`     → `opciones` debe ser `null`.
 *
 * `esAutomatica` (opcional) marca las preguntas que el servicio inyecta en
 * todo formulario creado (nombre + email). NO modifica reglas de
 * validación: la lógica de read-only/no-borrable vive en la UI
 * (`PreguntaEditor` las marca como bloqueadas). El servicio se ocupa de
 * añadirlas/preservarlas.
 *
 * Usar `discriminatedUnion` permite que Zod aplique reglas distintas en cada
 * rama en tiempo de validación (y de tipos).
 */
export const preguntaSchema = z.discriminatedUnion("tipo", [
  z.object({
    id: z.string().uuid().optional(),
    tipo: z.literal("opcion_multiple"),
    contenido: z
      .string()
      .min(1, "La pregunta no puede estar vacía.")
      .max(500),
    opciones: z
      .array(
        z
          .string()
          .min(1, "Las opciones no pueden estar vacías.")
          .max(200),
      )
      .min(2, "Añade al menos 2 opciones.")
      .max(20, "Máximo 20 opciones."),
    requerido: z.boolean(),
    esAutomatica: z.boolean().optional(),
  }),
  z.object({
    id: z.string().uuid().optional(),
    tipo: z.literal("texto_libre"),
    contenido: z
      .string()
      .min(1, "La pregunta no puede estar vacía.")
      .max(500),
    opciones: z.null(),
    requerido: z.boolean(),
    esAutomatica: z.boolean().optional(),
  }),
]);

/** Esquema completo de creación. */
export const formularioCreateSchema = z.object({
  titulo: z
    .string()
    .min(1, "El título es obligatorio.")
    .max(200, "Máximo 200 caracteres."),
  descripcion: z
    .string()
    .max(1000, "Máximo 1000 caracteres.")
    .optional()
    .nullable(),
  slug: z
    .string()
    .min(1, "El slug es obligatorio.")
    .max(40)
    .regex(SLUG_REGEX, "Slug inválido (kebab-case, 1-40 chars)."),
  preguntas: z
    .array(preguntaSchema)
    .min(1, "Añade al menos una pregunta.")
    .max(50, "Máximo 50 preguntas por formulario."),
});

/** Esquema de actualización (incluye id del formulario). */
export const formularioUpdateSchema = formularioCreateSchema.extend({
  id: z.string().uuid(),
});

export type PreguntaInput = z.infer<typeof preguntaSchema>;
export type FormularioCreateInput = z.infer<typeof formularioCreateSchema>;
export type FormularioUpdateInput = z.infer<typeof formularioUpdateSchema>;