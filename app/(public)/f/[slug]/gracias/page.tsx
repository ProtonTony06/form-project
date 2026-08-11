import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

/**
 * Página de confirmación post-submit.
 *
 * Recibe el título del formulario por query string (`?form=...`) para
 * personalizar el mensaje. Si no viene (por ejemplo, enlace directo),
 * muestra un mensaje genérico igualmente válido.
 */
interface PageProps {
  params: { slug: string };
  searchParams: { form?: string };
}

export default function GraciasPage({ params, searchParams }: PageProps) {
  const tituloFormulario = searchParams.form;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-16">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50"
          aria-hidden
        >
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          ¡Gracias por tu respuesta!
        </h1>

        {tituloFormulario && (
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Has enviado tu respuesta a{" "}
            <span className="font-medium text-slate-700">
              {tituloFormulario}
            </span>
            .
          </p>
        )}

        <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
          Tu respuesta ha sido enviada. Si era necesario, el dueño del
          formulario la recibirá en su correo.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/f/${params.slug}`}
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Volver al formulario
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          >
            Ir al inicio
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        FormProject
      </p>
    </main>
  );
}
