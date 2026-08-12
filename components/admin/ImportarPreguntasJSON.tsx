"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  preguntasImportSchema,
  type PreguntaImportItem,
} from "@/lib/validators/formulario";
import type { PreguntaDraft } from "@/types/formulario";

interface ImportarPreguntasJSONProps {
  /**
   * Preguntas que ya están en el builder. Se usa para calcular
   * cuántas se pueden añadir respetando el máximo.
   */
  existingCount: number;
  /**
   * Máximo total de preguntas permitidas en un formulario
   * (constante del builder). Si el JSON trae más de las que caben,
   * sólo se importan las que quepan y se avisa.
   */
  maxPreguntas: number;
  /**
   * Callback invocado con las preguntas parseadas y validadas.
   * El padre decide si las concatena al final de su array o las
   * descarta (típicamente concatena).
   */
  onImport: (preguntas: PreguntaImportItem[]) => void;
  /**
   * Si está disabled (típicamente durante el submit).
   */
  disabled?: boolean;
}

/**
 * Bloque para importar preguntas desde JSON dentro del builder.
 *
 * Formato esperado:
 * {
 *   "preguntas": [
 *     { "tipo": "opcion_multiple", "contenido": "...", "opciones": ["A","B"], "requerido": true },
 *     { "tipo": "texto_libre",     "contenido": "...", "opciones": null,    "requerido": false }
 *   ]
 * }
 *
 * Las preguntas automáticas (Nombre/Email) NO se incluyen: el
 * servicio las añade siempre por su cuenta.
 *
 * Comportamiento:
 *   - Si el JSON parsea y Zod valida: se llama `onImport` con las
 *     preguntas y se limpia el textarea.
 *   - Si no parsea: se muestra un error con el detalle de Zod.
 *   - Si parsea pero excede el máximo: se importan las que caben y
 *     se avisa de cuántas se descartaron.
 *   - Si el JSON está vacío: se ignora sin error.
 */
export function ImportarPreguntasJSON({
  existingCount,
  maxPreguntas,
  onImport,
  disabled = false,
}: ImportarPreguntasJSONProps) {
  const [texto, setTexto] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const textareaId = React.useId();

  const espacioDisponible = Math.max(0, maxPreguntas - existingCount);

  function handleImport() {
    setError(null);
    setInfo(null);

    const trimmed = texto.trim();
    if (!trimmed) {
      setError("Pega el JSON antes de importar.");
      return;
    }

    // 1) Parse JSON.
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`JSON inválido: ${msg}`);
      return;
    }

    // 2) Validar con Zod.
    const result = preguntasImportSchema.safeParse(parsed);
    if (!result.success) {
      const first = result.error.issues[0];
      const path = first.path.length ? first.path.join(".") + ": " : "";
      setError(`${path}${first.message}`);
      return;
    }

    const incoming = result.data.preguntas;

    // 3) Limitar al espacio disponible y avisar si se descartan.
    let aImportar = incoming;
    let descartadas = 0;
    if (incoming.length > espacioDisponible) {
      aImportar = incoming.slice(0, espacioDisponible);
      descartadas = incoming.length - espacioDisponible;
    }

    onImport(aImportar);

    // 4) Limpieza y feedback.
    setTexto("");
    if (descartadas > 0) {
      setInfo(
        `Importadas ${aImportar.length} preguntas. ${descartadas} se descartaron por exceder el máximo de ${maxPreguntas}.`,
      );
    } else {
      setInfo(
        `Importadas ${aImportar.length} ${aImportar.length === 1 ? "pregunta" : "preguntas"}.`,
      );
    }
  }

  function handleClear() {
    setTexto("");
    setError(null);
    setInfo(null);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-2">
        <FileJson
          className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
          aria-hidden="true"
        />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900">
            Importar preguntas desde JSON
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Pega aquí el JSON con tus preguntas. Las preguntas automáticas
            (nombre y email) se añaden solas, no las pongas aquí.
          </p>

          <details className="mt-2 text-xs text-slate-600">
            <summary className="cursor-pointer select-none font-medium text-slate-700 hover:text-slate-900">
              Ver estructura esperada
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-700">
{`{
  "preguntas": [
    {
      "tipo": "opcion_multiple",
      "contenido": "¿Cuál es tu color favorito?",
      "opciones": ["Rojo", "Verde", "Azul"],
      "requerido": true
    },
    {
      "tipo": "texto_libre",
      "contenido": "¿Algún comentario adicional?",
      "opciones": null,
      "requerido": false
    }
  ]
}`}
            </pre>
          </details>

          <label htmlFor={textareaId} className="sr-only">
            JSON con las preguntas a importar
          </label>
          <textarea
            id={textareaId}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setError(null);
              setInfo(null);
            }}
            disabled={disabled}
            rows={6}
            placeholder='{ "preguntas": [ ... ] }'
            spellCheck={false}
            className={cn(
              "mt-3 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 shadow-sm",
              "placeholder:text-slate-400",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:border-slate-900",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "resize-y",
              error && "border-red-500 focus-visible:ring-red-600",
            )}
          />

          {error && (
            <p
              role="alert"
              className="mt-2 flex items-start gap-1.5 text-xs text-red-600"
            >
              <AlertCircle
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>{error}</span>
            </p>
          )}

          {info && !error && (
            <p
              role="status"
              className="mt-2 flex items-start gap-1.5 text-xs text-emerald-700"
            >
              <CheckCircle2
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>{info}</span>
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleImport}
              disabled={disabled || !texto.trim() || espacioDisponible === 0}
            >
              Importar preguntas
            </Button>
            {(texto || error || info) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={disabled}
              >
                Limpiar
              </Button>
            )}
            <span className="ml-auto text-xs text-slate-500">
              Espacio disponible: {espacioDisponible} / {maxPreguntas}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
