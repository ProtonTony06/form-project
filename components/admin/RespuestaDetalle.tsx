"use client";

import * as React from "react";
import { Calendar, Globe, Hash, Mail, User } from "lucide-react";
import type { Pregunta } from "@/types/formulario";
import type { RespuestaDetalle } from "@/lib/services/respuestasService";
import { cn, formatDateTime } from "@/lib/utils";

interface Props {
  respuesta: RespuestaDetalle;
  preguntas: Pregunta[];
  /**
   * Si `true`, renderiza en formato más compacto (pensado para un
   * `<details>` abierto). Si `false` (default), formato expandido con
   * cabecera destacada.
   */
  compact?: boolean;
}

/**
 * Detalle de una respuesta: cabecera (nombre + email destacados) + lista
 * de valores por pregunta + metadata (IP, user-agent, fecha).
 *
 * Es server-component-friendly en el sentido de que solo recibe datos
 * ya cargados; no hace fetch. Usa este componente desde
 * `RespuestasList.tsx` o directamente desde una página de detalle.
 */
export function RespuestaDetalle({
  respuesta,
  preguntas,
  compact = false,
}: Props) {
  // Buscamos las preguntas "automáticas" (orden 0 → nombre, orden 1 → email)
  // para destacarlas arriba. Si no se encuentran por orden, hacemos fallback
  // a "preguntas que parezcan nombre/email" por contenido.
  const preguntaNombre =
    preguntas.find((p) => p.orden === 0) ??
    preguntas.find((p) => /nombre/i.test(p.contenido));
  const preguntaEmail =
    preguntas.find((p) => p.orden === 1) ??
    preguntas.find((p) => /correo/i.test(p.contenido));

  const nombre = preguntaNombre ? respuesta.valores[preguntaNombre.id] : null;
  const email = preguntaEmail ? respuesta.valores[preguntaEmail.id] : null;

  // Resto de preguntas (excluyendo las automáticas ya destacadas).
  const restoPreguntas = preguntas.filter(
    (p) => p.id !== preguntaNombre?.id && p.id !== preguntaEmail?.id,
  );

  return (
    <div
      className={cn(
        "rounded-lg border bg-slate-50/40",
        compact ? "border-slate-200 p-4" : "border-slate-200 p-5",
      )}
    >
      {/* Cabecera: nombre + email */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {nombre && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              {nombre}
            </span>
          )}
          {email && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              {email}
            </span>
          )}
          {!nombre && !email && (
            <span className="text-sm text-slate-500">
              Respuesta sin nombre ni email
            </span>
          )}
        </div>
        <time
          dateTime={respuesta.submitted_at}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500"
          title={formatDateTime(respuesta.submitted_at)}
        >
          <Calendar className="h-3 w-3" aria-hidden="true" />
          {formatDateTime(respuesta.submitted_at)}
        </time>
      </header>

      {/* Cuerpo: resto de preguntas */}
      {restoPreguntas.length > 0 && (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {restoPreguntas.map((p) => {
            const valor = respuesta.valores[p.id];
            if (!valor) {
              return (
                <div key={p.id} className="rounded-md bg-white p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {p.contenido}
                  </dt>
                  <dd className="mt-1 text-sm italic text-slate-400">
                    Sin respuesta
                  </dd>
                </div>
              );
            }
            return (
              <div key={p.id} className="rounded-md bg-white p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {p.contenido}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">
                  {valor}
                </dd>
              </div>
            );
          })}
        </dl>
      )}

      {/* Metadata */}
      {!compact && (
        <footer className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Hash className="h-3 w-3" aria-hidden="true" />
            <span className="font-mono">{respuesta.id.slice(0, 8)}</span>
          </span>
          {respuesta.ip && (
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3 w-3" aria-hidden="true" />
              {respuesta.ip}
            </span>
          )}
        </footer>
      )}
    </div>
  );
}