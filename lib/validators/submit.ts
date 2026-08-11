import { z } from "zod";
import type { Pregunta } from "@/types/formulario";

/**
 * Esquema del body que enviará el cliente al endpoint POST /api/submit/{slug}.
 * Valida estructura superficial: mapa de respuestas con clave = id de pregunta
 * y valor = string con longitud 1..5000.
 */
export const submitBodySchema = z.object({
  respuestas: z.record(z.string(), z.string().min(1).max(5000)),
});

export type SubmitBody = z.infer<typeof submitBodySchema>;

/**
 * Constantes de validación alineadas con la BD.
 */
const MAX_TEXT_LENGTH = 5000;

/**
 * Resultado de validar las respuestas de un submit contra el esquema
 * concreto del formulario que se está rellenando.
 */
export interface ValidationResult {
  ok: boolean;
  errores: Record<string, string>;
}

/**
 * Valida que el `Record<id_pregunta, string>` de respuestas cumple los
 * requisitos del formulario (campos requeridos, opciones válidas y longitudes).
 *
 * Devuelve un mapa `id_pregunta -> mensaje` solo con los campos que fallan.
 */
export function validateRespuestasContraFormulario(
  preguntas: Pregunta[],
  respuestas: Record<string, string>,
): ValidationResult {
  const errores: Record<string, string> = {};

  for (const pregunta of preguntas) {
    const valor = respuestas[pregunta.id];
    const presente = typeof valor === "string" && valor.trim().length > 0;

    if (pregunta.requerido && !presente) {
      errores[pregunta.id] = "Este campo es obligatorio";
      continue;
    }

    if (!presente) {
      continue;
    }

    // Longitud máxima (texto y multiple en formato string).
    if (valor.length > MAX_TEXT_LENGTH) {
      errores[pregunta.id] = `La respuesta no puede superar los ${MAX_TEXT_LENGTH} caracteres`;
      continue;
    }

    // Validación específica por tipo.
    if (pregunta.tipo === "opcion_multiple") {
      const opciones = pregunta.opciones ?? [];
      if (!opciones.includes(valor)) {
        errores[pregunta.id] = "La opción seleccionada no es válida";
      }
    } else if (pregunta.tipo === "texto_libre") {
      if (valor.trim().length < 1) {
        errores[pregunta.id] = "La respuesta no puede estar vacía";
      }
    }
  }

  return { ok: Object.keys(errores).length === 0, errores };
}
