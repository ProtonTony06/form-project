import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportarRespuestasComoJSON } from "@/lib/services/respuestasService";

// Runtime Node: clientes Supabase + bcrypt.
export const runtime = "nodejs";
// Sin caché: cada descarga refleja el estado actual de la BD.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/formularios/[id]/respuestas.json
 *
 * Devuelve un JSON con TODAS las respuestas de un formulario para que
 * el admin las descargue como fichero.
 *
 * Cabeceras:
 *   - `Content-Type: application/json; charset=utf-8`
 *   - `Content-Disposition: attachment; filename="respuestas-{slug}-{YYYY-MM-DD}.json"`
 *   - `Cache-Control: no-store` (evita caches de CDN/proxy).
 *
 * Códigos HTTP:
 *   - 200 → JSON con `{ formulario, total, preguntas, respuestas, exported_at }`.
 *   - 401 → no hay sesión admin activa.
 *   - 404 → el formulario no existe.
 *   - 500 → error inesperado al leer la BD.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 },
      );
    }

    const payload = await exportarRespuestasComoJSON(params.id);
    if (!payload) {
      return NextResponse.json(
        { error: "Formulario no encontrado" },
        { status: 404 },
      );
    }

    const json = JSON.stringify(payload, null, 2);
    const fecha = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `respuestas-${payload.formulario.slug}-${fecha}.json`;

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generando JSON de respuestas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
