import { NextRequest, NextResponse } from "next/server";
import { obtenerFormularioPublicoPorSlug } from "@/lib/services/formulariosService";
import { crearRespuesta } from "@/lib/services/respuestasService";
import {
  submitBodySchema,
  validateRespuestasContraFormulario,
} from "@/lib/validators/submit";
import { rateLimit } from "@/lib/rateLimit";

// Forzamos runtime Node (mejor comportamiento de `rateLimit` + clientes Supabase).
export const runtime = "nodejs";
// Sin caché: cada submit muta estado.
export const dynamic = "force-dynamic";

/**
 * POST /api/submit/[slug]
 *
 * Recibe las respuestas de un formulario público y las persiste en BD
 * (pivot: ya NO se envía email). Devuelve JSON con la forma:
 *   { ok: true }
 *   { ok: false, error: string, errores?: Record<id_pregunta, string> }
 *
 * Códigos HTTP:
 *   200 → éxito
 *   400 → payload inválido o respuestas inválidas
 *   404 → formulario no existe / inactivo
 *   429 → rate limit excedido
 *   500 → error inesperado
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse> {
  try {
    // 1) Rate limit por IP (defensa contra spam/bots).
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const max = Number(process.env.RATE_LIMIT_MAX ?? 5);
    const windowMs =
      Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 600) * 1000;

    if (!rateLimit(`submit:${ip}`, max, windowMs)) {
      return NextResponse.json(
        { ok: false, error: "Demasiadas solicitudes. Inténtalo más tarde." },
        { status: 429 },
      );
    }

    // 2) Validar estructura del body.
    let bodyJson: unknown;
    try {
      bodyJson = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "JSON inválido" },
        { status: 400 },
      );
    }

    const parsedBody = submitBodySchema.safeParse(bodyJson);
    if (!parsedBody.success) {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos" },
        { status: 400 },
      );
    }

    // 3) Resolver formulario por slug (solo si está activo).
    const formulario = await obtenerFormularioPublicoPorSlug(params.slug);
    if (!formulario) {
      return NextResponse.json(
        { ok: false, error: "Formulario no encontrado o inactivo" },
        { status: 404 },
      );
    }

    // 4) Validar respuestas contra el esquema del formulario (reglas +
    //    formato email en la pregunta automática).
    const validacion = validateRespuestasContraFormulario(
      formulario.preguntas,
      parsedBody.data.respuestas,
    );

    if (!validacion.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Respuestas inválidas",
          errores: validacion.errores,
        },
        { status: 400 },
      );
    }

    // 5) Persistir respuesta (cabecera + valores).
    const userAgent = request.headers.get("user-agent") ?? "unknown";
    await crearRespuesta(formulario.id, parsedBody.data.respuestas, {
      ip,
      userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error procesando submit:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
