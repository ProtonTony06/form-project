"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ListChecks,
  Trash2,
  Type,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PreguntaDraft } from "@/types/formulario";

interface PreguntaEditorProps {
  pregunta: PreguntaDraft;
  index: number;
  total: number;
  onChange: (p: PreguntaDraft) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const TIPO_LABEL: Record<PreguntaDraft["tipo"], string> = {
  opcion_multiple: "Opción múltiple",
  texto_libre: "Texto libre",
};

/**
 * Tarjeta editable para una pregunta dentro del FormularioBuilder.
 *
 * Responsabilidades:
 *  - Editar contenido y opciones de la pregunta.
 *  - Cambiar tipo (con reset de opciones si deja de ser múltiple).
 *  - Reordenar (↑↓) y eliminar.
 *  - Marcar como requerida.
 *
 * Lógica de validación de mínimos (≥2 opciones no vacías en múltiple) la
 * gestiona el builder padre; aquí sólo marca el estado visual.
 */
export function PreguntaEditor({
  pregunta,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: PreguntaEditorProps) {
  const isMultiple = pregunta.tipo === "opcion_multiple";
  const opciones = pregunta.opciones ?? [];
  const opcionesValidas = opciones.map((o) => o.trim()).filter(Boolean);
  const showOpcionesWarning =
    isMultiple && opcionesValidas.length < 2;

  function updateField<K extends keyof PreguntaDraft>(
    key: K,
    value: PreguntaDraft[K]
  ) {
    onChange({ ...pregunta, [key]: value });
  }

  function changeTipo(tipo: PreguntaDraft["tipo"]) {
    if (tipo === pregunta.tipo) return;
    // Al cambiar a "texto_libre", se eliminan opciones (no aplican).
    // Al pasar a "opcion_multiple", se inicializa con 2 huecos si no había.
    if (tipo === "texto_libre") {
      onChange({ ...pregunta, tipo, opciones: null });
    } else {
      onChange({
        ...pregunta,
        tipo,
        opciones:
          pregunta.opciones && pregunta.opciones.length > 0
            ? pregunta.opciones
            : ["", ""],
      });
    }
  }

  function updateOpcion(i: number, value: string) {
    const next = [...opciones];
    next[i] = value;
    onChange({ ...pregunta, opciones: next });
  }

  function addOpcion() {
    onChange({ ...pregunta, opciones: [...opciones, ""] });
  }

  function removeOpcion(i: number) {
    const next = opciones.filter((_, idx) => idx !== i);
    onChange({
      ...pregunta,
      opciones: next.length === 0 ? null : next,
    });
  }

  function trimOpcion(i: number) {
    const trimmed = opciones[i]?.trim();
    if (trimmed !== opciones[i]) {
      updateOpcion(i, trimmed ?? "");
    }
  }

  return (
    <article
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-4 shadow-sm",
        "transition-colors hover:border-slate-300"
      )}
      aria-label={`Pregunta ${index + 1}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {index + 1}
          </span>
          <TipoSelector
            value={pregunta.tipo}
            onChange={changeTipo}
          />
        </div>

        <div className="flex items-center gap-1">
          <IconAction
            label="Mover arriba"
            onClick={onMoveUp}
            disabled={index === 0}
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </IconAction>
          <IconAction
            label="Mover abajo"
            onClick={onMoveDown}
            disabled={index === total - 1}
          >
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </IconAction>
          <IconAction
            label="Eliminar pregunta"
            onClick={onDelete}
            tone="destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </IconAction>
        </div>
      </header>

      <div className="mt-4">
        <label
          htmlFor={`pregunta-${index}-contenido`}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Texto de la pregunta
        </label>
        <input
          id={`pregunta-${index}-contenido`}
          type="text"
          value={pregunta.contenido}
          onChange={(e) => updateField("contenido", e.target.value)}
          placeholder="¿Qué quieres preguntar?"
          maxLength={500}
          className={cn(
            "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm",
            "placeholder:text-slate-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 focus-visible:border-slate-900"
          )}
        />
      </div>

      {isMultiple && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-slate-700">Opciones</p>
          {opciones.map((op, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                {i + 1}
              </span>
              <input
                type="text"
                value={op}
                onChange={(e) => updateOpcion(i, e.target.value)}
                onBlur={() => trimOpcion(i)}
                placeholder={`Opción ${i + 1}`}
                maxLength={200}
                aria-label={`Opción ${i + 1}`}
                className={cn(
                  "flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm",
                  "placeholder:text-slate-400",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 focus-visible:border-slate-900"
                )}
              />
              <button
                type="button"
                onClick={() => removeOpcion(i)}
                disabled={opciones.length <= 1}
                aria-label={`Eliminar opción ${i + 1}`}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500",
                  "hover:bg-red-50 hover:text-red-600",
                  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500"
                )}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addOpcion}
            disabled={opciones.length >= 20}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700",
              "hover:border-slate-400 hover:bg-slate-50",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Añadir opción
          </button>

          {showOpcionesWarning && (
            <p
              role="alert"
              className="text-xs text-amber-700"
            >
              Una pregunta de opción múltiple necesita al menos 2 opciones
              con texto.
            </p>
          )}
        </div>
      )}

      <footer className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={pregunta.requerido}
            onChange={(e) => updateField("requerido", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1"
          />
          <span>Requerida</span>
        </label>
      </footer>
    </article>
  );
}

interface TipoSelectorProps {
  value: PreguntaDraft["tipo"];
  onChange: (t: PreguntaDraft["tipo"]) => void;
}

function TipoSelector({ value, onChange }: TipoSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Tipo de pregunta"
      className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5"
    >
      <TipoButton
        active={value === "texto_libre"}
        onClick={() => onChange("texto_libre")}
        label="Texto libre"
      >
        <Type className="h-3.5 w-3.5" aria-hidden="true" />
      </TipoButton>
      <TipoButton
        active={value === "opcion_multiple"}
        onClick={() => onChange("opcion_multiple")}
        label="Opción múltiple"
      >
        <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
      </TipoButton>
    </div>
  );
}

function TipoButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-600 hover:text-slate-900"
      )}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

interface IconActionProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "destructive";
  children: React.ReactNode;
}

function IconAction({
  label,
  onClick,
  disabled,
  tone = "default",
  children,
}: IconActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        tone === "destructive"
          ? "text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:hover:bg-transparent disabled:hover:text-slate-500"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:hover:bg-transparent disabled:hover:text-slate-500"
      )}
    >
      {children}
    </button>
  );
}

// Re-export para tree-shaking y tests si se necesitan en el futuro.
export { TIPO_LABEL };
