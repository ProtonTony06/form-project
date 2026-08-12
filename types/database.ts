/**
 * Tipos de la base de datos Supabase.
 *
 * Generados manualmente para Fase 1 (la CLI `supabase gen types` requiere
 * autenticación al servicio y, en algunos entornos, no es invocable de forma
 * desatendida). Mantenerlos sincronizados con `supabase/migrations/`.
 *
 * Si en el futuro se prefiere regenerar automáticamente, ejecutar:
 *   `npm run db:types`
 * (requiere Supabase CLI autenticada).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      formularios: {
        Row: {
          id: string;
          slug: string;
          titulo: string;
          descripcion: string | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titulo: string;
          descripcion?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          titulo?: string;
          descripcion?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      preguntas: {
        Row: {
          id: string;
          formulario_id: string;
          orden: number;
          tipo: Database["public"]["Enums"]["tipo_pregunta"];
          contenido: string;
          opciones: Json | null;
          requerido: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          formulario_id: string;
          orden: number;
          tipo: Database["public"]["Enums"]["tipo_pregunta"];
          contenido: string;
          opciones?: Json | null;
          requerido?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          formulario_id?: string;
          orden?: number;
          tipo?: Database["public"]["Enums"]["tipo_pregunta"];
          contenido?: string;
          opciones?: Json | null;
          requerido?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "preguntas_formulario_id_fkey";
            columns: ["formulario_id"];
            referencedRelation: "formularios";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_user: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      respuestas: {
        Row: {
          id: string;
          formulario_id: string;
          ip: string | null;
          user_agent: string | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          formulario_id: string;
          ip?: string | null;
          user_agent?: string | null;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          formulario_id?: string;
          ip?: string | null;
          user_agent?: string | null;
          submitted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "respuestas_formulario_id_fkey";
            columns: ["formulario_id"];
            referencedRelation: "formularios";
            referencedColumns: ["id"];
          },
        ];
      };
      respuesta_preguntas: {
        Row: {
          id: string;
          respuesta_id: string;
          pregunta_id: string;
          valor: string;
        };
        Insert: {
          id?: string;
          respuesta_id: string;
          pregunta_id: string;
          valor: string;
        };
        Update: {
          id?: string;
          respuesta_id?: string;
          pregunta_id?: string;
          valor?: string;
        };
        Relationships: [
          {
            foreignKeyName: "respuesta_preguntas_respuesta_id_fkey";
            columns: ["respuesta_id"];
            referencedRelation: "respuestas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "respuesta_preguntas_pregunta_id_fkey";
            columns: ["pregunta_id"];
            referencedRelation: "preguntas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      tipo_pregunta: "opcion_multiple" | "texto_libre";
    };
    CompositeTypes: Record<string, never>;
  };
}