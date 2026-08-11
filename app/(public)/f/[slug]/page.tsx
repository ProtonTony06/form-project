import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicForm } from "@/components/public/PublicForm";
import { FORMULARIOS_MOCK } from "@/lib/mock/formularios";
import type { FormularioConPreguntas } from "@/types/formulario";

/**
 * Página pública de un formulario.
 *
 * Por ahora lee de un mock hardcoded. Cuando llegue Supabase (Fase 1+),
 * sustituir `getFormularioFromMock` por una llamada a `lib/services/formularios.ts`.
 *
 * Si el slug no existe o el formulario no está activo, devolvemos 404
 * sin filtrar información sobre qué slugs existen.
 */
async function getFormularioFromMock(
  slug: string,
): Promise<FormularioConPreguntas | null> {
  return FORMULARIOS_MOCK[slug] ?? null;
}

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const formulario = await getFormularioFromMock(params.slug);

  if (!formulario || !formulario.activo) {
    return { title: "Formulario no encontrado | FormProject" };
  }

  return {
    title: `${formulario.titulo} | FormProject`,
    description: formulario.descripcion ?? "Rellena este formulario",
  };
}

export default async function FormularioPublicoPage({ params }: PageProps) {
  const formulario = await getFormularioFromMock(params.slug);

  if (!formulario || !formulario.activo) {
    notFound();
  }

  // Orden defensivo por si los mocks vienen desordenados.
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
