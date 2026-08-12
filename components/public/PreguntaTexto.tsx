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
const EMAIL_MAX_LENGTH = 254; // RFC 5321

/**
 * Pregunta de texto libre.
 *
 * Renderiza un <textarea> (no <input>) para permitir respuestas largas.
 * El contador avisa al usuario cuando se acerca al límite.
 *
 * Si la pregunta contiene la palabra "correo" (pregunta automática de email
 * añadida por el service), se aplica `inputMode="email"` y se limita a
 * 254 caracteres (RFC 5321). La validación final del formato se hace en
 * backend; aquí solo se mejora la UX móvil.
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
  const esEmail = esPreguntaEmail(pregunta);
  const maxLength = esEmail ? EMAIL_MAX_LENGTH : MAX_LENGTH;
  const cercaDelLimite = current.length > maxLength * 0.9;

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    let value = e.target.value;
    // En emails, limitamos a 254 chars (RFC 5321) — la validación final
    // de formato la hace el backend.
    if (esEmail && value.length > EMAIL_MAX_LENGTH) {
      value = value.slice(0, EMAIL_MAX_LENGTH);
    }
    onChange(value);
  }

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
        onChange={handleChange}
        disabled={disabled}
        required={pregunta.requerido}
        maxLength={maxLength}
        inputMode={esEmail ? "email" : undefined}
        autoComplete={esEmail ? "email" : undefined}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={cn(error ? errorId : undefined, contadorId)}
        placeholder={
          esEmail ? "tu@correo.com" : "Escribe tu respuesta aquí…"
        }
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
          {current.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}

/**
 * Detecta si la pregunta es la automática de email (orden 1, contiene
 * "correo" en el contenido). Robusto a mayúsculas y acentos.
 *
 * No usamos el flag `esAutomatica` del dominio porque este componente
 * también se reutiliza para formularios legacy sin flag; la heurística
 * basada en el contenido cubre ambos casos.
 */
function esPreguntaEmail(pregunta: Pregunta): boolean {
  if (pregunta.tipo !== "texto_libre") return false;
  const texto = pregunta.contenido.toLowerCase().normalize("NFD");
  const sinAcentos = texto.replace(/[̀-ͯ]/g, "");
  return sinAcentos.includes("correo");
}