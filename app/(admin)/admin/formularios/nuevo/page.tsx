import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Nuevo formulario</h1>
        <p className="mt-1 text-sm text-slate-600">
          Define el título, las preguntas y la URL pública. Podrás modificar
          todo después.
        </p>
      </header>
      <FormularioBuilder mode="create" />
    </div>
  );
}
