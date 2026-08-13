import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import FormularioBuilder from "@/components/admin/FormularioBuilder";
import { obtenerFormularioPorId } from "@/lib/services/formulariosService";

export const metadata = {
  title: "Editar formulario · FormProject",
};

/**
 * Página de edición de un formulario.
 *
 * Server Component:
 *  - Verifica sesión.
 *  - Carga el formulario con sus preguntas desde el servicio.
 *  - Si no existe, responde 404.
 *  - Renderiza el builder en modo "edit" con initialData.
 */
export default async function EditarFormularioPage({
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

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Editar formulario
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Modifica las preguntas o el estado del formulario.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 self-center sm:flex-row sm:gap-4">
          <Link
            href="/admin"
            className="group inline-flex h-10 items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5" aria-hidden="true" />
            Volver al dashboard
          </Link>
          <a
            href={`/f/${formulario.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex h-10 items-center gap-2 self-start rounded-lg border border-blue-200 bg-blue-50/60 px-4 text-sm font-medium text-blue-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Ver página pública
            <ExternalLink className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </a>
        </div>
      </header>
      <FormularioBuilder mode="edit" initialData={formulario} />
    </div>
  );
}
