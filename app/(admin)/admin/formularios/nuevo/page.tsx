import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/lib/button-styles";
import FormularioBuilder from "@/components/admin/FormularioBuilder";

export const metadata = {
  title: "Nuevo formulario · FormProject",
};

/**
 * Página de creación de formulario.
 *
 * Server Component: valida sesión (defensa en profundidad, el layout ya
 * lo hace) y renderiza el builder en modo "create".
 */
export default async function NuevoFormularioPage() {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

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
          </div>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Nuevo formulario</h1>
          <p className="mt-1 text-sm text-slate-600">
            Define el título, las preguntas y la URL pública. Podrás modificar
            todo después.
          </p>
        </div>
        <Link
          href="/admin"
          className="group inline-flex h-10 items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5" aria-hidden="true" />
          Volver al dashboard
        </Link>
      </header>
      <FormularioBuilder mode="create" />
    </div>
  );
}
