-- =============================================================================
-- FormProject — Datos de prueba
-- Pegar en Supabase Studio → SQL Editor → New query → Run
-- DESPUÉS de haber ejecutado la migración init.sql
-- =============================================================================

-- 1) Formulario de feedback (3 preguntas, ACTIVO)
INSERT INTO formularios (id, slug, titulo, descripcion, activo)
VALUES (
  'a1b2c3d4-1111-1111-1111-111111111111',
  'feedback-cliente',
  '¿Cómo fue tu experiencia?',
  'Nos encantaría saber tu opinión. Tarda menos de 1 minuto.',
  true
);

INSERT INTO preguntas (formulario_id, orden, tipo, contenido, opciones, requerido) VALUES
  ('a1b2c3d4-1111-1111-1111-111111111111', 0, 'opcion_multiple', '¿Qué servicio utilizaste?',
   '["Consultoría", "Diseño web", "Desarrollo a medida", "Otro"]'::jsonb, true),
  ('a1b2c3d4-1111-1111-1111-111111111111', 1, 'opcion_multiple', '¿Recomendarías nuestro servicio?',
   '["Definitivamente sí", "Probablemente sí", "No estoy seguro", "Probablemente no"]'::jsonb, true),
  ('a1b2c3d4-1111-1111-1111-111111111111', 2, 'texto_libre', '¿Qué podríamos mejorar?',
   NULL, false);

-- 2) Formulario de contacto rápido (2 preguntas, ACTIVO)
INSERT INTO formularios (id, slug, titulo, descripcion, activo)
VALUES (
  'b2c3d4e5-2222-2222-2222-222222222222',
  'contacto-rapido',
  'Contacto rápido',
  NULL,
  true
);

INSERT INTO preguntas (formulario_id, orden, tipo, contenido, opciones, requerido) VALUES
  ('b2c3d4e5-2222-2222-2222-222222222222', 0, 'texto_libre', '¿Cuál es tu nombre?', NULL, true),
  ('b2c3d4e5-2222-2222-2222-222222222222', 1, 'texto_libre', '¿En qué podemos ayudarte?', NULL, true);

-- 3) Formulario INACTIVO (para ver 404)
INSERT INTO formularios (id, slug, titulo, descripcion, activo)
VALUES (
  'c3d4e5f6-3333-3333-3333-333333333333',
  'formulario-inactivo',
  'Este está desactivado',
  'No debería verse',
  false
);

INSERT INTO preguntas (formulario_id, orden, tipo, contenido, opciones, requerido) VALUES
  ('c3d4e5f6-3333-3333-3333-333333333333', 0, 'texto_libre', 'Pregunta en form inactivo', NULL, true);

-- 4) Verificación
SELECT f.slug, f.titulo, f.activo, COUNT(p.id) AS num_preguntas
FROM formularios f
LEFT JOIN preguntas p ON p.formulario_id = f.id
GROUP BY f.id, f.slug, f.titulo, f.activo
ORDER BY f.created_at DESC;
-- Debe devolver 3 formularios:
--   feedback-cliente      | activo=t | 3 preguntas
--   contacto-rapido       | activo=t | 2 preguntas
--   formulario-inactivo   | activo=f | 1 pregunta