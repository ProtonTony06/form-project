"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ListChecks,
  Lock,
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
  /**
   * `true` si en este editor las automáticas están bloqueadas (no se pueden
   * borrar / reordenar / cambiar tipo). Lo decide el builder según el
   * tamaño relativo de la pregunta: las 2 primeras son siempre automáticas
   * y no se pueden mover con las del builder.
   */
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
 * Si la pregunta es automática (`esAutomatica === true`):
 *  - Tipo, requerido y contenido están bloqueados parcialmente.
 *  - Botón eliminar deshabilitado.
 *  - Badge "Automática" visible.
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
  const esAutomatica = Boolean(pregunta.esAutomatica);

  // Para automáticas: el contenido está protegido — no permitir vaciarlo.
  function updateField<K extends keyof PreguntaDraft>(
    key: K,
    value: PreguntaDraft[K],
  ) {
    if (esAutomatica && key === "contenido" && typeof value === "string") {
      if (value.trim().length === 0) return; // ignore vaciado
    }
    onChange({ ...pregunta, [key]: value });
  }

  function changeTipo(tipo: PreguntaDraft["tipo"]) {
    if (esAutomatica) return; // tipo bloqueado para automáticas
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
        "rounded-lg border bg-white p-4 shadow-sm transition-colors",
        esAutomatica
          ? "border-blue-200 bg-blue-50/50 hover:border-blue-300"
          : "border-slate-200 hover:border-slate-300",
      )}
      aria-label={`Pregunta ${index + 1}${esAutomatica ? " (automática)" : ""}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white",
              esAutomatica ? "bg-blue-600" : "bg-slate-900",
            )}
          >
            {index + 1}
          </span>
          {esAutomatica && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Automática
            </span>
          )}
          <TipoSelector
            value={pregunta.tipo}
            onChange={changeTipo}
            disabled={esAutomatica}
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
            label={
              esAutomatica
                ? "Campo automático (no se puede eliminar)"
                : "Eliminar pregunta"
            }
            onClick={onDelete}
            disabled={esAutomatica}
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
          {esAutomatica && (
            <span className="ml-2 text-xs font-normal text-blue-700">
              (recomendado no modificar)
            </span>
          )}
        </label>
        <input
          id={`pregunta-${index}-contenido`}
          type="text"
          value={pregunta.contenido}
          onChange={(e) => updateField("contenido", e.target.value)}
          placeholder="¿Qué quieres preguntar?"
          maxLength={500}
          readOnly={esAutomatica}
          aria-readonly={esAutomatica || undefined}
          className={cn(
            "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900",
            "placeholder:text-slate-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 focus-visible:border-slate-900",
            esAutomatica && "cursor-not-allowed bg-blue-50/60 text-slate-700",
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
                  "flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900",
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
        <label
          className={cn(
            "flex items-center gap-2 text-sm text-slate-700",
            esAutomatica ? "cursor-not-allowed opacity-70" : "cursor-pointer",
          )}
        >
          <input
            type="checkbox"
            checked={pregunta.requerido}
            disabled={esAutomatica}
            onChange={(e) => updateField("requerido", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 disabled:cursor-not-allowed"
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
  disabled?: boolean;
}

function TipoSelector({ value, onChange, disabled }: TipoSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Tipo de pregunta"
      aria-disabled={disabled || undefined}
      className={cn(
        "inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5",
        disabled && "opacity-60",
      )}
    >
      <TipoButton
        active={value === "texto_libre"}
        onClick={() => onChange("texto_libre")}
        label="Texto libre"
        disabled={disabled}
      >
        <Type className="h-3.5 w-3.5" aria-hidden="true" />
      </TipoButton>
      <TipoButton
        active={value === "opcion_multiple"}
        onClick={() => onChange("opcion_multiple")}
        label="Opción múltiple"
        disabled={disabled}
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
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-600 hover:text-slate-900",
        disabled && "cursor-not-allowed hover:text-slate-600",
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