import Link from "next/link";
import { ArrowLeft, ExternalLink, MessageSquare, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { buttonVariants } from "@/lib/button-styles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { obtenerFormularioPorId } from "@/lib/services/formulariosService";
import {
  contarRespuestasPorFormulario,
} from "@/lib/services/respuestasService";

export const metadata = {
  title: "Detalle del formulario · FormProject",
};

/**
 * Página de detalle (read-only) de un formulario.
 *
 * Server Component:
 *  - Verifica sesión.
 *  - Carga el formulario + conteo de respuestas.
 *  - Si no existe, responde 404.
 *  - Muestra metadata, preguntas y CTAs a "Editar" / "Ver respuestas".
 *
 * Es la landing natural al pulsar sobre un formulario desde el dashboard.
 */
export default async function FormularioDetailPage({
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

  let totalRespuestas = 0;
  try {
    totalRespuestas = await contarRespuestasPorFormulario(formulario.id);
  } catch {
    // Si falla el conteo, mostramos "—" en vez de bloquear la página.
    totalRespuestas = 0;
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {formulario.titulo}
          </h1>
          {formulario.descripcion && (
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              {formulario.descripcion}
            </p>
          )}
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:grid sm:grid-cols-2 sm:gap-3 xl:flex xl:flex-row xl:items-center xl:justify-end xl:gap-4">
          <Link
            href="/admin"
            className="group inline-flex h-10 items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5" aria-hidden="true" />
            Volver al dashboard
          </Link>
          <Link
            href={`/admin/formularios/${formulario.id}/editar`}
            className={buttonVariants({ variant: "outline", size: "md" })}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Editar
          </Link>
          <Link
            href={`/admin/formularios/${formulario.id}/respuestas`}
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Respuestas ({totalRespuestas})
          </Link>
          <a
            href={`/f/${formulario.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex h-10 items-center justify-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50/60 px-5 text-sm font-medium text-blue-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Página pública
            <ExternalLink className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </a>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Información</CardTitle>
          <CardDescription>
            Metadata del formulario y estado actual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Slug público
              </dt>
              <dd className="mt-1">
                <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-sm text-slate-700">
                  /f/{formulario.slug}
                </code>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Estado
              </dt>
              <dd className="mt-1">
                <span
                  className={
                    formulario.activo
                      ? "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                      : "inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700"
                  }
                >
                  {formulario.activo ? "Activo" : "Inactivo"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Creado
              </dt>
              <dd className="mt-1 text-sm text-slate-700">
                {formatDate(formulario.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Última actualización
              </dt>
              <dd className="mt-1 text-sm text-slate-700">
                {formatDate(formulario.updated_at)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total respuestas
              </dt>
              <dd className="mt-1 text-sm text-slate-700">
                {totalRespuestas}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preguntas ({formulario.preguntas.length})</CardTitle>
          <CardDescription>
            Las 2 primeras preguntas (nombre y email) las añade el sistema
            automáticamente y no se pueden eliminar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {formulario.preguntas.map((p) => {
              const esAutomatica = p.orden < 2;
              return (
                <li
                  key={p.id}
                  className={
                    esAutomatica
                      ? "rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2"
                      : "rounded-md border border-slate-200 px-3 py-2"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">
                          #{p.orden + 1}
                        </span>
                        {esAutomatica && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            Automática
                          </span>
                        )}
                        <span className="text-xs uppercase tracking-wide text-slate-500">
                          {p.tipo === "opcion_multiple"
                            ? "Opción múltiple"
                            : "Texto libre"}
                        </span>
                        {p.requerido && (
                          <span className="text-xs text-red-500">
                            obligatoria
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {p.contenido}
                      </p>
                      {p.tipo === "opcion_multiple" && p.opciones && (
                        <ul className="mt-1 list-disc pl-5 text-sm text-slate-600">
                          {p.opciones.map((op, i) => (
                            <li key={i}>{op}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}