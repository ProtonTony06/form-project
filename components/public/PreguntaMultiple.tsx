"use client";

import { AlertCircle } from "lucide-react";
import type { Pregunta } from "@/types/formulario";
import { cn } from "@/lib/utils";

interface Props {
  pregunta: Pregunta;
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Pregunta de opción múltiple.
 *
 * Renderiza un radio group accesible. Cada opción es un <label> que
 * envuelve al <input type="radio"> para que toda la fila sea clickable.
 */
export function PreguntaMultiple({
  pregunta,
  value,
  onChange,
  error,
  disabled,
}: Props) {
  const fieldsetId = `pregunta-${pregunta.id}`;
  const errorId = `${fieldsetId}-error`;

  return (
    <fieldset
      className="space-y-3"
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? "true" : undefined}
    >
      <legend className="block text-sm font-medium text-slate-800 sm:text-base">
        {pregunta.contenido}
        {pregunta.requerido && (
          <span className="ml-1 text-red-500" aria-hidden>
            *
          </span>
        )}
        {pregunta.requerido && <span className="sr-only"> (obligatorio)</span>}
      </legend>

      <div className="space-y-2">
        {(pregunta.opciones ?? []).map((opcion) => {
          const optionId = `${fieldsetId}-${opcion}`;
          const checked = value === opcion;
          return (
            <label
              key={opcion}
              htmlFor={optionId}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition",
                checked
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white hover:bg-slate-50",
                error && "border-red-300 bg-red-50/40",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={fieldsetId}
                value={opcion}
                checked={checked}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="h-4 w-4 cursor-pointer border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                required={pregunta.requerido}
              />
              <span className="text-slate-700">{opcion}</span>
            </label>
          );
        })}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-xs text-red-600 sm:text-sm"
        >
          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
          {error}
        </p>
      )}
    </fieldset>
  );
}
