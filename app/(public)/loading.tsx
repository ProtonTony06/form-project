import { PageLoading } from "@/components/ui/page-loading";

/**
 * Loading UI del segmento público.
 *
 * Cubre /f/[slug] y /f/[slug]/gracias. Como el layout público no tiene
 * header, el spinner ocupa la pantalla completa (sin descontar altura).
 */
export default function PublicLoading() {
  return <PageLoading />;
}