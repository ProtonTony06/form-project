/**
 * ════════════════════════════════════════════════════════════════════════════
 *  STUB TEMPORAL — Lo reemplaza el agente de Fase 1 con la versión real.
 * ════════════════════════════════════════════════════════════════════════════
 *  ESTE ARCHIVO ES UN PLACEHOLDER. El agente de Fase 1 está construyendo
 *  la versión real de los validadores en paralelo. Si encuentras este
 *  stub en disco, **sobreescríbelo** con la implementación real.
 *
 *  Estas definiciones son las **mínimas** que la UI de Fase 3
 *  (`app/(admin)/admin/actions.ts`) necesita para tipar correctamente las
 *  llamadas a Server Actions.
 *
 *  Contrato esperado para la versión final:
 *   - `preguntaSchema`: valida { tipo, contenido, opciones?, requerido }
 *   - `formularioCreateSchema`: valida { titulo, descripcion?, slug, preguntas[] }
 *   - `formularioUpdateSchema`: valida { id, titulo, descripcion?, slug, preguntas[] }
 *   - Tipos exportados: `FormularioCreateInput`, `FormularioUpdateInput`
 * ════════════════════════════════════════════════════════════════════════════
 */

import { z } from "zod";

const slugRegex = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

export const preguntaSchema = z.object({
  id: z.string().optional(),
  tipo: z.enum(["opcion_multiple", "texto_libre"]),
  contenido: z.string().min(1, "La pregunta no puede estar vacía.").max(500),
  opciones: z.array(z.string().min(1).max(200)).nullable(),
  requerido: z.boolean(),
});

export const formularioCreateSchema = z.object({
  titulo: z.string().min(1, "El título es obligatorio.").max(200),
  descripcion: z.string().max(1000).nullable(),
  slug: z
    .string()
    .min(1, "El slug es obligatorio.")
    .max(40)
    .regex(slugRegex, "Slug inválido (solo minúsculas, números y guiones)."),
  preguntas: z
    .array(preguntaSchema)
    .min(1, "Añade al menos una pregunta.")
    .max(50),
});

export const formularioUpdateSchema = formularioCreateSchema.extend({
  id: z.string().min(1),
});

// Inputs ya desenvueltos para que el servicio los pueda tipar.
export type FormularioCreateInput = z.infer<typeof formularioCreateSchema>;
export type FormularioUpdateInput = z.infer<typeof formularioUpdateSchema>;
