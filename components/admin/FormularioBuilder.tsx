"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Lock,
} from "lucide-react";
import {
  Button,
} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  crearFormularioAction,
  actualizarFormularioAction,
  type ActionResult,
} from "@/app/(admin)/admin/actions";
import { PreguntaEditor } from "./PreguntaEditor";
import { ImportarPreguntasJSON } from "./ImportarPreguntasJSON";
import type {
  FormularioBuilderInitialData,
  SubmitState,
} from "./types";
import type { PreguntaDraft } from "@/types/formulario";

interface FormularioBuilderProps {
  mode: "create" | "edit";
  initialData?: FormularioBuilderInitialData;
}

// slug regex: empieza y termina en alfanumérico, caracteres medios alfanum o -
const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
const MAX_TITULO = 200;
const MAX_DESCRIPCION = 1000;
const MAX_SLUG = 40;
const MAX_PREGUNTAS = 50;
const AUTOMATICAS_COUNT = 2;

/**
 * Preguntas automáticas que el service añade en la BD en orden 0 y 1.
 * El builder las pre-carga para que el admin las visualice como
 * read-only. Se identifican por `esAutomatica: true`.
 *
 * El orden de estas entradas define qué pregunta va primero (nombre) y
 * cuál segunda (email). No cambiarlas sin actualizar el contrato del
 * service `formulariosService.ts`.
 */
const PREGUNTAS_AUTOMATICAS: PreguntaDraft[] = [
  {
    tipo: "texto_libre",
    contenido: "¿Cuál es tu nombre?",
    opciones: null,
    requerido: true,
    esAutomatica: true,
  },
  {
    tipo: "texto_libre",
    contenido: "¿Cuál es tu correo electrónico?",
    opciones: null,
    requerido: true,
    esAutomatica: true,
  },
];

/**
 * Builder principal del formulario. Usado por las páginas:
 *   - /admin/formularios/nuevo  (mode: create)
 *   - /admin/formularios/[id]/editar (mode: edit)
 *
 * Maneja:
 *  - Estado local de título, descripción, slug, preguntas.
 *  - Auto-generación de slug desde título (mientras el usuario no lo edite).
 *  - Añadir / eliminar / reordenar preguntas.
 *  - Las 2 primeras preguntas son siempre automáticas (read-only) —
 *    se pre-cargan al crear y se restauran desde BD al editar.
 *  - Validación cliente antes de submit.
 *  - Submit vía Server Actions (crear / actualizar).
 *  - Redirección a la pantalla de edición tras crear.
 *
 * NO toca la BD directamente: todo va por las Server Actions de
 * `app/(admin)/admin/actions.ts`.
 */
export default function FormularioBuilder({
  mode,
  initialData,
}: FormularioBuilderProps) {
  const router = useRouter();

  // Estado base del formulario en edición.
  const [titulo, setTitulo] = React.useState(initialData?.titulo ?? "");
  const [descripcion, setDescripcion] = React.useState(
    initialData?.descripcion ?? ""
  );
  const [slug, setSlug] = React.useState(initialData?.slug ?? "");
  // Si llegamos en modo edit, el slug del backend ya existe → no se autogenera.
  const [slugManual, setSlugManual] = React.useState(Boolean(initialData));

  // Preguntas: en edit, preservamos el id y marcamos las 2 primeras como
  // automáticas (porque el service las inyecta en BD). En create, precargamos
  // las 2 automáticas vacías.
  const [preguntas, setPreguntas] = React.useState<PreguntaDraft[]>(() => {
    if (initialData?.preguntas && initialData.preguntas.length > 0) {
      return initialData.preguntas.map((p, i) => ({
        id: p.id,
        tipo: p.tipo,
        contenido: p.contenido,
        opciones: p.opciones,
        requerido: p.requerido,
        esAutomatica: i < AUTOMATICAS_COUNT,
      }));
    }
    return [...PREGUNTAS_AUTOMATICAS];
  });

  // Estado de submit.
  const [estado, setEstado] = React.useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Errores de validación cliente, aceptados también para marcarlos en inputs.
  const [errores, setErrores] = React.useState<{
    titulo?: string;
    slug?: string;
    preguntas?: string;
  }>({});

  // Banner "Formulario creado" cuando la URL trae ?created=1.
  React.useEffect(() => {
    if (mode !== "edit") return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("created") === "1") {
      setSuccessMsg("Formulario creado. Ya puedes seguir ajustándolo.");
      // Limpiamos el query para que un refresh no re-muestre el banner.
      params.delete("created");
      const newSearch = params.toString();
      const newUrl =
        window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState({}, "", newUrl);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  }, [mode]);

  // Auto-generación de slug.
  React.useEffect(() => {
    if (slugManual) return;
    if (!titulo) {
      setSlug("");
      return;
    }
    const generated = slugify(titulo).slice(0, MAX_SLUG);
    setSlug(generated);
  }, [titulo, slugManual]);

  function onTituloChange(value: string) {
    setTitulo(value);
    if (errores.titulo) {
      setErrores((prev) => ({ ...prev, titulo: undefined }));
    }
  }

  function onSlugChange(value: string) {
    setSlugManual(true);
    setSlug(value);
    if (errores.slug) {
      setErrores((prev) => ({ ...prev, slug: undefined }));
    }
  }

  function resetSlug() {
    if (!titulo) return;
    setSlugManual(false);
    setSlug(slugify(titulo).slice(0, MAX_SLUG));
  }

  function addPregunta() {
    if (preguntas.length >= MAX_PREGUNTAS) return;
    setPreguntas((prev) => [
      ...prev,
      {
        tipo: "texto_libre",
        contenido: "",
        opciones: null,
        requerido: true,
      },
    ]);
  }

  /**
   * Añade al array del builder las preguntas que llegaron validadas
   * desde el importador JSON. Las concatena al final (después de las
   * automáticas y de cualquier otra que ya estuviera).
   *
   * El componente `ImportarPreguntasJSON` ya se encarga de capar el
   * máximo, así que aquí solo validamos como defensa.
   */
  function importarPreguntas(
    incoming: Array<{
      tipo: "opcion_multiple" | "texto_libre";
      contenido: string;
      opciones: string[] | null;
      requerido: boolean;
    }>,
  ) {
    if (incoming.length === 0) return;
    setPreguntas((prev) => {
      const espacio = MAX_PREGUNTAS - prev.length;
      const aAnadir = incoming.slice(0, Math.max(0, espacio));
      return [...prev, ...aAnadir];
    });
  }

  function updatePregunta(i: number, p: PreguntaDraft) {
    setPreguntas((prev) => prev.map((q, idx) => (idx === i ? p : q)));
    if (errores.preguntas) {
      setErrores((prev) => ({ ...prev, preguntas: undefined }));
    }
  }

  function deletePregunta(i: number) {
    // Bloqueo defensa en profundidad: la UI también deshabilita el botón,
    // pero si llega aquí, no borramos.
    if (preguntas[i]?.esAutomatica) return;
    setPreguntas((prev) => prev.filter((_, idx) => idx !== i));
  }

  function moveUp(i: number) {
    if (i === 0) return;
    // Bloqueo: no se puede intercambiar una automática (posición 0 o 1)
    // con una del builder.
    if (preguntas[i - 1]?.esAutomatica) return;
    setPreguntas((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  }

  function moveDown(i: number) {
    if (i === preguntas.length - 1) return;
    // Bloqueo: no se puede intercambiar una del builder con una automática
    // (posición 0 o 1).
    if (preguntas[i + 1]?.esAutomatica) return;
    setPreguntas((prev) => {
      const next = [...prev];
      [next[i + 1], next[i]] = [next[i], next[i + 1]];
      return next;
    });
  }

  function validateClient(): boolean {
    const next: typeof errores = {};

    if (!titulo.trim()) {
      next.titulo = "El título es obligatorio.";
    } else if (titulo.length > MAX_TITULO) {
      next.titulo = `Máximo ${MAX_TITULO} caracteres.`;
    }

    const slugTrim = slug.trim();
    if (!slugTrim) {
      next.slug = "El slug es obligatorio.";
    } else if (slugTrim.length > MAX_SLUG) {
      next.slug = `Máximo ${MAX_SLUG} caracteres.`;
    } else if (!SLUG_REGEX.test(slugTrim)) {
      next.slug =
        "Solo minúsculas, números y guiones. No puede empezar ni terminar en guión.";
    }

    // Las preguntas del builder son las que están después de las automáticas.
    const builderPreguntas = preguntas.filter((p) => !p.esAutomatica);
    if (builderPreguntas.length === 0) {
      next.preguntas = "Añade al menos una pregunta propia además de las automáticas.";
    } else {
      const vacias = builderPreguntas.filter((p) => !p.contenido.trim());
      if (vacias.length > 0) {
        next.preguntas = "Todas las preguntas deben tener texto.";
      } else {
        const invalidMultiple = builderPreguntas.find((p) => {
          if (p.tipo !== "opcion_multiple") return false;
          const opts = (p.opciones ?? []).map((o) => o.trim()).filter(Boolean);
          return opts.length < 2;
        });
        if (invalidMultiple) {
          next.preguntas =
            "Las preguntas de opción múltiple necesitan al menos 2 opciones con texto.";
        }
      }
    }

    setErrores(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validateClient()) {
      setEstado("error");
      setErrorMsg("Revisa los campos marcados antes de guardar.");
      return;
    }

    setEstado("submitting");

    // Enviamos SOLO las preguntas del builder (las automáticas las añade
    // el service). Mantenemos el orden relativo y descartamos el flag
    // `esAutomatica` (la capa de servicio ya inyecta las automáticas).
    const builderPreguntas = preguntas
      .filter((p) => !p.esAutomatica)
      .map((p) => ({
        tipo: p.tipo,
        contenido: p.contenido,
        opciones: p.opciones,
        requerido: p.requerido,
      }));

    const formData = new FormData();
    formData.append("titulo", titulo.trim());
    formData.append(
      "descripcion",
      descripcion.trim() ? descripcion.trim() : ""
    );
    formData.append("slug", slug.trim());
    if (initialData?.id) {
      formData.append("id", initialData.id);
    }
    formData.append("preguntas", JSON.stringify(builderPreguntas));

    const result: ActionResult<{ id: string; slug?: string }> =
      mode === "create"
        ? await crearFormularioAction(formData)
        : await actualizarFormularioAction(formData);

    if (result.ok) {
      if (mode === "create") {
        // Tras crear, saltamos a la pantalla de edición para que el admin
        // pueda seguir ajustando (descripción, slug, etc.) y ver el link
        // público. Forzamos full nav para que el server component recargue.
        window.location.href = `/admin/formularios/${result.data.id}/editar?created=1`;
        return;
      }
      setEstado("success");
      setSuccessMsg("Cambios guardados.");
      setTimeout(() => setSuccessMsg(null), 4000);
      router.refresh();
    } else {
      setEstado("error");
      setErrorMsg(result.error);
    }
  }

  const isSubmitting = estado === "submitting";
  const totalPreguntas = preguntas.length;
  const builderCount = preguntas.filter((p) => !p.esAutomatica).length;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del formulario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Título"
            name="titulo"
            value={titulo}
            onChange={(e) => onTituloChange(e.target.value)}
            placeholder="Ej: Feedback del producto"
            maxLength={MAX_TITULO}
            error={errores.titulo}
            helperText="Se mostrará en la cabecera del formulario público."
            disabled={isSubmitting}
            required
          />

          <div>
            <label
              htmlFor="descripcion"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={descripcion ?? ""}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Una frase corta explicando el objetivo del formulario (opcional)."
              rows={3}
              maxLength={MAX_DESCRIPCION}
              disabled={isSubmitting}
              className={cn(
                "flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900",
                "placeholder:text-slate-400",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 focus-visible:border-slate-900",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            />
            <p className="mt-1 text-xs text-slate-500">
              Aparece debajo del título en la página pública. Opcional.
            </p>
          </div>

          <div>
            <Input
              label="Slug"
              name="slug"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="feedback-producto"
              maxLength={MAX_SLUG}
              error={errores.slug}
              helperText="URL pública: /f/{slug}. Solo minúsculas, números y guiones."
              disabled={isSubmitting}
              required
            />
            <div className="mt-2 flex items-center gap-2">
              <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                /f/{slug || "..."}
              </code>
              {slugManual && titulo && (
                <button
                  type="button"
                  onClick={resetSlug}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" aria-hidden="true" />
                  Regenerar desde el título
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Preguntas</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Las 2 primeras preguntas son automáticas (nombre y email) y no
              pueden eliminarse. Añade las tuyas a continuación.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            {totalPreguntas} / {MAX_PREGUNTAS}
            {builderCount > 0 && (
              <span className="ml-1 text-slate-500">
                ({builderCount} propia{builderCount === 1 ? "" : "s"})
              </span>
            )}
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          {preguntas.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm text-slate-600">
                Aún no hay preguntas. Añade la primera con el botón de abajo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {preguntas.map((p, i) => (
                <PreguntaEditor
                  key={p.id ?? `draft-${i}`}
                  pregunta={p}
                  index={i}
                  total={preguntas.length}
                  onChange={(next) => updatePregunta(i, next)}
                  onDelete={() => deletePregunta(i)}
                  onMoveUp={() => moveUp(i)}
                  onMoveDown={() => moveDown(i)}
                />
              ))}
            </div>
          )}

          {errores.preguntas && (
            <p role="alert" className="text-xs text-red-600">
              {errores.preguntas}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addPregunta}
              disabled={isSubmitting || preguntas.length >= MAX_PREGUNTAS}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700",
                "hover:border-slate-400 hover:bg-slate-50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Añadir pregunta
            </button>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Las preguntas con candado son automáticas del sistema.
            </span>
          </div>

          <ImportarPreguntasJSON
            existingCount={preguntas.length}
            maxPreguntas={MAX_PREGUNTAS}
            onImport={importarPreguntas}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => router.push("/admin")}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isSubmitting}
          loadingText="Guardando…"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {mode === "create" ? "Crear formulario" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

/**
 * slugify cliente: replica la lógica de `lib/slug.ts` para previsualización.
 * Si la utilidad backend cambia, mantener compatible.
 */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}