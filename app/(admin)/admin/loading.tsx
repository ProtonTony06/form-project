import { PageLoading } from "@/components/ui/page-loading";

/**
 * Loading UI del segmento /admin/*.
 *
 * Next.js App Router lo renderiza automáticamente como Suspense fallback
 * mientras se resuelve cualquier Server Component del admin
 * (p. ej. /admin, /admin/formularios/[id], /admin/formularios/[id]/editar,
 * /admin/formularios/[id]/respuestas).
 *
 * El `min-h-[calc(100vh-4rem)]` deja espacio para el header sticky (h-16)
 * que envuelve el LayoutShell, así el spinner queda visualmente centrado
 * en el área de contenido y no debajo del header.
 */
export default function AdminLoading() {
  return <PageLoading />;
}