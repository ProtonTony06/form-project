/**
 * ════════════════════════════════════════════════════════════════════════════
 *  STUB TEMPORAL — Lo reemplaza el agente de Fase 1 con la versión real.
 * ════════════════════════════════════════════════════════════════════════════
 *  ESTE ARCHIVO ES UN PLACEHOLDER. El agente de Fase 1 está construyendo
 *  la versión real del service en paralelo. Si encuentras este stub en
 *  disco, **sobreescríbelo** con la implementación real.
 *
 *  Esta capa es la que la UI de Fase 3 consume indirectamente a través
 *  de las Server Actions en `app/(admin)/admin/actions.ts`.
 *
 *  Contrato esperado para la versión final:
 *   - crearFormulario(input) → FormularioConPreguntas
 *   - actualizarFormulario(input) → { id }
 *   - eliminarFormulario(id) → void
 *   - toggleActivo(id, activo) → void
 *   - obtenerFormularioPorId(id) → FormularioConPreguntas
 * ════════════════════════════════════════════════════════════════════════════
 */

import type { FormularioConPreguntas } from "@/types/formulario";
import type {
  FormularioCreateInput,
  FormularioUpdateInput,
} from "@/lib/validators/formulario";

let _stubCounter = 0;
function _nextId(prefix: string): string {
  _stubCounter += 1;
  return `stub-${prefix}-${Date.now()}-${_stubCounter}`;
}

export async function crearFormulario(
  input: FormularioCreateInput
): Promise<FormularioConPreguntas> {
  const now = new Date().toISOString();
  return {
    id: _nextId("form"),
    slug: input.slug,
    titulo: input.titulo,
    descripcion: input.descripcion ?? null,
    activo: true,
    created_at: now,
    updated_at: now,
    preguntas: input.preguntas.map((p: FormularioCreateInput["preguntas"][number], i: number) => ({
      id: _nextId(`p-${i}`),
      formulario_id: "stub-form",
      orden: i,
      tipo: p.tipo,
      contenido: p.contenido,
      opciones: p.opciones ?? null,
      requerido: p.requerido,
      created_at: now,
    })),
  };
}

export async function actualizarFormulario(
  input: FormularioUpdateInput
): Promise<{ id: string }> {
  return { id: input.id };
}

export async function eliminarFormulario(id: string): Promise<void> {
  void id;
}

export async function toggleActivo(
  id: string,
  activo: boolean
): Promise<void> {
  void id;
  void activo;
}

export async function obtenerFormularioPorId(
  id: string
): Promise<FormularioConPreguntas> {
  void id;
  const now = new Date().toISOString();
  return {
    id: "stub-form",
    slug: "stub-form",
    titulo: "Stub",
    descripcion: null,
    activo: true,
    created_at: now,
    updated_at: now,
    preguntas: [],
  };
}
