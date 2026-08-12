import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Editar formulario
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Modifica las preguntas o el estado del formulario.
          </p>
        </div>
        <a
          href={`/f/${formulario.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 self-start text-sm font-medium text-blue-600 hover:underline"
        >
          Ver página pública
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </header>
      <FormularioBuilder mode="edit" initialData={formulario} />
    </div>
  );
}
