import { z } from "zod";
import type { Pregunta } from "@/types/formulario";

/**
 * Esquema del body que enviará el cliente al endpoint POST /api/submit/{slug}.
 *
 * Valida la estructura superficial del payload: mapa `id_pregunta → string`
 * con longitud 1..5000 caracteres.
 *
 * NOTA: la validación de reglas de negocio (requerido, opciones válidas,
 * formato email) se hace con `validateRespuestasContraFormulario` justo
 * después, contra el esquema concreto del formulario que se rellena.
 */
export const submitBodySchema = z.object({
  respuestas: z.record(z.string().uuid(), z.string().min(1).max(5000)),
});

export type SubmitBody = z.infer<typeof submitBodySchema>;

/**
 * Constantes de validación alineadas con la BD.
 */
const MAX_TEXT_LENGTH = 5000;

/**
 * Regex email "razonable" — no es RFC-compliant, pero cubre el 99% de
 * casos legítimos (algo@servidor.tld). Se usa SOLO para detectar errores
 * tipográficos básicos en la pregunta automática de email.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Identifica la pregunta automática de email por su contenido (orden 1
 * tras el pivot). Si en el futuro se quiere desacoplar del contenido
 * textual, se puede añadir un flag `esAutomatica` a la tabla `preguntas`.
 */
function esPreguntaAutomaticaEmail(p: Pregunta): boolean {
  return (
    p.tipo === "texto_libre" &&
    p.contenido.toLowerCase().includes("correo")
  );
}

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
 * requisitos del formulario (campos requeridos, opciones válidas,
 * longitudes y formato email en la pregunta automática de correo).
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

      // Validación de email SOLO para la pregunta automática de correo.
      if (esPreguntaAutomaticaEmail(pregunta) && !EMAIL_REGEX.test(valor)) {
        errores[pregunta.id] = "Email no válido";
      }
    }
  }

  return { ok: Object.keys(errores).length === 0, errores };
}
