import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicForm } from "@/components/public/PublicForm";
import { obtenerFormularioPublicoPorSlug } from "@/lib/services/formulariosService";

/**
 * Página pública de un formulario.
 *
 * Lee de Supabase vía `obtenerFormularioPublicoPorSlug`. Si el slug no existe
 * o el formulario no está activo, devuelve 404 sin filtrar información sobre
 * qué slugs existen.
 */
interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const formulario = await obtenerFormularioPublicoPorSlug(params.slug);

  if (!formulario) {
    return { title: "Formulario no encontrado | FormProject" };
  }

  return {
    title: `${formulario.titulo} | FormProject`,
    description: formulario.descripcion ?? "Rellena este formulario",
  };
}

export default async function FormularioPublicoPage({ params }: PageProps) {
  const formulario = await obtenerFormularioPublicoPorSlug(params.slug);

  if (!formulario) {
    notFound();
  }

  // Orden defensivo por si la BD devuelve datos desordenados.
  const preguntasOrdenadas = [...formulario.preguntas].sort(
    (a, b) => a.orden - b.orden,
  );

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <header className="mb-8 border-b border-slate-100 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {formulario.titulo}
          </h1>
          {formulario.descripcion && (
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              {formulario.descripcion}
            </p>
          )}
        </header>

        <PublicForm
          formulario={{
            id: formulario.id,
            slug: formulario.slug,
            titulo: formulario.titulo,
            descripcion: formulario.descripcion,
          }}
          preguntas={preguntasOrdenadas}
        />
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        FormProject · Tus respuestas se envían de forma segura al creador del
        formulario.
      </p>
    </main>
  );
}