import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoadingProps {
  /**
   * Texto accesible para lectores de pantalla. Por defecto "Cargando…".
   */
  label?: string;
  /**
   * Si true, ocupa toda la pantalla con un overlay sutil semitransparente.
   * Útil para acciones que bloquean la UI entera.
   * Por defecto true — más visible para el usuario.
   */
  fullscreen?: boolean;
  /**
   * Clases extra para el contenedor exterior.
   */
  className?: string;
}

/**
 * Indicador de carga circular centrado, usado como fallback de los
 * `loading.tsx` del App Router (Next.js lo muestra automáticamente
 * mientras la página de destino está resolviendo su Server Component).
 *
 * Visual: spinner animado en el centro de la pantalla con un overlay
 * sutil para que destaque sin ser invasivo.
 *
 * Accesibilidad:
 *   - role="status" + aria-live="polite" → el lector anuncia
 *     "Cargando…" cuando aparece.
 *   - El SVG tiene aria-hidden porque el texto ya describe el estado.
 */
export function PageLoading({
  label = "Cargando…",
  fullscreen = true,
  className,
}: PageLoadingProps) {
  const containerClasses = cn(
    "flex items-center justify-center",
    fullscreen && "min-h-[calc(100vh-4rem)] bg-slate-50",
    className,
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className={containerClasses}
      data-testid="page-loading"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2
          className="h-10 w-10 animate-spin text-slate-700"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
    </div>
  );
}