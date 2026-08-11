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

const MAX_LENGTH = 5000;

/**
 * Pregunta de texto libre.
 *
 * Renderiza un <textarea> (no <input>) para permitir respuestas largas.
 * El contador avisa al usuario cuando se acerca al límite.
 */
export function PreguntaTexto({
  pregunta,
  value,
  onChange,
  error,
  disabled,
}: Props) {
  const inputId = `pregunta-${pregunta.id}`;
  const errorId = `${inputId}-error`;
  const contadorId = `${inputId}-contador`;
  const current = value ?? "";
  const cercaDelLimite = current.length > MAX_LENGTH * 0.9;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-800 sm:text-base"
      >
        {pregunta.contenido}
        {pregunta.requerido && (
          <span className="ml-1 text-red-500" aria-hidden>
            *
          </span>
        )}
        {pregunta.requerido && <span className="sr-only"> (obligatorio)</span>}
      </label>

      <textarea
        id={inputId}
        name={inputId}
        rows={4}
        value={current}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={pregunta.requerido}
        maxLength={MAX_LENGTH}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={cn(error ? errorId : undefined, contadorId)}
        placeholder="Escribe tu respuesta aquí…"
        className={cn(
          "block w-full resize-y rounded-lg border bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-base",
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-300"
            : "border-slate-200 focus:border-slate-400 focus:ring-slate-300",
          disabled && "cursor-not-allowed opacity-60",
        )}
      />

      <div className="flex items-start justify-between gap-3 text-xs">
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-red-600"
          >
            <AlertCircle className="h-3.5 w-3.5" aria-hidden />
            {error}
          </p>
        ) : (
          <span aria-hidden className="text-slate-400">
            &nbsp;
          </span>
        )}
        <span
          id={contadorId}
          className={cn(
            "shrink-0 tabular-nums",
            cercaDelLimite ? "text-amber-600" : "text-slate-400",
          )}
        >
          {current.length} / {MAX_LENGTH}
        </span>
      </div>
    </div>
  );
}
