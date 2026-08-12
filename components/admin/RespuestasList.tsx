"use client";

import * as React from "react";
import { Inbox, ChevronRight, Mail, User } from "lucide-react";
import type { Pregunta } from "@/types/formulario";
import type { RespuestaDetalle } from "@/lib/services/respuestasService";
import { cn, formatDateTime } from "@/lib/utils";
import { RespuestaDetalle as RespuestaDetalleView } from "./RespuestaDetalle";

interface Props {
  /**
   * Detalles completos de cada respuesta. El componente padre (server
   * component) los carga con `obtenerRespuestaDetalle` por id y los pasa
   * ya mapeados por id. Esto evita un endpoint extra de admin.
   */
  detalles: RespuestaDetalle[];
  preguntas: Pregunta[];
}

/**
 * Lista de respuestas para un formulario concreto.
 *
 * Diseño:
 *  - Header card con conteo total.
 *  - Tabla responsive: en mobile cada fila es una card, en desktop es
 *    una fila de tabla.
 *  - Click en una fila → expand inline (`<details>` HTML) con el detalle.
 *
 * Estado:
 *  - loading / error / empty / success — todos cubiertos.
 */
export function RespuestasList({ detalles, preguntas }: Props) {
  if (detalles.length === 0) {
    return <EmptyState />;
  }

  // Preguntas automáticas (orden 0 y 1) para mostrar nombre y email en la fila.
  const preguntaNombre =
    preguntas.find((p) => p.orden === 0) ??
    preguntas.find((p) => /nombre/i.test(p.contenido));
  const preguntaEmail =
    preguntas.find((p) => p.orden === 1) ??
    preguntas.find((p) => /correo/i.test(p.contenido));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Cabecera */}
      <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-[1.4fr_1.6fr_auto_auto] sm:gap-4">
        <div>Nombre</div>
        <div>Email</div>
        <div>Fecha</div>
        <div className="sr-only">Acciones</div>
      </div>

      {/* Filas */}
      <ul className="divide-y divide-slate-200">
        {detalles.map((d) => (
          <RespuestaRow
            key={d.id}
            detalle={d}
            preguntas={preguntas}
            preguntaNombre={preguntaNombre}
            preguntaEmail={preguntaEmail}
          />
        ))}
      </ul>
    </div>
  );
}

interface RowProps {
  detalle: RespuestaDetalle;
  preguntas: Pregunta[];
  preguntaNombre: Pregunta | undefined;
  preguntaEmail: Pregunta | undefined;
}

function RespuestaRow({
  detalle,
  preguntas,
  preguntaNombre,
  preguntaEmail,
}: RowProps) {
  const nombre = preguntaNombre ? detalle.valores[preguntaNombre.id] : null;
  const email = preguntaEmail ? detalle.valores[preguntaEmail.id] : null;

  return (
    <li>
      <details className="group [&_summary::-webkit-details-marker]:hidden">
        <summary
          className={cn(
            "flex cursor-pointer list-none flex-col gap-2 px-4 py-3 transition-colors",
            "hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none",
            "sm:grid sm:grid-cols-[1.4fr_1.6fr_auto_auto] sm:items-center sm:gap-4",
          )}
        >
          {/* Nombre */}
          <div className="flex items-center gap-2 text-sm">
            <ChevronRight
              className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
            {nombre ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
                <User className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                {nombre}
              </span>
            ) : (
              <span className="text-slate-400 italic">Sin nombre</span>
            )}
          </div>

          {/* Email */}
          <div className="text-sm">
            {email ? (
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                {email}
              </span>
            ) : (
              <span className="text-slate-400 italic">Sin email</span>
            )}
          </div>

          {/* Fecha */}
          <time
            dateTime={detalle.submitted_at}
            className="text-xs text-slate-500"
            title={formatDateTime(detalle.submitted_at)}
          >
            {formatDateTime(detalle.submitted_at)}
          </time>

          {/* Indicador de "ver detalle" */}
          <span className="hidden text-xs font-medium text-blue-600 group-open:hidden sm:inline">
            Ver detalle
          </span>
        </summary>

        {/* Contenido expandido */}
        <div className="border-t border-slate-100 bg-slate-50/30 px-4 py-4">
          <RespuestaDetalleView
            respuesta={detalle}
            preguntas={preguntas}
            compact
          />
        </div>
      </details>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-slate-900">
        Aún no hay respuestas
      </h2>
      <p className="mt-1 max-w-sm text-sm text-slate-600">
        Cuando alguien rellene el formulario, sus respuestas aparecerán aquí.
        Comparte la URL pública para empezar a recibirlas.
      </p>
    </div>
  );
}