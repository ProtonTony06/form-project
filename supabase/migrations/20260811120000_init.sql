-- =============================================================================
-- FormProject — Schema inicial (Fase 1)
-- Pegar en Supabase Studio → SQL Editor → New query → Run
-- =============================================================================
-- Notas:
--   - Idempotente: se puede re-ejecutar sin errores (IF NOT EXISTS / DROP IF EXISTS).
--   - El esquema usa el schema `public` por defecto de Supabase.
--   - El rol `anon` solo puede LEER formularios activos y sus preguntas.
--   - Todo lo demás (CRUD admin, login) pasa por `service_role` (server-only).
-- =============================================================================

-- ─── Extensiones ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ─── ENUM ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE tipo_pregunta AS ENUM ('opcion_multiple', 'texto_libre');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── Tabla: formularios ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS formularios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  titulo      TEXT NOT NULL CHECK (char_length(titulo) BETWEEN 1 AND 200),
  descripcion TEXT CHECK (descripcion IS NULL OR char_length(descripcion) <= 1000),
  activo      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT formularios_slug_format
    CHECK (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$')
);

CREATE INDEX IF NOT EXISTS idx_formularios_slug
  ON formularios(slug);
CREATE INDEX IF NOT EXISTS idx_formularios_activo
  ON formularios(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_formularios_created_at
  ON formularios(created_at DESC);

-- ─── Tabla: preguntas ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS preguntas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,
  orden         INTEGER NOT NULL,
  tipo          tipo_pregunta NOT NULL,
  contenido     TEXT NOT NULL CHECK (char_length(contenido) BETWEEN 1 AND 500),
  opciones      JSONB,
  requerido     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (formulario_id, orden),
  -- Coherencia tipo ↔ opciones:
  --   opcion_multiple → array JSON con 2-20 elementos.
  --   texto_libre     → opciones debe ser NULL.
  CONSTRAINT preguntas_opciones_integridad CHECK (
    (tipo = 'opcion_multiple'
      AND opciones IS NOT NULL
      AND jsonb_typeof(opciones) = 'array'
      AND jsonb_array_length(opciones) BETWEEN 2 AND 20)
    OR (tipo = 'texto_libre' AND opciones IS NULL)
  ),
  -- Sin strings vacíos ni > 200 chars en las opciones.
  CONSTRAINT preguntas_opciones_no_vacias CHECK (
    opciones IS NULL OR NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(opciones) AS elem
      WHERE char_length(trim(elem)) = 0 OR char_length(elem) > 200
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_preguntas_formulario_orden
  ON preguntas(formulario_id, orden);

-- ─── Tabla: admin_user ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_user (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Trigger: updated_at automático ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_formularios_updated_at ON formularios;
CREATE TRIGGER trg_formularios_updated_at
BEFORE UPDATE ON formularios
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;
ALTER TABLE preguntas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user  ENABLE ROW LEVEL SECURITY;

-- Policies idempotentes.
DROP POLICY IF EXISTS "public_read_active_formularios" ON formularios;
CREATE POLICY "public_read_active_formularios"
  ON formularios FOR SELECT
  USING (activo = true);

DROP POLICY IF EXISTS "public_read_preguntas_of_active" ON preguntas;
CREATE POLICY "public_read_preguntas_of_active"
  ON preguntas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM formularios f
      WHERE f.id = preguntas.formulario_id AND f.activo = true
    )
  );

-- admin_user no expone policies para anon/authenticated → totalmente privada.

-- ─── Comentarios ──────────────────────────────────────────────────────────────
COMMENT ON TABLE formularios IS 'Definiciones de formularios (no se guardan respuestas)';
COMMENT ON TABLE preguntas   IS 'Preguntas que pertenecen a un formulario';
COMMENT ON TABLE admin_user  IS 'Unico usuario administrador (max 1 fila por diseno)';

-- =============================================================================
-- Verificación rápida (opcional, comentar si no se quiere ruido)
-- =============================================================================
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
-- Debe devolver: admin_user, formularios, preguntas
