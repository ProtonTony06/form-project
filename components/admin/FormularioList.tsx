"use client";

import * as React from "react";
import Link from "next/link";
import { Inbox, Pencil, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import type { Formulario } from "@/types/formulario";
import { DeleteFormularioButton } from "@/components/admin/DeleteFormularioButton";
import { ToggleActivoButton } from "@/components/admin/ToggleActivoButton";

interface FormularioListProps {
  formularios: Formulario[];
  /**
   * Mapa opcional con el nº de preguntas por formulario.
   * Si no se proporciona, simplemente no se muestra el chip.
   */
  preguntasCount?: Record<string, number>;
}

export function FormularioList({ formularios, preguntasCount }: FormularioListProps) {
  if (formularios.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {formularios.map((f) => (
        <FormularioCard
          key={f.id}
          formulario={f}
          preguntas={preguntasCount?.[f.id]}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-slate-900">
        No tienes formularios aún
      </h2>
      <p className="mt-1 max-w-sm text-sm text-slate-600">
        Crea el primero desde el botón de arriba para empezar a recoger respuestas.
      </p>
    </div>
  );
}

interface FormularioCardProps {
  formulario: Formulario;
  preguntas?: number;
}

function FormularioCard({ formulario, preguntas }: FormularioCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2">{formulario.titulo}</CardTitle>
          <BadgeActivo activo={formulario.activo} />
        </div>
        {formulario.descripcion && (
          <CardDescription className="line-clamp-3">
            {formulario.descripcion}
          </CardDescription>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
            /f/{formulario.slug}
          </code>
          {typeof preguntas === "number" && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {preguntas} {preguntas === 1 ? "pregunta" : "preguntas"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-xs text-slate-500">
          Creado el {formatDate(formulario.created_at)}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/formularios/${formulario.id}/editar`}
          aria-label={`Editar ${formulario.titulo}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Editar
        </Link>
        <ToggleActivoButton
          id={formulario.id}
          activo={formulario.activo}
          titulo={formulario.titulo}
        />
        <Link
          href={`/f/${formulario.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ver formulario público ${formulario.titulo}`}
          title="Abrir formulario público"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          Ver
        </Link>
        <div className="ml-auto">
          <DeleteFormularioButton
            id={formulario.id}
            titulo={formulario.titulo}
            label="Eliminar"
            size="sm"
          />
        </div>
      </CardFooter>
    </Card>
  );
}

function BadgeActivo({ activo }: { activo: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
        activo
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-200 text-slate-700"
      )}
    >
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}
