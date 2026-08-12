"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleActivoAction } from "@/app/(admin)/admin/actions";

interface ToggleActivoButtonProps {
  id: string;
  activo: boolean;
  /**
   * Si se proporciona, se usa como nombre accesible del formulario (para el
   * texto del aria-label).
   */
  titulo?: string;
  /**
   * Tras un cambio exitoso, llama a router.refresh() para que la lista
   * vuelva a renderizar con datos frescos. Por defecto true.
   */
  refreshOnSuccess?: boolean;
}

/**
 * Switch visual para activar / desactivar un formulario.
 *
 * Diseño: pill con bolita blanca deslizante. Sin librería externa.
 * Estado: optimista — al pulsar, se cambia la UI antes de la respuesta
 * de la Server Action. Si falla, rollback con un mensaje de error.
 */
export function ToggleActivoButton({
  id,
  activo,
  titulo,
  refreshOnSuccess = true,
}: ToggleActivoButtonProps) {
  const router = useRouter();
  const [optimistic, setOptimistic] = React.useState(activo);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sincronizar si el prop cambia desde fuera (p.ej. tras un router.refresh).
  React.useEffect(() => {
    setOptimistic(activo);
  }, [activo]);

  async function onToggle() {
    if (pending) return;
    const next = !optimistic;
    setPending(true);
    setError(null);
    setOptimistic(next); // optimistic update

    const result = await toggleActivoAction(id, next);
    if (!result.ok) {
      setOptimistic(!next); // rollback
      setError(result.error);
    } else if (refreshOnSuccess) {
      router.refresh();
    }
    setPending(false);
  }

  const label = optimistic ? "Activo" : "Inactivo";
  const ariaLabel = titulo
    ? `${optimistic ? "Desactivar" : "Activar"} ${titulo}`
    : `${optimistic ? "Desactivar" : "Activar"} formulario`;

  return (
    <div className="flex flex-col items-start gap-1">
      <div
        className="inline-flex items-center gap-2"
        data-testid="toggle-activo"
      >
        <button
          type="button"
          role="switch"
          aria-checked={optimistic}
          aria-label={ariaLabel}
          onClick={onToggle}
          disabled={pending}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-60",
            optimistic ? "bg-emerald-600" : "bg-slate-300"
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
              optimistic ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
        <span className="text-xs font-medium text-slate-700">{label}</span>
        {pending && (
          <Loader2
            className="h-3.5 w-3.5 animate-spin text-slate-500"
            aria-hidden="true"
            data-testid="toggle-activo-loading"
          />
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="flex items-center gap-1 text-xs text-red-600"
        >
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
