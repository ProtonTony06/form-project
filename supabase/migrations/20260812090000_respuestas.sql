-- =============================================================================
-- FormProject — Migración respuestas (Pivot del MVP, 2026-08-12)
-- =============================================================================
-- Cambia el modelo: ya NO se envía email; las respuestas se persisten
-- en BD para verlas desde el dashboard admin.
--
-- Notas:
--   - Idempotente: se puede re-ejecutar sin errores (IF NOT EXISTS).
--   - RLS habilitado con cero policies de SELECT → solo `service_role`
--     (script / server) puede leer. El anon NO ve nada.
-- =============================================================================

-- ─── Tabla: respuestas ────────────────────────────────────────────────────────
-- Cabecera de cada envío (un envío = un set de respuestas al mismo formulario).
CREATE TABLE IF NOT EXISTS respuestas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,
  ip            TEXT,
  user_agent    TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Búsquedas habituales: respuestas de un formulario, ordenadas por fecha desc.
CREATE INDEX IF NOT EXISTS idx_respuestas_formulario
  ON respuestas(formulario_id, submitted_at DESC);

-- ─── Tabla: respuesta_preguntas ───────────────────────────────────────────────
-- Una fila por pregunta respondida. Modelo EAV simple: clave = pregunta_id,
-- valor = texto (suficiente para texto_libre y para opción_multiple donde
-- almacenamos la opción seleccionada).
CREATE TABLE IF NOT EXISTS respuesta_preguntas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respuesta_id UUID NOT NULL REFERENCES respuestas(id) ON DELETE CASCADE,
  pregunta_id  UUID NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  valor        TEXT NOT NULL,
  UNIQUE (respuesta_id, pregunta_id)
);

CREATE INDEX IF NOT EXISTS idx_respuesta_preguntas_respuesta
  ON respuesta_preguntas(respuesta_id);
CREATE INDEX IF NOT EXISTS idx_respuesta_preguntas_pregunta
  ON respuesta_preguntas(pregunta_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Habilitamos RLS en ambas tablas y NO creamos policies de SELECT para
-- anon/authenticated: el cliente público no debe poder leer respuestas.
-- `service_role` bypasea RLS por diseño (lo usa el endpoint /api/submit
-- y los servicios del dashboard).
ALTER TABLE respuestas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE respuesta_preguntas ENABLE ROW LEVEL SECURITY;

-- ─── Comentarios ──────────────────────────────────────────────────────────────
COMMENT ON TABLE respuestas          IS 'Cabecera de cada envío de un formulario (pivot: persistencia en BD)';
COMMENT ON TABLE respuesta_preguntas IS 'Valor de cada pregunta respondida en un envío';
COMMENT ON COLUMN respuestas.ip       IS 'IP del cliente (informativo, sin hashear)';
COMMENT ON COLUMN respuestas.user_agent IS 'User-Agent del cliente (informativo)';
