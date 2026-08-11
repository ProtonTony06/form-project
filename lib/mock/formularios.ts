import type { FormularioConPreguntas } from "@/types/formulario";

/**
 * Mock de formularios para la fase 4.
 *
 * En cuanto Supabase esté conectado (Fase 1) sustituiremos este objeto
 * por una llamada al service `lib/services/formularios.ts`. Los IDs son
 * UUIDs sintéticos (versión 4) sólo para que el tipado no se queje.
 */
export const FORMULARIOS_MOCK: Record<string, FormularioConPreguntas> = {
  "feedback-cliente": {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "feedback-cliente",
    titulo: "¿Cómo fue tu experiencia?",
    descripcion: "Nos encantaría saber tu opinión. Tarda menos de 1 minuto.",
    activo: true,
    created_at: "2026-08-11T10:00:00Z",
    updated_at: "2026-08-11T10:00:00Z",
    preguntas: [
      {
        id: "00000000-0000-0000-0000-000000000010",
        formulario_id: "00000000-0000-0000-0000-000000000001",
        orden: 0,
        tipo: "opcion_multiple",
        contenido: "¿Qué servicio utilizaste?",
        opciones: [
          "Consultoría",
          "Diseño web",
          "Desarrollo a medida",
          "Otro",
        ],
        requerido: true,
        created_at: "2026-08-11T10:00:00Z",
      },
      {
        id: "00000000-0000-0000-0000-000000000011",
        formulario_id: "00000000-0000-0000-0000-000000000001",
        orden: 1,
        tipo: "opcion_multiple",
        contenido: "¿Recomendarías nuestro servicio?",
        opciones: [
          "Definitivamente sí",
          "Probablemente sí",
          "No estoy seguro",
          "Probablemente no",
        ],
        requerido: true,
        created_at: "2026-08-11T10:00:00Z",
      },
      {
        id: "00000000-0000-0000-0000-000000000012",
        formulario_id: "00000000-0000-0000-0000-000000000001",
        orden: 2,
        tipo: "texto_libre",
        contenido: "¿Qué podríamos mejorar?",
        opciones: null,
        requerido: false,
        created_at: "2026-08-11T10:00:00Z",
      },
    ],
  },
  "contacto-rapido": {
    id: "00000000-0000-0000-0000-000000000002",
    slug: "contacto-rapido",
    titulo: "Contacto rápido",
    descripcion: null,
    activo: true,
    created_at: "2026-08-11T11:00:00Z",
    updated_at: "2026-08-11T11:00:00Z",
    preguntas: [
      {
        id: "00000000-0000-0000-0000-000000000020",
        formulario_id: "00000000-0000-0000-0000-000000000002",
        orden: 0,
        tipo: "texto_libre",
        contenido: "¿Cuál es tu nombre?",
        opciones: null,
        requerido: true,
        created_at: "2026-08-11T11:00:00Z",
      },
      {
        id: "00000000-0000-0000-0000-000000000021",
        formulario_id: "00000000-0000-0000-0000-000000000002",
        orden: 1,
        tipo: "texto_libre",
        contenido: "¿En qué podemos ayudarte?",
        opciones: null,
        requerido: true,
        created_at: "2026-08-11T11:00:00Z",
      },
    ],
  },
  "formulario-inactivo": {
    id: "00000000-0000-0000-0000-000000000003",
    slug: "formulario-inactivo",
    titulo: "Este está desactivado",
    descripcion: "No debería verse",
    activo: false,
    created_at: "2026-08-11T12:00:00Z",
    updated_at: "2026-08-11T12:00:00Z",
    preguntas: [],
  },
};
