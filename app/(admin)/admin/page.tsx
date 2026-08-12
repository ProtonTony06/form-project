import Link from "next/link";
import { Plus, MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FormularioList } from "@/components/admin/FormularioList";
import {
  listarFormularios,
  contarPreguntasPorFormulario,
} from "@/lib/services/formulariosService";
import { contarRespuestasBatch } from "@/lib/services/respuestasService";

export const metadata = {
  title: "Tus formularios · FormProject",
};

/**
 * Dashboard del admin.
 *
 * Lee formularios, conteo de preguntas y conteo de respuestas directamente
 * de Supabase a través de los services. Si la BD no responde, el error se
 * propaga al error boundary del segmento `(admin)`.
 */
export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  const formularios = await listarFormularios();
  const ids = formularios.map((f) => f.id);

  // Cargamos los conteos en paralelo: preguntas (metadatos del form) y
  // respuestas (datos pivot).
  const [preguntasCount, respuestasCount] = await Promise.all([
    contarPreguntasPorFormulario(ids),
    contarRespuestasBatch(ids),
  ]);

  const totalRespuestas = Object.values(respuestasCount).reduce(
    (acc, n) => acc + n,
    0,
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Tus formularios
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestiona tus formularios y revisa las respuestas recibidas.
          </p>
          {totalRespuestas > 0 && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-700">
              <MessageSquare
                className="h-3.5 w-3.5 text-slate-400"
                aria-hidden="true"
              />
              <strong className="font-semibold">{totalRespuestas}</strong>{" "}
              {totalRespuestas === 1
                ? "respuesta recibida en total"
                : "respuestas recibidas en total"}
            </p>
          )}
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
        respuestasCount={respuestasCount}
      />
    </div>
  );
}