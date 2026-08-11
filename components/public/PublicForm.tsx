"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import type { Pregunta } from "@/types/formulario";
import { cn } from "@/lib/utils";
import {
  submitBodySchema,
  validateRespuestasContraFormulario,
} from "@/lib/validators/submit";
import { PreguntaMultiple } from "./PreguntaMultiple";
import { PreguntaTexto } from "./PreguntaTexto";
import { SubmitButton, type EstadoSubmit } from "./SubmitButton";

interface Props {
  formulario: {
    id: string;
    slug: string;
    titulo: string;
    descripcion: string | null;
  };
  preguntas: Pregunta[];
}

/**
 * Formulario público renderizado en /f/[slug].
 *
 * - Estado: mapa respuestas por id de pregunta + estado de submit.
 * - Validación cliente con Zod antes de enviar.
 * - Submit MOCKEADO: en cuanto exista el endpoint POST /api/submit/{slug},
 *   sustituir el `simularSubmit` por un `fetch` real.
 * - En éxito: redirige a /f/{slug}/gracias?form={titulo}.
 */
export function PublicForm({ formulario, preguntas }: Props) {
  const router = useRouter();
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<EstadoSubmit>("idle");
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  // Refs a cada pregunta para hacer scroll al primer error.
  const preguntaRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const disabled = estado === "submitting";

  const handleChange = (preguntaId: string, value: string) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: value }));
    // Limpiamos el error del campo en cuanto el usuario lo modifica.
    setErrores((prev) => {
      if (!prev[preguntaId]) return prev;
      const next = { ...prev };
      delete next[preguntaId];
      return next;
    });
    setErrorGlobal(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorGlobal(null);

    // 1) Validación cliente contra el esquema del formulario concreto.
    const validacion = validateRespuestasContraFormulario(
      preguntas,
      respuestas,
    );

    if (!validacion.ok) {
      setErrores(validacion.errores);
      // Scroll al primer error.
      const firstErrorId = Object.keys(validacion.errores)[0];
      if (firstErrorId) {
        const ref = preguntaRefs.current[firstErrorId];
        ref?.scrollIntoView({ behavior: "smooth", block: "center" });
        // Enfocar el primer input de la pregunta con error.
        const focusable = ref?.querySelector<HTMLElement>(
          "input, textarea",
        );
        focusable?.focus({ preventScroll: true });
      }
      return;
    }

    setErrores({});
    setEstado("submitting");

    // 2) Validación con el schema Zod del body (defensa en profundidad).
    const parse = submitBodySchema.safeParse({ respuestas });
    if (!parse.success) {
      setEstado("error");
      setErrorGlobal(
        "Hay un problema con los datos enviados. Revisa los campos.",
      );
      return;
    }

    // 3) Submit real (mockeado por ahora).
    try {
      // TODO Fase 5: sustituir por fetch a /api/submit/{slug}.
      await simularSubmit();

      setEstado("success");
      // Pequeño delay para que el usuario vea el check antes de redirigir.
      window.setTimeout(() => {
        const params = new URLSearchParams({
          form: formulario.titulo,
        });
        router.push(`/f/${formulario.slug}/gracias?${params.toString()}`);
      }, 400);
    } catch (err) {
      setEstado("error");
      setErrorGlobal(
        err instanceof Error
          ? err.message
          : "No se pudo enviar el formulario. Inténtalo de nuevo.",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={`Formulario: ${formulario.titulo}`}
      className="space-y-8"
    >
      <div className="space-y-8">
        {preguntas.map((pregunta) => {
          const value = respuestas[pregunta.id];
          const error = errores[pregunta.id];
          return (
            <div
              key={pregunta.id}
              ref={(el) => {
                preguntaRefs.current[pregunta.id] = el;
              }}
              className={cn(
                "rounded-xl border p-4 transition sm:p-5",
                error
                  ? "border-red-200 bg-red-50/30"
                  : "border-slate-200 bg-white",
              )}
            >
              {pregunta.tipo === "opcion_multiple" ? (
                <PreguntaMultiple
                  pregunta={pregunta}
                  value={value}
                  onChange={(v) => handleChange(pregunta.id, v)}
                  error={error}
                  disabled={disabled}
                />
              ) : (
                <PreguntaTexto
                  pregunta={pregunta}
                  value={value}
                  onChange={(v) => handleChange(pregunta.id, v)}
                  error={error}
                  disabled={disabled}
                />
              )}
            </div>
          );
        })}
      </div>

      {errorGlobal && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{errorGlobal}</p>
        </div>
      )}

      <div className="pt-2">
        <SubmitButton estado={estado} />
        <p className="mt-3 text-center text-xs text-slate-400">
          Tus respuestas se enviarán al creador del formulario.
        </p>
      </div>
    </form>
  );
}

/**
 * Simula el POST al endpoint de submit.
 *
 * - 800ms de latencia.
 * - 90% éxito, 10% error aleatorio (para que se vea el estado de error
 *   en pruebas manuales sin necesidad de tocar el código).
 *
 * En Fase 5 se reemplaza por:
 *   const res = await fetch(`/api/submit/${slug}`, {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ respuestas }),
 *   });
 *   if (!res.ok) throw new Error("...");
 */
function simularSubmit(): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.9) {
        resolve();
      } else {
        reject(new Error("Error de red simulado. Inténtalo de nuevo."));
      }
    }, 800);
  });
}
