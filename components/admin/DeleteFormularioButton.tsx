"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eliminarFormularioAction } from "@/app/(admin)/admin/actions";

interface DeleteFormularioButtonProps {
  id: string;
  titulo: string;
  /**
   * Si true, redirige a /admin tras éxito. Si false, sólo refresca la página
   * actual (útil cuando el botón está dentro de la pantalla de edición).
   */
  redirectOnSuccess?: boolean;
  size?: "sm" | "md" | "lg" | "icon";
  /**
   * Etiqueta del botón. Por defecto "Eliminar".
   */
  label?: string;
}

/**
 * Botón de eliminar formulario con confirmación nativa.
 *
 * Uso:
 *   <DeleteFormularioButton id={form.id} titulo={form.titulo} />
 *
 * Para evitar acoplar el componente a `FormularioList.tsx` (no modificable
 * desde esta fase), este botón es autocontenido: incluye el icono, el
 * confirm() y la llamada a la Server Action. La integración con la lista
 * queda pendiente para una fase siguiente.
 */
export function DeleteFormularioButton({
  id,
  titulo,
  redirectOnSuccess = true,
  size = "sm",
  label = "Eliminar",
}: DeleteFormularioButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onClick() {
    if (loading) return;
    const ok = window.confirm(
      `¿Eliminar el formulario "${titulo}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    setLoading(true);
    setError(null);

    const result = await eliminarFormularioAction(id);
    if (result.ok) {
      if (redirectOnSuccess) {
        // Full nav para que la lista del admin se vuelva a montar limpia.
        window.location.href = "/admin";
      } else {
        router.refresh();
      }
      return;
    }

    setLoading(false);
    setError(result.error);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="destructive"
        size={size}
        onClick={onClick}
        loading={loading}
        loadingText="Eliminando…"
        aria-label={`Eliminar ${titulo}`}
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        {!loading && (
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {label}
      </Button>
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
