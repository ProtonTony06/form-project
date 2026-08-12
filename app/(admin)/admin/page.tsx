import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FormularioList } from "@/components/admin/FormularioList";
import {
  listarFormularios,
  contarPreguntasPorFormulario,
} from "@/lib/services/formulariosService";

export const metadata = {
  title: "Tus formularios · FormProject",
};

/**
 * Dashboard del admin.
 *
 * Lee formularios y conteo de preguntas directamente de Supabase a través
 * del service. Si la BD no responde, el error se propaga al error boundary
 * del segmento `(admin)`.
 */
export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  const formularios = await listarFormularios();
  const ids = formularios.map((f) => f.id);
  const preguntasCount = await contarPreguntasPorFormulario(ids);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Tus formularios
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Crea, edita y comparte los formularios de tu proyecto.
          </p>
        </div>
        <Link
          href="/admin/formularios/nuevo"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Crear formulario
        </Link>
      </div>

      <FormularioList
        formularios={formularios}
        preguntasCount={preguntasCount}
      />
    </div>
  );
}