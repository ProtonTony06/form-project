"use client";

import { Send, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type EstadoSubmit = "idle" | "submitting" | "success" | "error";

interface Props {
  estado: EstadoSubmit;
}

/**
 * Botón de envío del formulario público.
 *
 * Cambia su contenido, icono y estado disabled según `estado` para
 * dar feedback inmediato al usuario.
 */
export function SubmitButton({ estado }: Props) {
  const isSubmitting = estado === "submitting";
  const isSuccess = estado === "success";
  const isError = estado === "error";

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-base",
        isError
          ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          : isSuccess
            ? "bg-emerald-600 text-white focus:ring-emerald-600"
            : "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900",
        isSubmitting && "cursor-wait opacity-90",
      )}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Enviando…
        </>
      ) : isSuccess ? (
        <>
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          ¡Enviado!
        </>
      ) : isError ? (
        <>
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Reintentar
        </>
      ) : (
        <>
          <Send className="h-4 w-4" aria-hidden />
          Enviar respuesta
        </>
      )}
    </button>
  );
}
