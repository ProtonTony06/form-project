import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FormularioList } from "@/components/admin/FormularioList";
import type { Formulario } from "@/types/formulario";

export const metadata = {
  title: "Tus formularios · FormProject",
};

/**
 * Dashboard del admin.
 *
 * Por ahora muestra datos MOCKEADOS (la conexión real a Supabase llega en
 * la migración descrita en `lib/auth.ts`). La forma de los datos es la misma
 * que `Formulario` para que el día de mañana solo cambie el origen.
 */
const MOCK_FORMULARIOS: Formulario[] = [
  {
    id: "mock-1",
    slug: "feedback-producto-q3",
    titulo: "Feedback del producto — Q3",
    descripcion:
      "Encuesta corta para recoger opinión de los usuarios sobre las últimas novedades del producto.",
    activo: true,
    created_at: "2026-07-12T10:30:00.000Z",
    updated_at: "2026-08-01T08:15:00.000Z",
  },
  {
    id: "mock-2",
    slug: "registro-evento-tech",
    titulo: "Registro al evento Tech Meetup",
    descripcion:
      "Formulario de inscripción para el próximo meetup. Recoge nombre, email y tema de interés.",
    activo: false,
    created_at: "2026-06-20T14:00:00.000Z",
    updated_at: "2026-07-05T09:00:00.000Z",
  },
];

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

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

      <FormularioList formularios={MOCK_FORMULARIOS} />
    </div>
  );
}
