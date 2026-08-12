import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { RespuestasList } from "@/components/admin/RespuestasList";
import { obtenerFormularioPorId } from "@/lib/services/formulariosService";
import {
  listarRespuestasPorFormulario,
  obtenerRespuestaDetalle,
} from "@/lib/services/respuestasService";

export const metadata = {
  title: "Respuestas · FormProject",
};

/**
 * Página de respuestas de un formulario concreto.
 *
 * Server Component:
 *  - Verifica sesión (defensa en profundidad; el layout ya lo hace).
 *  - Carga el formulario + respuestas + detalle en paralelo.
 *  - Si no existe el formulario, responde 404.
 *
 * Decisión de carga: en vez de un endpoint extra de admin, cargamos todos
 * los detalles de respuesta en el server component y los pasamos al
 * client component ya listos. Trade-off: más memoria en el SSR para
 * formularios con >50 respuestas, pero la UX es instantánea al expandir.
 *
 * Para formularios con miles de respuestas, sería preferible un endpoint
 * paginado — se documenta como mejora futura.
 */
export default async function RespuestasFormularioPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  let formulario;
  try {
    formulario = await obtenerFormularioPorId(params.id);
  } catch {
    notFound();
  }

  if (!formulario) {
    notFound();
  }

  const { data: cabeceras } = await listarRespuestasPorFormulario(
    formulario.id,
    { limit: 200 },
  );

  // Cargamos los detalles en paralelo (best-effort: si alguno falla,
  // seguimos con el resto).
  const detalleResults = await Promise.allSettled(
    cabeceras.map((c) => obtenerRespuestaDetalle(c.id)),
  );

  const detalles = detalleResults
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((d): d is NonNullable<typeof d> => d !== null);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 hover:text-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Dashboard
            </Link>
            <span aria-hidden>·</span>
            <Link
              href={`/admin/formularios/${formulario.id}/editar`}
              className="hover:text-slate-700"
            >
              Editar
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Respuestas de &laquo;{formulario.titulo}&raquo;
          </h1>
          <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-600">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            {detalles.length}{" "}
            {detalles.length === 1 ? "respuesta recibida" : "respuestas recibidas"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/formularios/${formulario.id}/editar`}
            className={buttonVariants({ variant: "outline", size: "md" })}
          >
            Editar formulario
          </Link>
          <Link
            href={`/f/${formulario.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "ghost", size: "md" })}
          >
            Ver página pública
          </Link>
        </div>
      </header>

      <RespuestasList detalles={detalles} preguntas={formulario.preguntas} />
    </div>
  );
}