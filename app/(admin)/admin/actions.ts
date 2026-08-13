"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  crearFormulario as crearFormularioSvc,
  actualizarFormulario as actualizarFormularioSvc,
  eliminarFormulario as eliminarFormularioSvc,
  toggleActivo as toggleActivoSvc,
} from "@/lib/services/formulariosService";
import {
  formularioCreateSchema,
  formularioUpdateSchema,
} from "@/lib/validators/formulario";

/**
 * Tipos auxiliares para Server Actions.
 *
 * Se definen aquí (no en `types/formulario.ts`) porque son específicos de la
 * capa de presentación y no representan entidades de dominio persistidas.
 */
export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Garantiza que la sesión esté presente antes de ejecutar cualquier acción.
 * Lanza un error legible si no hay admin autenticado (las acciones nunca
 * deben ejecutarse sin auth).
 */
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("No autenticado");
  }
  return session;
}

/**
 * Crea un formulario (admin).
 * Acepta FormData con campos: titulo, descripcion, slug, preguntas (JSON).
 */
export async function crearFormularioAction(
  formData: FormData
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Sin sesión activa. Inicia sesión de nuevo." };
  }

  let preguntasParsed: unknown;
  try {
    const raw = formData.get("preguntas");
    preguntasParsed =
      typeof raw === "string" && raw.length > 0 ? JSON.parse(raw) : [];
  } catch {
    return { ok: false, error: "Preguntas recibidas con formato inválido." };
  }

  const raw = {
    titulo: String(formData.get("titulo") ?? "").trim(),
    descripcion: (() => {
      const v = formData.get("descripcion");
      if (v === null) return null;
      const s = String(v).trim();
      return s.length === 0 ? null : s;
    })(),
    slug: String(formData.get("slug") ?? "").trim(),
    preguntas: preguntasParsed,
  };

  const parsed = formularioCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ok: false,
      error: firstIssue?.message ?? "Datos inválidos",
    };
  }

  try {
    const form = await crearFormularioSvc(parsed.data);
    revalidatePath("/admin");
    revalidatePath(`/f/${form.slug}`);
    return { ok: true, data: { id: form.id, slug: form.slug } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error creando formulario";
    return { ok: false, error: message };
  }
}

/**
 * Actualiza un formulario (admin).
 * Acepta FormData con: id, titulo, descripcion, slug, preguntas (JSON).
 */
export async function actualizarFormularioAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Sin sesión activa. Inicia sesión de nuevo." };
  }

  let preguntasParsed: unknown;
  try {
    const raw = formData.get("preguntas");
    preguntasParsed =
      typeof raw === "string" && raw.length > 0 ? JSON.parse(raw) : [];
  } catch {
    return { ok: false, error: "Preguntas recibidas con formato inválido." };
  }

  const raw = {
    id: String(formData.get("id") ?? "").trim(),
    titulo: String(formData.get("titulo") ?? "").trim(),
    descripcion: (() => {
      const v = formData.get("descripcion");
      if (v === null) return null;
      const s = String(v).trim();
      return s.length === 0 ? null : s;
    })(),
    slug: String(formData.get("slug") ?? "").trim(),
    preguntas: preguntasParsed,
  };

  const parsed = formularioUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ok: false,
      error: firstIssue?.message ?? "Datos inválidos",
    };
  }

  try {
    const result = await actualizarFormularioSvc(parsed.data);
    revalidatePath("/admin");
    revalidatePath(`/admin/formularios/${parsed.data.id}/editar`);
    revalidatePath(`/f/${parsed.data.slug}`);
    return { ok: true, data: { id: result.id } };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Error actualizando formulario";
    return { ok: false, error: message };
  }
}

/**
 * Elimina un formulario por id (admin).
 */
export async function eliminarFormularioAction(
  id: string
): Promise<ActionResult<null>> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Sin sesión activa. Inicia sesión de nuevo." };
  }

  if (!id) {
    return { ok: false, error: "Falta el id del formulario." };
  }

  try {
    await eliminarFormularioSvc(id);
    revalidatePath("/admin");
    revalidatePath("/f/[slug]", "page");
    return { ok: true, data: null };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Error eliminando formulario";
    return { ok: false, error: message };
  }
}

/**
 * Cambia el estado `activo` de un formulario (admin).
 */
export async function toggleActivoAction(
  id: string,
  activo: boolean
): Promise<ActionResult<{ id: string; activo: boolean }>> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Sin sesión activa. Inicia sesión de nuevo." };
  }

  if (!id) {
    return { ok: false, error: "Falta el id del formulario." };
  }

  try {
    await toggleActivoSvc(id, activo);
    revalidatePath("/admin");
    // Re-validar TODAS las páginas /f/[slug] (el slug puede cambiar tras
    // renombrado). Más conservador pero barato en este proyecto.
    revalidatePath("/f/[slug]", "page");
    return { ok: true, data: { id, activo } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error cambiando estado";
    return { ok: false, error: message };
  }
}
