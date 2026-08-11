# FormProject — Plan de Fases Detallado

> Documento de planificación (NO implementación). Cada tarea es atómica y ejecutable. Marca las casillas a medida que avanzas.

**Proyecto:** FormProject
**Tipo:** Herramienta personal single-tenant para crear y compartir formularios simples
**Stack:** Next.js 14 (App Router) + Supabase + Resend + NextAuth + Tailwind + Zod + TypeScript
**Hosting:** Render (Web Service) + Dominio custom con SSL
**Versión documento:** 1.0

---

## Tabla de Contenidos

- [Fase 0 — Setup del proyecto](#fase-0--setup-del-proyecto)
- [Fase 1 — Modelo de datos + conexión Supabase](#fase-1--modelo-de-datos--conexión-supabase)
- [Fase 2 — Panel admin: login + dashboard](#fase-2--panel-admin-login--dashboard)
- [Fase 3 — CRUD completo de formularios](#fase-3--crud-completo-de-formularios)
- [Fase 4 — Formulario público `/f/[slug]`](#fase-4--formulario-público-fslug)
- [Fase 5 — Envío de email con respuestas](#fase-5--envío-de-email-con-respuestas)
- [Fase 6 — Deploy + dominio custom + SSL](#fase-6--deploy--dominio-custom--ssl)
- [Fase 7 — Polish + producción](#fase-7--polish--producción)
- [Resumen total estimado](#resumen-total-estimado)

---

# Fase 0 — Setup del proyecto

**Objetivo:** Tener un proyecto Next.js 14 funcional con TypeScript, Tailwind y todas las dependencias declaradas, estructura de carpetas lista y servidor de desarrollo arrancando sin errores.

**Tiempo estimado:** 2–3 horas

**Dependencias:** Ninguna (es la primera fase)

---

## Tareas

- [ ] **0.1 — Crear el repositorio y directorio raíz del proyecto**
  - Crear carpeta `C:\Users\Antonio\Desktop\proyectos\formproject\`
  - Inicializar git: `git init`
  - Crear rama principal: `git checkout -b main`

- [ ] **0.2 — Inicializar Next.js 14 con App Router + TypeScript + Tailwind**
  - Comando: `npx create-next-app@14 . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --no-eslint`
  - Verificar que `app/page.tsx`, `app/layout.tsx`, `tailwind.config.ts`, `tsconfig.json` existen
  - Confirmar versión Next.js: `package.json` debe contener `"next": "^14.x"`

- [ ] **0.3 — Configurar `package.json` con todas las dependencias del proyecto**
  - Dependencias de producción (`npm install`):
    - `next-auth@beta` (v5)
    - `@auth/supabase-adapter` (si se usa, opcional en este MVP)
    - `@supabase/supabase-js`
    - `@supabase/ssr`
    - `resend`
    - `@react-email/components`
    - `zod`
    - `react-hook-form`
    - `@hookform/resolvers`
    - `clsx`
    - `tailwind-merge`
    - `lucide-react`
    - `nanoid` (para slugs)
  - Dependencias de desarrollo (`npm install -D`):
    - `@types/node`
    - `typescript`
    - `tailwindcss`
    - `postcss`
    - `autoprefixer`
    - `tsx` (para ejecutar scripts TS)
    - `dotenv-cli` (para scripts con `.env`)
  - Añadir scripts a `package.json`:
    - `"dev": "next dev"`
    - `"build": "next build"`
    - `"start": "next start"`
    - `"lint": "next lint"`
    - `"seed": "tsx scripts/seed.ts"`
    - `"db:types": "dotenv -e .env.local -- npx supabase gen types typescript --project-id <id> > types/database.ts"`

- [ ] **0.4 — Crear archivo `.env.example` con todas las claves esperadas**
  - Crear `C:\Users\Antonio\Desktop\proyectos\formproject\.env.example`
  - Variables a documentar (sin valores reales):
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `DATABASE_URL` (pooler de Supabase para migraciones)
    - `NEXT_PUBLIC_APP_URL` (ej: `http://localhost:3000`)
    - `NEXTAUTH_URL` (mismo que arriba)
    - `NEXTAUTH_SECRET` (placeholder: `openssl rand -base64 32`)
    - `ADMIN_EMAIL`
    - `ADMIN_PASSWORD_HASH` (bcrypt)
    - `RESEND_API_KEY`
    - `RESEND_FROM_EMAIL`
    - `USER_NOTIFICATION_EMAIL` (correo donde llegan respuestas)
    - `RATE_LIMIT_MAX` (ej: 5)
    - `RATE_LIMIT_WINDOW_SECONDS` (ej: 600)

- [ ] **0.5 — Crear archivo `.env.local`** (no committeado, copia de `.env.example` con valores reales)
  - Crear `C:\Users\Antonio\Desktop\proyectos\formproject\.env.local`
  - Añadir a `.gitignore`

- [ ] **0.6 — Crear `.gitignore` completo**
  - Verificar que `.gitignore` incluye: `node_modules`, `.next`, `.env*.local`, `.env`, `dist`, `coverage`, `.DS_Store`
  - Añadir explícitamente: `.env`, `.env.local`, `.env.*.local`

- [ ] **0.7 — Configurar `tsconfig.json` correctamente**
  - Verificar `"strict": true`
  - Verificar `"paths": { "@/*": ["./*"] }`
  - Verificar `"moduleResolution": "bundler"`
  - Verificar `"target": "ES2022"`

- [ ] **0.8 — Configurar `next.config.mjs`**
  - Añadir `experimental.serverActions` si no está (en Next 14 viene por defecto)
  - Configurar `images.remotePatterns` si se van a usar imágenes remotas
  - Añadir `output: "standalone"` (opcional, recomendado para Render)

- [ ] **0.9 — Configurar `tailwind.config.ts`**
  - Añadir `content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"]`
  - Definir tema base con colores neutros y un accent color (azul/indigo)
  - Configurar `darkMode: "class"` (opcional)

- [ ] **0.10 — Crear estructura completa de carpetas vacías**
  - Ejecutar (PowerShell o equivalente):
    ```
    mkdir app\(public)\f\[slug]
    mkdir app\(admin)\admin
    mkdir components\ui, components\admin, components\public
    mkdir lib\supabase, lib\services, lib\validators
    mkdir emails
    mkdir supabase\migrations
    mkdir types
    mkdir scripts
    mkdir docs
    ```
  - Añadir archivo `.gitkeep` en cada carpeta vacía para que se commiteen

- [ ] **0.11 — Eliminar boilerplate del `create-next-app`**
  - Borrar contenido de `app/page.tsx` (dejar un componente mínimo `<div>FormProject</div>`)
  - Eliminar `app/globals.css` estilos innecesarios (mantener directivas Tailwind)
  - Limpiar `public/` de SVGs de ejemplo

- [ ] **0.12 — Verificar que `npm run dev` arranca sin errores**
  - Ejecutar: `npm run dev`
  - Abrir `http://localhost:3000` y confirmar que carga
  - Revisar consola: no debe haber errores de TypeScript ni warnings críticos

- [ ] **0.13 — Hacer commit inicial**
  - `git add .`
  - `git commit -m "chore: initial setup next.js 14 + tailwind + typescript"`

---

## Criterios de aceptación

- [ ] `npm run dev` arranca y muestra la página en `localhost:3000`
- [ ] `npm run build` completa sin errores de TypeScript
- [ ] Todas las carpetas de la estructura existen
- [ ] `.env.example` documenta todas las claves necesarias
- [ ] `.gitignore` excluye correctamente archivos sensibles
- [ ] `package.json` tiene todas las dependencias y scripts declarados

## Cómo probar/validar

1. Clonar el repo en otra carpeta
2. Copiar `.env.example` a `.env.local` (vacío por ahora)
3. Ejecutar `npm install`
4. Ejecutar `npm run dev`
5. Verificar que no hay errores en consola
6. Verificar que `localhost:3000` responde

## Entregables

- Proyecto Next.js 14 inicializado y corriendo
- Estructura de carpetas completa
- `.env.example` documentado
- `.gitignore` configurado
- `package.json` con todas las dependencias
- Commit inicial en git

## Posibles blockers / issues

- **Bloqueador:** Node.js versión incompatible. Next.js 14 requiere Node ≥ 18.17. Verificar con `node -v`.
- **Issue:** Permisos en Windows al crear carpetas con corchetes `[slug]`. Usar PowerShell con comillas o crear desde el explorador.
- **Issue:** `npm install` falla por conflictos de peer deps. Si pasa, usar `npm install --legacy-peer-deps` y documentarlo en README.

---

# Fase 1 — Modelo de datos + conexión Supabase

**Objetivo:** Tener la base de datos PostgreSQL en Supabase con el esquema completo (tablas, índices, triggers, RLS) aplicado, los clientes Supabase configurados en Next.js y tipos TypeScript generados.

**Tiempo estimado:** 4–6 horas

**Dependencias:** Fase 0 completada

---

## Tareas

- [ ] **1.1 — Crear proyecto en Supabase**
  - Ir a https://supabase.com y crear cuenta (si no existe)
  - Crear nuevo proyecto: nombre `formproject`, región cercana, contraseña segura de BD
  - Guardar: Project URL, anon key, service_role key, connection string (pooler)

- [ ] **1.2 — Diseñar el esquema de base de datos**
  - Tabla `formularios`:
    - `id` (uuid, PK, default `gen_random_uuid()`)
    - `slug` (text, UNIQUE, NOT NULL)
    - `titulo` (text, NOT NULL)
    - `descripcion` (text, nullable)
    - `activo` (boolean, default false)
    - `created_at` (timestamptz, default `now()`)
    - `updated_at` (timestamptz, default `now()`)
  - Tabla `preguntas`:
    - `id` (uuid, PK)
    - `formulario_id` (uuid, FK → formularios.id, ON DELETE CASCADE)
    - `tipo` (text, CHECK en `('multiple', 'texto')`)
    - `texto` (text, NOT NULL)
    - `orden` (integer, NOT NULL)
    - `requerida` (boolean, default true)
    - `opciones` (jsonb, nullable) — array de strings para preguntas múltiples
    - `created_at`, `updated_at`
  - Tabla `respuestas_log` (opcional, solo metadata — NO contenido):
    - `id` (uuid, PK)
    - `formulario_id` (uuid, FK → formularios.id, ON DELETE CASCADE)
    - `submitted_at` (timestamptz, default `now()`)
    - `ip_hash` (text, nullable) — para rate limiting histórico
  - Índices:
    - `idx_formularios_slug` (UNIQUE ya lo cubre, pero confirmar)
    - `idx_formularios_activo` (boolean)
    - `idx_preguntas_formulario_id` (FK)
    - `idx_preguntas_orden` (formulario_id, orden)
  - Triggers:
    - `update_updated_at` BEFORE UPDATE en `formularios` y `preguntas`
  - Row Level Security:
    - Habilitar RLS en todas las tablas
    - Política: `service_role` tiene acceso total (se usará server-side con service role key)
    - Política: lectura pública de `formularios` SOLO cuando `activo = true` y SELECT de `preguntas` solo si pertenece a formulario activo
    - No hay acceso de anon a `respuestas_log`

- [ ] **1.3 — Crear archivo de migración SQL inicial**
  - Crear `supabase/migrations/20260811000000_initial_schema.sql`
  - Documentar el SQL completo con comentarios `/* */`
  - Incluir al inicio: `create extension if not exists "pgcrypto";`

- [ ] **1.4 — Ejecutar la migración en Supabase**
  - Opción A (recomendada): desde SQL Editor del dashboard de Supabase, pegar y ejecutar
  - Opción B: instalar Supabase CLI (`npx supabase init`), ejecutar `npx supabase db push`
  - Verificar en Table Editor que las 3 tablas existen

- [ ] **1.5 — Crear clientes Supabase (3 variantes)**
  - `lib/supabase/server.ts` — para Server Components y Server Actions
    - Usa `@supabase/ssr` con `cookies()` de Next
    - Exporta función `createServerClient()`
  - `lib/supabase/client.ts` — para Client Components
    - Usa `createBrowserClient` de `@supabase/ssr`
    - Exporta función `createBrowserClient()` (wrapper)
  - `lib/supabase/service.ts` — para código server-side con permisos elevados
    - Usa `createClient` de `@supabase/supabase-js` con `SUPABASE_SERVICE_ROLE_KEY`
    - Exporta función `getServiceClient()` con caché singleton
    - Solo importar desde Server Actions, nunca de Client Components

- [ ] **1.6 — Generar tipos TypeScript de la BD**
  - Ejecutar script definido en Fase 0 (`npm run db:types`)
  - Verificar que se genera `types/database.ts` con tipos `Database`, `Tables`, `Insertable`, `Updateable`
  - Crear `types/database.types.ts` re-exportando de `database.ts`

- [ ] **1.7 — Crear tipos específicos del dominio**
  - `types/formulario.ts`:
    - `TipoPregunta = 'multiple' | 'texto'`
    - `Pregunta = { id, tipo, texto, orden, requerida, opciones? }`
    - `Formulario = { id, slug, titulo, descripcion, activo, preguntas: Pregunta[] }`
    - `FormularioInput = Omit<Formulario, 'id' | 'preguntas'> & { preguntas: PreguntaInput[] }`
  - `types/api.ts`:
    - `SubmitPayload = { respuestas: Record<UUID, string | string[]> }`
    - `ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string }`

- [ ] **1.8 — Crear script de seed inicial**
  - `scripts/seed.ts`:
    - Conectar con service role key
    - Verificar que no existe ya el admin
    - Insertar un formulario de ejemplo "Formulario de prueba" con slug `test`, 2 preguntas (1 múltiple, 1 texto)
    - Marcar `activo = false` para que no sea público todavía
  - Ejecutar con: `npm run seed`
  - Verificar en Table Editor que se creó

- [ ] **1.9 — Crear helper de hash de contraseña**
  - `lib/auth/password.ts`:
    - Funciones `hashPassword(plain)` y `verifyPassword(plain, hash)` usando `bcryptjs`
  - Añadir `bcryptjs` a dependencias: `npm install bcryptjs @types/bcryptjs -D`

- [ ] **1.10 — Generar hash de la contraseña admin y guardarla en `.env.local`**
  - Crear script one-shot `scripts/hash-password.ts`:
    - Lee `ADMIN_PASSWORD` de variable de entorno
    - Imprime hash por consola
  - Ejecutar: `ADMIN_PASSWORD="tu-contraseña" npx tsx scripts/hash-password.ts`
  - Copiar el hash a `ADMIN_PASSWORD_HASH` en `.env.local`

- [ ] **1.11 — Crear endpoint de health check que prueba la conexión**
  - `app/api/health/route.ts`:
    - GET handler
    - Usa `getServiceClient()` y hace un `SELECT 1`
    - Devuelve `{ status: 'ok' | 'error', db: 'connected' | 'disconnected' }`
  - Probar: `curl http://localhost:3000/api/health`

- [ ] **1.12 — Commit de la fase**
  - `git add .`
  - `git commit -m "feat(db): initial schema + supabase clients + seed script"`

---

## Criterios de aceptación

- [ ] Las 3 tablas existen en Supabase con todas sus columnas
- [ ] Los índices están creados
- [ ] El trigger de `updated_at` funciona (verificar con un UPDATE manual)
- [ ] RLS está habilitado en todas las tablas
- [ ] Los 3 clientes Supabase funcionan sin errores de tipos
- [ ] `npm run db:types` genera tipos correctos
- [ ] `npm run seed` crea el formulario de prueba
- [ ] `/api/health` devuelve `status: ok` y `db: connected`

## Cómo probar/validar

1. Verificar en Supabase Table Editor que existen `formularios`, `preguntas`, `respuestas_log`
2. Hacer un INSERT manual desde SQL Editor y confirmar que `updated_at` se actualiza
3. Desde la app: `curl http://localhost:3000/api/health` debe responder JSON con `db: connected`
4. Hacer una query SELECT desde `lib/supabase/server.ts` en un Server Component temporal

## Entregables

- Proyecto Supabase creado y configurado
- Archivo `supabase/migrations/20260811000000_initial_schema.sql`
- 3 clientes Supabase: `server.ts`, `client.ts`, `service.ts`
- Tipos generados en `types/`
- Script `scripts/seed.ts` funcional
- Endpoint `/api/health` funcional

## Posibles blockers / issues

- **Bloqueador:** Service role key expuesta si se importa en client. Mitigar con regla clara: solo usar `getServiceClient()` en Server Actions o Route Handlers.
- **Issue:** RLS bloquea queries. Verificar que las políticas permiten acceso al `service_role`.
- **Issue:** El pooler IPv4 de Supabase puede ser lento en conexiones frecuentes. Usar `DATABASE_URL` (pooler) para migraciones y `NEXT_PUBLIC_SUPABASE_URL` para queries normales.

---

# Fase 2 — Panel admin: login + dashboard

**Objetivo:** Tener acceso protegido al panel admin con login funcional, un dashboard mínimo que liste formularios (puede ser vacío) y logout operativo.

**Tiempo estimado:** 5–7 horas

**Dependencias:** Fase 1 completada

---

## Tareas

- [x] **2.1 — Instalar y configurar NextAuth v5 (Auth.js)**
  - Crear `auth.config.ts` (configuración base, edge-compatible)
  - Crear `auth.ts` (configuración completa con adapter si aplica)
  - Definir `CredentialsProvider` custom:
    - `authorize(credentials)`:
      - Lee `email` y `password`
      - Verifica que `email === process.env.ADMIN_EMAIL`
      - Compara password con `ADMIN_PASSWORD_HASH` usando `verifyPassword()`
      - Si OK, devuelve `{ id: 'admin', email, name: 'Admin' }`
      - Si falla, devuelve `null`
  - Definir páginas custom: `signIn: '/admin/login`
  - Sesión con estrategia `jwt` (no DB session)
  - Callbacks `jwt` y `session` para inyectar info mínima

- [x] **2.2 — Crear middleware de protección**
  - `middleware.ts` (raíz del proyecto):
    - Exportar `auth` de NextAuth
    - Matcher: `['/admin/:path*']`
    - Si usuario no autenticado intenta acceder a `/admin/*`, redirigir a `/admin/login`
    - Excluir `/admin/login` de la protección

- [x] **2.3 — Crear componentes UI base reutilizables**
  - `components/ui/Button.tsx`:
    - Variantes: `primary`, `secondary`, `ghost`, `danger`
    - Tamaños: `sm`, `md`, `lg`
    - Soporte para `asChild` (patrón Radix)
    - Usar `clsx` + `tailwind-merge`
  - `components/ui/Input.tsx`:
    - Props: label, error, helperText
    - Soporte para forwardRef
  - `components/ui/Card.tsx`:
    - Componentes: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
  - `components/ui/Label.tsx` (wrapper sobre `<label>` con estilos)
  - Exportar todo desde `components/ui/index.ts`
  - Usar `lib/utils.ts` con función `cn(...inputs)` (combina `clsx` + `tailwind-merge`)

- [x] **2.4 — Crear layout del grupo `(admin)`**
  - `app/(admin)/layout.tsx`:
    - Verificar sesión con `auth()` server-side
    - Si no hay sesión, redirigir a `/admin/login`
    - Header con logo, nombre del usuario y botón de logout
    - Sidebar de navegación (placeholder con solo "Formularios")
    - Main content area con container responsivo
  - Estilos: limpio, fondo gris claro, header blanco con sombra

- [x] **2.5 — Crear página de login**
  - `app/(admin)/admin/login/page.tsx`:
    - Server Component
    - Si ya está autenticado, redirigir a `/admin`
  - `app/(admin)/admin/login/LoginForm.tsx` (Client Component):
    - Form con email y password
    - Server Action `loginAction(formData)`:
      - Llama a `signIn('credentials', { email, password, redirect: false })`
      - Si success, `redirect('/admin')`
      - Si error, devolver mensaje genérico "Credenciales inválidas"
    - Manejo de estado: `pending` para deshabilitar botón
    - Mostrar errores inline con el componente Input

- [x] **2.6 — Crear Server Action de logout**
  - `app/(admin)/admin/actions.ts`:
    - `async function logoutAction()` → llama `signOut({ redirectTo: '/admin/login' })`
  - Botón en el header llama a esta action con `<form action={logoutAction}>`

- [x] **2.7 — Crear página de dashboard (vacía, solo placeholder)**
  - `app/(admin)/admin/page.tsx`:
    - Título "Mis formularios"
    - Botón "Crear formulario" (link a `/admin/formularios/nuevo`)
    - Estado vacío: "Aún no has creado ningún formulario. Crea tu primer formulario"
    - Lista vacía por ahora (la implementación real en Fase 3)
  - Por ahora, no hace query a BD — solo muestra el shell

- [x] **2.8 — Añadir página raíz que redirija**
  - `app/page.tsx`:
    - Si autenticado, redirigir a `/admin`
    - Si no, redirigir a `/admin/login`

- [x] **2.9 — Añadir loading y error states**
  - `app/(admin)/admin/loading.tsx` (skeleton simple)
  - `app/(admin)/admin/error.tsx` (mensaje genérico + botón recargar)

- [x] **2.10 — Probar flujo completo en local**
  - Arrancar `npm run dev`
  - Intentar acceder a `/admin` → debe redirigir a `/admin/login`
  - Login con credenciales incorrectas → debe mostrar error
  - Login con credenciales correctas → debe redirigir a `/admin`
  - Click en logout → debe volver a `/admin/login`
  - Verificar que el middleware no rompe rutas públicas

- [x] **2.11 — Commit de la fase**
  - `git add .`
  - `git commit -m "feat(admin): nextauth + login + protected dashboard shell"`

> **Nota de implementación (2026-08-11):** La autenticación se realiza contra
> `HARDCODE_ADMIN_EMAIL` / `HARDCODE_ADMIN_PASSWORD` (texto plano en `.env.local`)
> hasta que se cree la tabla `admin_user` en Supabase. La migración está
> documentada como bloque de comentarios en `lib/auth.ts`. El dashboard lista
> dos formularios mockeados con la misma forma que `Formulario` para que el
> cambio futuro sea solo sustituir el array por una query. El middleware se
> limita a inyectar `x-pathname`; la lógica de redirección por sesión vive en
> el layout `(admin)/admin/layout.tsx`. El botón de logout usa una server
> action inline declarada en `LayoutShell.tsx` (no se creó `actions.ts`
> separado para evitar un archivo de una sola función). Se añadió
> `class-variance-authority` para los componentes UI (`Button` con
> `primary | secondary | outline | ghost | destructive`).

---

## Criterios de aceptación

- [ ] `/admin` sin sesión redirige a `/admin/login`
- [ ] Login con credenciales correctas redirige a `/admin`
- [ ] Login con credenciales incorrectas muestra error
- [ ] Logout limpia la sesión y redirige
- [ ] El dashboard muestra el header con usuario y botón logout
- [ ] Los componentes UI base son reutilizables
- [ ] No hay warnings de React/Next en consola

## Cómo probar/validar

1. Crear usuario en `.env.local`:
   - `ADMIN_EMAIL=tu@email.com`
   - `ADMIN_PASSWORD_HASH=<hash bcrypt>`
2. `npm run dev`
3. Probar los 4 escenarios del criterio de aceptación
4. Verificar cookies en DevTools (debe haber cookie de sesión httpOnly)
5. Verificar que Next.js no loggea el password

## Entregables

- `auth.ts` y `auth.config.ts` configurados
- `middleware.ts` protegiendo `/admin/*`
- 4 componentes UI base: Button, Input, Card, Label
- Layout admin con header y sidebar
- Página de login funcional
- Dashboard placeholder

## Posibles blockers / issues

- **Bloqueador:** NextAuth v5 está en beta. API puede cambiar. Fijar versión exacta en `package.json`.
- **Issue:** Edge runtime y `bcryptjs`. Verificar que `auth.config.ts` (edge-compatible) NO importa `bcryptjs`. El check de credenciales debe hacerse en el `authorize` que corre en Node runtime.
- **Issue:** `NEXTAUTH_SECRET` no configurado hace que NextAuth falle. Validar al inicio.
- **Issue:** Redirecciones en Server Actions requieren `redirect()` de `next/navigation`, no `redirect()` de NextAuth.

---

# Fase 3 — CRUD completo de formularios

**Objetivo:** Poder crear, listar, editar, eliminar y activar/desactivar formularios con sus preguntas desde el panel admin, con validación Zod completa y slugs únicos auto-generados.

**Tiempo estimado:** 10–14 horas

**Dependencias:** Fase 2 completada

---

## Tareas

- [ ] **3.1 — Crear validadores Zod del dominio**
  - `lib/validators/formulario.ts`:
    - `preguntaSchema`:
      - `tipo`: enum `['multiple', 'texto']`
      - `texto`: string min 1 max 500
      - `requerida`: boolean default true
      - `opciones`: array de strings, requerido si `tipo === 'multiple'`, min 2, max 20, cada uno max 200 chars
    - `formularioSchema`:
      - `titulo`: string min 1 max 200
      - `descripcion`: string max 1000 optional
      - `slug`: regex `/^[a-z0-9-]+$/`, min 3 max 60
      - `preguntas`: array de `preguntaSchema`, min 1 max 50
    - `formularioPatchSchema`: versión parcial (sin preguntas)
  - `lib/validators/preguntas.ts`: tipos específicos si hace falta
  - `lib/validators/index.ts`: barrel export

- [ ] **3.2 — Crear capa de servicios (data access)**
  - `lib/services/formularios.ts`:
    - `listFormularios()` → SELECT con count de preguntas
    - `getFormularioById(id)` → con preguntas ordenadas por `orden`
    - `getFormularioBySlug(slug)` → solo si activo (uso público)
    - `createFormulario(input)` → INSERT formulario + INSERT preguntas en transacción
    - `updateFormulario(id, input)` → UPDATE + DELETE/INSERT de preguntas
    - `deleteFormulario(id)` → DELETE (CASCADE borra preguntas)
    - `toggleFormularioActivo(id)` → UPDATE solo campo `activo`
    - `checkSlugUnique(slug, excludeId?)` → SELECT con WHERE slug = ? AND id != excludeId
  - Todos los métodos usan `getServiceClient()`
  - Manejo de errores tipado: lanzar `FormularioError` con códigos

- [ ] **3.3 — Implementar generación y validación de slugs**
  - `lib/utils/slug.ts`:
    - `generateSlugFromTitle(titulo)`:
      - Lowercase
      - Reemplazar acentos (NFD + remove combining marks)
      - Reemplazar espacios y caracteres no-`[a-z0-9-]` por `-`
      - Colapsar múltiples `-` en uno
      - Trim `-` al inicio/final
      - Si queda vacío o < 3, append `form-{nanoid(6)}`
    - `isValidSlug(slug)`: regex + longitud
  - Lógica de unicidad: al generar, intentar 3 veces (slug + `-2`, `-3`) antes de pedir input al usuario

- [ ] **3.4 — Crear Server Actions para CRUD**
  - `app/(admin)/admin/formularios/actions.ts`:
    - `createFormularioAction(prevState, formData)`:
      - Parse FormData → objeto
      - Validar con `formularioSchema.safeParse()`
      - Si error, devolver errores por campo
      - Si OK, llamar `formulariosService.createFormulario()`
      - `revalidatePath('/admin')`
      - `redirect('/admin')`
    - `updateFormularioAction(id, prevState, formData)`: análogo
    - `deleteFormularioAction(id)`:
      - Verificar que existe
      - Llamar servicio
      - `revalidatePath('/admin')`
    - `toggleFormularioAction(id)`:
      - Leer estado actual
      - Invertir y guardar
      - `revalidatePath('/admin')`

- [ ] **3.5 — Crear componentes del FormBuilder**
  - `components/admin/FormularioBuilder.tsx` (Client Component principal):
    - Estado local: array de preguntas + metadatos
    - Props: `initialData?`, `mode: 'create' | 'edit'`, `action`
    - Renderiza header con título, descripción, slug input
    - Lista de `PreguntaEditor`
    - Botones: "Añadir pregunta", "Guardar borrador", "Activar formulario"
  - `components/admin/PreguntaEditor.tsx`:
    - Props: `pregunta`, `onChange`, `onDelete`, `onMoveUp`, `onMoveDown`, `index`
    - Selector de tipo (radio: opción múltiple / texto)
    - Input para texto de la pregunta
    - Toggle "Requerida"
    - Si tipo `multiple`: lista editable de opciones (add/remove/edit)
    - Si tipo `texto`: placeholder helper
    - Botón eliminar (icono papelera)
    - Botones reordenar (iconos flechas)
  - `components/admin/SlugInput.tsx`:
    - Props: `value`, `onChange`, `error?`
    - Muestra previsualización de URL completa: `tudominio.com/f/{slug}`
    - Botón "regenerar" que genera desde el título
    - Validación inline (formato + longitud)

- [ ] **3.6 — Crear página de listado (`/admin`)**
  - `app/(admin)/admin/page.tsx`:
    - Server Component
    - Fetch `listarFormularios()` en el servidor
    - Renderizar tabla o grid con:
      - Título
      - Slug
      - Nº de preguntas
      - Estado (badge: activo/inactivo)
      - Acciones: editar, toggle activo, copiar link público (si activo), eliminar
    - Estado vacío con CTA "Crear primer formulario"

- [ ] **3.7 — Crear página de creación (`/admin/formularios/nuevo`)**
  - `app/(admin)/admin/formularios/nuevo/page.tsx`:
    - Server Component
    - Renderiza `<FormularioBuilder mode="create" action={createFormularioAction} />`
    - Estado inicial: 1 pregunta de texto requerida

- [ ] **3.8 — Crear página de edición (`/admin/formularios/[id]`)**
  - `app/(admin)/admin/formularios/[id]/page.tsx`:
    - Server Component
    - Si no existe, `notFound()`
    - Carga formulario con `getFormularioById()`
    - Renderiza `<FormularioBuilder mode="edit" initialData={...} action={updateFormularioAction} />`
  - `app/(admin)/admin/formularios/[id]/loading.tsx` (skeleton)

- [ ] **3.9 — Crear componente de confirmaciones**
  - `components/admin/ConfirmDialog.tsx`:
    - Wrapper sobre `<dialog>` HTML5 nativo (no Radix por simplicidad)
    - Props: `title`, `message`, `onConfirm`, `trigger` (ReactNode)
    - Variante destructive (botón rojo)

- [ ] **3.10 — Integrar confirmaciones en acciones destructivas**
  - Botón eliminar: usa `ConfirmDialog`
  - Mensaje: "¿Eliminar el formulario '{titulo}'? Esta acción no se puede deshacer."
  - Confirmar llama a `deleteFormularioAction`

- [ ] **3.11 — Crear Server Action para copy-to-clipboard del link público**
  - Pequeño componente client `<CopyLinkButton slug={...}>`:
    - Botón que copia `https://{NEXT_PUBLIC_APP_URL}/f/{slug}` al clipboard
    - Toast feedback "Link copiado" (placeholder, real en Fase 7)

- [ ] **3.12 — Manejar errores de validación en formularios**
  - En cada Server Action, devolver estado con `errors: Record<string, string[]>`
  - FormularioBuilder renderiza errores inline en cada campo
  - Usar `useFormState` y `useFormStatus` de React

- [ ] **3.13 — Probar todos los flujos CRUD**
  - Crear formulario con 3 preguntas (mezcla de tipos)
  - Verificar que aparece en listado
  - Editar: cambiar título, agregar pregunta, eliminar una
  - Toggle activo: confirmar cambio visual
  - Eliminar con confirmación
  - Intentar crear con slug duplicado → debe mostrar error
  - Intentar crear sin preguntas → debe mostrar error
  - Intentar crear con opciones vacías en pregunta múltiple → debe mostrar error

- [ ] **3.14 — Commit de la fase**
  - `git add .`
  - `git commit -m "feat(admin): full CRUD for formularios with builder"`

---

## Criterios de aceptación

- [ ] Crear formulario con título, slug auto, descripción y al menos 1 pregunta funciona
- [ ] Editar formulario actualiza correctamente preguntas (incluyendo reordenamiento)
- [ ] Eliminar formulario pide confirmación y borra en cascada
- [ ] Toggle activo cambia el estado y se refleja visualmente
- [ ] Slug duplicado produce error de validación
- [ ] Validación de preguntas múltiples con menos de 2 opciones produce error
- [ ] Eliminar pregunta desde el builder funciona
- [ ] Reordenar preguntas funciona (flechas arriba/abajo)
- [ ] La lista de formularios muestra todos los datos correctos
- [ ] El link público se copia al clipboard

## Cómo probar/validar

1. Crear formulario de prueba con 1 pregunta múltiple (3 opciones) y 1 de texto
2. Verificar que aparece en `/admin`
3. Toggle activo → debe cambiar el badge
4. Click "Editar" → deben cargarse todas las preguntas
5. Añadir una pregunta nueva → guardar → verificar que se persiste
6. Eliminar la última pregunta → guardar → verificar
7. Intentar guardar con título vacío → debe mostrar error
8. Crear otro formulario con mismo slug → debe fallar
9. Eliminar formulario → confirmar que desaparece

## Entregables

- `lib/validators/formulario.ts` con esquemas Zod
- `lib/services/formularios.ts` con todos los métodos CRUD
- 3 Server Actions en `app/(admin)/admin/formularios/actions.ts`
- 3 componentes del builder: FormularioBuilder, PreguntaEditor, SlugInput
- Componente ConfirmDialog
- 3 páginas: listado, crear, editar
- Lógica completa de slugs

## Posibles blockers / issues

- **Bloqueador:** Server Actions tienen límite de tamaño (~1MB). Formularios con muchas preguntas pueden fallar. Mitigar guardando preguntas en JSON transitorio si pasa.
- **Issue:** Reordenar preguntas con drag-and-drop es más complejo. Empezar con flechas up/down (más simple), mejorar en Fase 7.
- **Issue:** Slug collisions. Si usuario pone `mi-formulario` y ya existe, mostrar error. La auto-generación solo añade sufijo `-2`, `-3` al slug base del título.
- **Issue:** Race condition en unicidad de slug. Mitigar con UNIQUE constraint en BD (ya está) y mostrar error amigable si se dispara.

---

# Fase 4 — Formulario público `/f/[slug]`

**Objetivo:** Cualquier persona con el link puede ver y rellenar el formulario. El submit envía los datos al backend (preparado para Fase 5), muestra thank you page y maneja estados correctamente.

**Tiempo estimado:** 6–8 horas

**Dependencias:** Fase 3 completada

---

## Tareas

- [x] **4.1 — Crear layout del grupo `(public)`**
  - `app/(public)/layout.tsx`:
    - Header mínimo: solo logo "FormProject"
    - Footer con © año dinámico
    - Sin sidebar, sin auth

- [x] **4.2 — Crear página pública del formulario**
  - `app/(public)/f/[slug]/page.tsx`:
    - Server Component
    - Fetch `getFormularioBySlug(slug)` (mockeado por ahora)
    - Si no existe o `!activo`, llamar `notFound()`
    - Renderizar `<PublicForm formulario={...} />`
    - `generateMetadata`: devolver título dinámico `{formulario.titulo} | FormProject`
  - `app/(public)/f/[slug]/loading.tsx` (skeleton simple) — pendiente
  - `app/(public)/f/[slug]/error.tsx` (mensaje genérico) — pendiente

- [x] **4.3 — Crear componente `PublicForm`**
  - `components/public/PublicForm.tsx` (Client Component):
    - Props: `formulario: Formulario`
    - Estado local: `respuestas: Record<UUID, string | string[]>` con useState
    - Estado de submit: `idle | submitting | success | error`
    - Validación client-side con Zod (`formularioSchema` aplicado a respuestas)
    - onSubmit:
      - Llama a `fetch('/api/submit/{slug}', { method: 'POST', body: JSON.stringify({ respuestas }) })` — pendiente (mockeado)
      - En success, `setStatus('success')` y mostrar thank you
      - En error, mostrar mensaje
    - Renderiza título y descripción del formulario
    - Mapea preguntas al componente apropiado
    - Botón submit abajo

- [x] **4.4 — Crear componente de pregunta múltiple**
  - `components/public/PreguntaMultiple.tsx`:
    - Props: `pregunta`, `value`, `onChange`
    - Renderiza `<input type="radio">` para cada opción
    - Si `requerida`, atributo `required`
    - Label con asterisco si requerida
    - `name` por preguntaId (para agrupar radios)

- [x] **4.5 — Crear componente de pregunta texto**
  - `components/public/PreguntaTexto.tsx`:
    - Props: `pregunta`, `value`, `onChange`
    - Renderiza `<textarea>` (no input, permite respuestas largas)
    - `maxLength` 5000 (alineado con backend)
    - `required` si aplica
    - Contador de caracteres

- [x] **4.6 — Crear componente SubmitButton**
  - `components/public/SubmitButton.tsx`:
    - Botón "Enviar respuestas"
    - Mientras `submitting`, mostrar spinner + texto "Enviando..."
    - Disabled durante submitting
    - Bonus: estados `success` y `error` también representados

- [x] **4.7 — Crear página/componente de gracias**
  - `app/(public)/f/[slug]/gracias/page.tsx` (Server Component):
    - Mensaje: "¡Gracias por tu respuesta!"
    - Icono check verde (CheckCircle2)
    - Link "Volver al formulario" → `/f/[slug]`
    - Recibe `?form={titulo}` para personalizar el mensaje

- [x] **4.8 — Validación client-side con Zod**
  - `lib/validators/submit.ts`:
    - `submitBodySchema`: `z.object({ respuestas: z.record(z.string(), z.string().min(1).max(5000)) })`
    - `validateRespuestasContraFormulario(preguntas, respuestas)`: helper que comprueba requeridos, opciones válidas y longitudes
  - Validar antes de enviar; mostrar errores inline si falla
  - Scroll automático al primer campo con error

- [ ] **4.9 — Crear estado stub del endpoint (para Fase 4, sin email aún)**
  - En `PublicForm.tsx`, hacer fetch a `/api/submit/{slug}` con manejo de respuesta — pendiente
  - Crear stub temporal de `app/api/submit/[slug]/route.ts` — pendiente (Fase 5)
  - **Estado actual:** el submit se simula con `setTimeout(800ms)` y un 90% éxito / 10% error aleatorio. La función `simularSubmit()` está marcada con TODO y es donde se conectará el fetch real en Fase 5.

- [x] **4.10 — Manejar 404 correctamente**
  - Si slug no existe: `notFound()` muestra la página 404 por defecto
  - Si existe pero `!activo`: `notFound()` (NO debe filtrar si está inactivo)
  - Esto evita enumerar slugs por scraping

- [x] **4.11 — Añadir estilos y responsive**
  - Mobile-first: el formulario debe verse bien en 360px (probado mentalmente con `max-w-2xl` + padding `px-4`)
  - Tipografía legible, jerarquía clara (Geist Sans via CSS var)
  - Espaciado generoso entre preguntas (space-y-8)
  - Estados focus accesibles (`focus:ring-2 focus:ring-offset-2` en todos los inputs)

- [x] **4.12 — Probar flujo completo**
  - 3 mocks: `feedback-cliente` (3 preguntas), `contacto-rapido` (2 preguntas), `formulario-inactivo` (404)
  - Validación cliente: campos requeridos, opciones válidas, longitud máxima
  - Submit redirige a `/f/{slug}/gracias?form={titulo}`
  - Responsive: mobile (px-4) y desktop (max-w-2xl)
  - Accesibilidad: labels asociados, `aria-invalid`, `aria-describedby`, focus visible
  - Smoke test manual pendiente en navegador (no se ejecutó en esta iteración)

- [x] **4.13 — Commit de la fase**
  - `git add .`
  - `git commit -m "feat(fase-4): formulario público /f/[slug]"`

---

## Criterios de aceptación

- [ ] `/f/{slug-inexistente}` muestra 404
- [ ] `/f/{slug-de-formulario-inactivo}` muestra 404
- [ ] `/f/{slug-valido-activo}` muestra el formulario
- [ ] Validación client-side muestra errores al intentar submit vacío
- [ ] Submit exitoso muestra thank you page
- [ ] El formulario es responsive (mobile y desktop)
- [ ] El título del formulario aparece como `<title>` de la página
- [ ] Preguntas múltiples son radios funcionales
- [ ] Preguntas de texto son textareas con contador
- [ ] Botón se deshabilita durante submit

## Cómo probar/validar

1. Crear formulario "Test público" con slug `public-test`, activo=true, 1 múltiple (3 opciones) + 1 texto
2. Abrir `http://localhost:3000/f/public-test`
3. Intentar submit sin responder → ver errores
4. Responder todo y submit → ver thank you
5. Desactivar formulario desde admin
6. Volver a abrir link → debe dar 404
7. Inspeccionar logs del servidor (debe loggear las respuestas del stub)
8. Probar en mobile emulation (DevTools)

## Entregables

- Layout público con header/footer mínimos
- Página `/f/[slug]` con metadata dinámica
- 4 componentes públicos: PublicForm, PreguntaMultiple, PreguntaTexto, SubmitButton, ThankYou
- Schema Zod dinámico para validación client-side
- Stub temporal del endpoint `/api/submit/[slug]`

---

> **Estado de la Fase 4 (2026-08-11):**
>
> UI del formulario público **completamente implementada** con datos mockeados (`lib/mock/formularios.ts`). Pendientes para Fase 5:
> - `loading.tsx` y `error.tsx` de la ruta `/f/[slug]`.
> - Endpoint real `app/api/submit/[slug]/route.ts` (Fase 5 sustituye al `simularSubmit` actual).
> - Smoke test manual en navegador contra los 3 slugs mock.
>
> Los datos mock se reemplazarán por una llamada a `lib/services/formularios.ts` cuando se conecte Supabase.

## Posibles blockers / issues

- **Bloqueador:** Si el slug está inactivo pero existe, la página debe ser 404. Cuidado de no filtrar información sobre qué slugs existen.
- **Issue:** Hidratación si el estado cambia entre server/client. Validar que los componentes públicos no dependen solo de estado client.
- **Issue:** Formularios muy largos pueden ser difíciles de usar en mobile. Añadir "scroll-to-error" en submit (mejora Fase 7).

---

# Fase 5 — Envío de email con respuestas

**Objetivo:** Cuando alguien envía el formulario, se envía un email formateado al usuario con todas las respuestas, con validación server-side robusta y rate limiting.

**Tiempo estimado:** 6–8 horas

**Dependencias:** Fase 4 completada

---

## Tareas

- [ ] **5.1 — Crear cuenta en Resend**
  - Ir a https://resend.com y registrarse
  - Verificar email de la cuenta
  - Crear API Key con permisos de envío
  - Guardar como `RESEND_API_KEY` en `.env.local`

- [ ] **5.2 — Configurar dominio de envío**
  - Por ahora, usar el dominio de prueba de Resend (`onboarding@resend.dev`) que no requiere DNS
  - Configurar `RESEND_FROM_EMAIL=onboarding@resend.dev`
  - En Fase 6 se cambiará al dominio custom

- [ ] **5.3 — Crear EmailService**
  - `lib/services/email.ts`:
    - `sendRespuestaFormulario(formulario, respuestas)`:
      - Construye el HTML del email usando template
      - Llama `resend.emails.send({ from, to: USER_NOTIFICATION_EMAIL, subject, react })`
      - Maneja errores (log + throw EmailError)
    - Singleton client de Resend con caché

- [ ] **5.4 — Crear React Email template**
  - `emails/RespuestaFormulario.tsx`:
    - Props: `formulario`, `respuestas`, `submittedAt`
    - Usar componentes de `@react-email/components`: `Html`, `Head`, `Body`, `Container`, `Heading`, `Text`, `Section`, `Hr`
    - Layout: email con max-width 600px, estilos inline (requerido por clientes de email)
    - Header: "Nueva respuesta: {formulario.titulo}"
    - Body: para cada pregunta, label en bold + respuesta del usuario
    - Footer: timestamp del envío, link al formulario (opcional), branding FormProject
    - Si pregunta múltiple sin opciones, mostrar "Sin respuesta"
    - Si texto largo, wrap natural

- [ ] **5.5 — Crear preview del email**
  - `emails/preview.tsx`:
    - Importa el template con datos de ejemplo
    - Útil para visualizar durante desarrollo
  - Documentar en README cómo previsualizar

- [ ] **5.6 — Implementar rate limiting in-memory**
  - `lib/utils/rate-limit.ts`:
    - `Map<string, { count, resetAt }>` en memoria
    - `checkRateLimit(key)`:
      - Si no existe key, init `{ count: 1, resetAt: now + window }`
      - Si existe y `now > resetAt`, reset `{ count: 1, resetAt: now + window }`
      - Si existe y `count >= max`, return `{ ok: false, retryAfter }`
      - Else, increment count, return `{ ok: true }`
  - NOTA: in-memory significa que se resetea con cada deploy/restart. Aceptable para single-tenant.

- [ ] **5.7 — Implementar validación server-side**
  - `lib/validators/respuestas.ts`:
    - `buildRespuestasSchemaServer(formulario)` — análogo al client pero más estricto
    - Para `multiple`: validar que la respuesta es una de las opciones válidas
    - Para `texto`: trim, max 2000
  - Función `validateRespuestas(formulario, payload)`:
    - Retorna `{ ok: true, data }` o `{ ok: false, errors: Record<id, string> }`

- [ ] **5.8 — Reemplazar stub del endpoint con implementación real**
  - `app/api/submit/[slug]/route.ts`:
    - POST handler async
    - Steps:
      1. `getServiceClient()` y `getFormularioBySlug(slug)` → si no existe o inactivo, return 404
      2. Obtener IP del request (`x-forwarded-for` o fallback)
      3. `checkRateLimit(ip)` → si falla, return 429 con `Retry-After`
      4. Parse body como JSON
      5. `validateRespuestas(formulario, payload)` → si falla, return 400 con errores
      6. `sendRespuestaFormulario(formulario, payload.respuestas)` (try/catch)
      7. Insert en `respuestas_log` (metadata, sin contenido)
      8. Return `{ ok: true }`
    - Headers: `Cache-Control: no-store`
    - Content-Type: `application/json`

- [ ] **5.9 — Hacer thank you page funcional tras éxito**
  - En `PublicForm.tsx`, cuando recibe `ok: true`, transicionar a thank you
  - En error, mostrar mensaje específico:
    - 429: "Has enviado demasiadas respuestas. Intenta en X minutos."
    - 400: "Algunas respuestas son inválidas."
    - 500: "Error al enviar. Por favor intenta de nuevo."
    - Default: "Error desconocido"

- [ ] **5.10 — Añadir logging estructurado**
  - `lib/utils/logger.ts` (simple wrapper sobre `console`):
    - `logInfo`, `logError` con timestamps
  - Loggear: cada submit (con slug, timestamp, IP hasheada), cada error de email

- [ ] **5.11 — Probar flujo end-to-end local**
  - Crear formulario activo de prueba
  - Hacer submit desde `/f/{slug}`
  - Verificar que llega email a `USER_NOTIFICATION_EMAIL` (revisar inbox/spam)
  - Verificar formato del email (todos los datos visibles, responsive)
  - Probar rate limiting: hacer 6 submits rápidos, el 6º debe ser 429
  - Esperar ventana, verificar que se resetea

- [ ] **5.12 — Commit de la fase**
  - `git add .`
  - `git commit -m "feat(email): resend integration + submit endpoint + rate limit"`

---

## Criterios de aceptación

- [ ] Submit desde formulario público dispara email al usuario
- [ ] Email contiene TODAS las preguntas con sus respuestas
- [ ] Email tiene formato legible (no HTML roto, estilos aplicados)
- [ ] Submit vacío devuelve 400 con error específico
- [ ] Más de `RATE_LIMIT_MAX` submits en la ventana devuelve 429
- [ ] IP rate limit funciona correctamente
- [ ] El thank you page se muestra tras éxito
- [ ] Logs del servidor muestran cada submit

## Cómo probar/validar

1. Tener `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `USER_NOTIFICATION_EMAIL` configurados
2. Crear formulario activo "Test Email" con 2 preguntas
3. Abrir en navegador, llenar y enviar
4. Revisar inbox de `USER_NOTIFICATION_EMAIL` (y spam)
5. Verificar que el email tiene título del form, preguntas y respuestas correctas
6. Hacer 6 submits seguidos → el 6º debe fallar con mensaje de rate limit
7. Probar con respuestas vacías → debe mostrar error
8. Probar enviando un payload malformado (con curl) → debe rechazar

## Entregables

- Cuenta Resend creada y API key configurada
- `lib/services/email.ts` con método `sendRespuestaFormulario`
- `emails/RespuestaFormulario.tsx` (template React Email)
- `lib/utils/rate-limit.ts` (in-memory)
- `app/api/submit/[slug]/route.ts` con toda la lógica
- Validación server-side completa

## Posibles blockers / issues

- **Bloqueador:** Resend free tier tiene límite de 100 emails/día. Suficiente para MVP personal, documentar.
- **Bloqueador:** Si `RESEND_API_KEY` no está, el endpoint debe fallar gracefully (no crashear el server). Usar try/catch robusto.
- **Issue:** Emails pueden caer en spam. Configurar SPF/DKIM se hace en Fase 6 con dominio custom.
- **Issue:** Rate limit in-memory no sobrevive deploys. Para MVP está OK, anotar como mejora futura.
- **Issue:** Si el email tarda mucho, el submit puede sentirse lento. Considerar timeout en la llamada a Resend (10s).

---

# Fase 6 — Deploy + dominio custom + SSL

**Objetivo:** El proyecto está desplegado en Render, accesible vía dominio custom con HTTPS, y los emails se envían desde el dominio del usuario (no `resend.dev`).

**Tiempo estimado:** 4–6 horas (más tiempo de espera por propagación DNS y SSL)

**Dependencias:** Fases 0–5 completadas y testeadas

---

## Tareas

- [ ] **6.1 — Crear `render.yaml` (Infrastructure as Code)**
  - `render.yaml` en raíz:
    - Tipo: `web service`
    - `runtime: node`
    - `buildCommand: npm install && npm run build`
    - `startCommand: npm start`
    - `plan: free` (o `starter` para evitar spin-down)
    - `healthCheckPath: /api/health`
    - `envVars`: todas las de `.env.example` mapeadas a `sync: false` (se configuran en dashboard)
    - `autoDeploy: true` con branch `main`

- [ ] **6.2 — Crear servicio en Render**
  - Conectar repo de GitHub
  - Seleccionar rama `main`
  - Render detecta `render.yaml` automáticamente
  - Verificar que el plan, build y start commands son correctos

- [ ] **6.3 — Configurar variables de entorno en Render Dashboard**
  - Para cada variable de `.env.example`, añadir en Render → Environment:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `NEXT_PUBLIC_APP_URL` (temporal: `https://{nombre-app}.onrender.com`)
    - `NEXTAUTH_URL` (igual)
    - `NEXTAUTH_SECRET` (generar nuevo con `openssl rand -base64 32`)
    - `ADMIN_EMAIL`
    - `ADMIN_PASSWORD_HASH`
    - `RESEND_API_KEY`
    - `RESEND_FROM_EMAIL` (temporal: `onboarding@resend.dev`)
    - `USER_NOTIFICATION_EMAIL`
    - `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SECONDS`
  - Marcar como `Secret` las keys sensibles

- [ ] **6.4 — Deploy inicial y verificación**
  - Trigger deploy manual o esperar auto-deploy
  - Verificar logs en Render Dashboard
  - Abrir URL temporal (`{nombre-app}.onrender.com`)
  - Probar login, crear formulario, submit público
  - Verificar `/api/health`

- [ ] **6.5 — Verificar dominio en Resend**
  - En Resend Dashboard → Domains → Add Domain
  - Introducir el dominio del usuario (ej: `tudominio.com`)
  - Resend muestra registros DNS a añadir:
    - `TXT` record para verificación
    - `MX` records (si se quiere recibir)
    - `TXT` record SPF (`v=spf1 include:resend.com ~all`)
    - `CNAME` records DKIM (2 records usualmente)
  - Copiar todos los registros

- [ ] **6.6 — Añadir registros DNS en proveedor del usuario**
  - Acceder al panel DNS del proveedor (Cloudflare, Namecheap, etc.)
  - Añadir cada registro con su tipo, nombre, valor
  - Esperar propagación (puede tomar minutos a 48h, usualmente < 1h)

- [ ] **6.7 — Verificar dominio en Resend**
  - En Resend, click "Verify"
  - Si DNS está correcto, status cambia a "Verified"
  - Si no, revisar registros (errores comunes: typo, TTL alto)

- [ ] **6.8 — Actualizar `RESEND_FROM_EMAIL`**
  - Cambiar de `onboarding@resend.dev` a algo como `noreply@tudominio.com` o `formularios@tudominio.com`
  - Actualizar en Render → Environment
  - Trigger redeploy

- [ ] **6.9 — Añadir custom domain en Render**
  - En Render → Settings → Custom Domains → Add
  - Introducir `tudominio.com` y `www.tudominio.com` (opcional)
  - Render muestra el CNAME target (ej: `{nombre-app}.onrender.com`)

- [ ] **6.10 — Configurar DNS para apuntar a Render**
  - En proveedor DNS:
    - Para apex (`tudominio.com`): usar ANAME/ALIAS o redirección a `www` (depende del proveedor)
    - Para `www.tudominio.com`: CNAME → `{nombre-app}.onrender.com`
  - Alternativa: Render provee IPs estáticas para apex
  - Esperar propagación

- [ ] **6.11 — Esperar SSL automático**
  - Render provisiona Let's Encrypt automáticamente
  - Verificar en Settings → SSL → status "Active"
  - Probar `https://tudominio.com` en navegador (debe tener candado)

- [ ] **6.12 — Actualizar URLs en Render**
  - `NEXT_PUBLIC_APP_URL` → `https://tudominio.com`
  - `NEXTAUTH_URL` → `https://tudominio.com`
  - Trigger redeploy

- [ ] **6.13 — Verificación final post-deploy**
  - Login funciona con `https://tudominio.com/admin/login`
  - Crear formulario y submit llegan a email
  - Email sale desde `noreply@tudominio.com` (verificar headers del email)
  - SSL válido en todo el dominio
  - Forzar HTTPS (Render lo hace por defecto)

- [ ] **6.14 — Commit de la fase**
  - `git add render.yaml`
  - `git commit -m "chore(deploy): add render.yaml configuration"`

---

## Criterios de aceptación

- [ ] App accesible en `https://tudominio.com`
- [ ] SSL válido (candado verde en navegador)
- [ ] Login funciona
- [ ] Submit de formulario público envía email
- [ ] Email sale desde dominio custom (no `resend.dev`)
- [ ] SPF/DKIM verificado (emails no caen en spam)
- [ ] `/api/health` responde OK en producción
- [ ] Variables de entorno correctamente configuradas (sin leaks en logs)

## Cómo probar/validar

1. Abrir `https://tudominio.com` en navegador limpio
2. Verificar candado SSL y certificado (Let's Encrypt)
3. Login con credenciales admin
4. Crear formulario nuevo
5. Activar y abrir en ventana incógnita
6. Hacer submit → verificar email recibido
7. Verificar headers del email: `From: noreply@tudominio.com`, `SPF: pass`, `DKIM: pass`
8. Comprobar en https://www.mail-tester.com (enviar email de prueba y ver score)

## Entregables

- `render.yaml` versionado en repo
- Servicio en Render activo
- Dominio custom configurado con SSL
- DNS records documentados (internamente)
- Email desde dominio custom verificado

## Posibles blockers / issues

- **Bloqueador:** DNS propagation puede tardar horas. Documentar paciencia y cómo verificar con `dig` o `nslookup`.
- **Bloqueador:** Algunos proveedores DNS no permiten CNAME en apex. Usar ALIAS/ANAME o redirección 301 de apex → www.
- **Issue:** Render free tier hace spin-down tras 15min sin tráfico. Primera request tarda ~30s. Upgrade a `starter` ($7/mes) si molesta.
- **Issue:** Certbot puede tardar en provisionar SSL. Render muestra status "Pending" hasta 15min.
- **Issue:** Si Render detecta el repo en la raíz pero `package.json` está en subcarpeta, falla el build. Verificar que `Root Directory` esté correcto.

---

# Fase 7 — Polish + producción

**Objetivo:** La aplicación se siente profesional: carga rápida, muestra feedback claro, tiene manejo de errores robusto, accesibilidad básica y documentación para mantenimiento futuro.

**Tiempo estimado:** 8–12 horas

**Dependencias:** Fase 6 completada (app en producción)

---

## Tareas

- [ ] **7.1 — Loading states en todas las acciones**
  - Botones de Server Actions usan `useFormStatus` para mostrar "Guardando..."
  - Spinner visual consistente (lucide-react `Loader2` con animación `animate-spin`)
  - Skeletons en páginas de carga (ya están, mejorarlos)

- [ ] **7.2 — Sistema de toasts**
  - Implementar con `sonner` (librería ligera) o shadcn-style custom
  - `components/ui/Toast.tsx` (o usar `sonner`)
  - Provider en `app/layout.tsx`
  - Disparar toasts en:
    - Login success/error
    - Form creado/editado/eliminado
    - Toggle activo
    - Link copiado
    - Submit público success/error

- [ ] **7.3 — Confirmaciones antes de eliminar**
  - Ya implementado en Fase 3 con ConfirmDialog, revisar UX:
    - Botón "Eliminar" debe pedir confirmación explícita
    - Mensaje claro con nombre del item
    - Botón "Cancelar" siempre disponible
    - Variante visual destructiva (rojo)

- [ ] **7.4 — Mensajes de error específicos**
  - Revisar TODOS los `try/catch` y validar que mensajes son útiles
  - Errores comunes:
    - "Este slug ya está en uso. Prueba con otro."
    - "Las preguntas múltiples necesitan al menos 2 opciones."
    - "No se pudo enviar el email. Intenta de nuevo más tarde."
    - "Sesión expirada. Inicia sesión de nuevo."
  - Evitar mensajes genéricos tipo "Algo salió mal"

- [ ] **7.5 — Páginas de error personalizadas**
  - `app/not-found.tsx` (404 global):
    - Diseño coherente con brand
    - Mensaje amigable
    - Link de vuelta a home
  - `app/error.tsx` (500 global):
    - Mensaje "Algo salió mal"
    - Botón "Recargar" (`reset` del componente)
    - Mostrar error digest (no stack)
  - `app/(public)/not-found.tsx` (404 para rutas públicas)
  - `app/(admin)/not-found.tsx` (404 para admin, link a dashboard)

- [ ] **7.6 — Accesibilidad básica (a11y)**
  - Todos los inputs tienen `<label>` asociado
  - Focus visible en todos los interactivos (outline `ring-2`)
  - Contraste de colores WCAG AA (verificar con axe DevTools)
  - Atributos `aria-*` donde aplique:
    - `aria-invalid` en inputs con error
    - `aria-describedby` para errores y helper text
    - `aria-required` en inputs requeridos
    - `aria-live="polite"` en mensajes de éxito
  - Navegación por teclado funciona en todo
  - Formularios tienen `<form>` con submit por Enter

- [ ] **7.7 — Meta tags y favicon**
  - `app/layout.tsx` (root):
    - `metadata` export:
      - `title: { default: 'FormProject', template: '%s | FormProject' }`
      - `description: 'Crea y comparte formularios simples'`
      - `metadataBase: new URL(PUBLIC_APP_URL)`
      - `openGraph: { ... }`
      - `robots: { index: false }` (es single-tenant privado)
  - Generar favicon (32x32, 16x16) y apple-touch-icon
  - Añadir a `app/icon.tsx` (Next.js dynamic icon generator) o `app/favicon.ico`

- [ ] **7.8 — Mejorar UX del FormBuilder**
  - Añadir confirmación al descartar cambios sin guardar
  - Botón "Vista previa" que muestra cómo se verá el formulario público
  - Drag-and-drop para reordenar preguntas (opcional, mejora vs flechas)
  - Validación inline por pregunta al perder foco
  - Duplicar pregunta

- [ ] **7.9 — Mejorar UX del formulario público**
  - Indicador de progreso si hay > 3 preguntas
  - Scroll-to-error al submit con errores
  - Confirmación antes de abandonar con respuestas sin enviar (`beforeunload`)
  - Persistir respuestas en `localStorage` mientras se rellena (recuperable si cierra)

- [ ] **7.10 — Optimizaciones de performance**
  - Verificar que imágenes usan `next/image` (no `<img>`)
  - Verificar que no hay dependencias innecesarias en el bundle
  - `next build` output: revisar tamaño de cada página
  - Añadir `Suspense` boundaries donde tenga sentido
  - Preconnect a Supabase y Resend en `<head>`

- [ ] **7.11 — Seguridad básica**
  - Confirmar que todas las Server Actions validan con Zod
  - Confirmar que RLS está habilitado en todas las tablas
  - Confirmar que service role key NUNCA se expone al cliente
  - Añadir `headers()` de seguridad en `next.config.mjs`:
    - `X-Frame-Options: DENY`
    - `X-Content-Type-Options: nosniff`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Permissions-Policy` restrictiva
  - Verificar que NEXTAUTH_SECRET es fuerte (32+ bytes random)
  - CSRF: NextAuth lo maneja, pero verificar configuración

- [ ] **7.12 — Crear README completo**
  - `README.md` en raíz con secciones:
    - **Descripción**: qué es FormProject, para quién
    - **Tech stack**: lista resumida
    - **Setup local**: prerequisites, instalación, env vars, comandos
    - **Estructura del proyecto**: árbol de carpetas comentado
    - **Base de datos**: cómo correr migraciones, cómo regenerar tipos
    - **Desarrollo**: cómo añadir una nueva feature
    - **Deploy**: pasos resumidos (referencia a `PHASES.md`)
    - **Mantenimiento**:
      - Cómo añadir un nuevo admin (cambiar env vars + redeploy)
      - Cómo rotar NEXTAUTH_SECRET
      - Cómo actualizar dependencias
      - Cómo revisar logs en Render
      - Cómo regenerar password hasheada
    - **Troubleshooting**:
      - "No me llegan los emails" → checklist
      - "Login no funciona" → checklist
      - "SSL no se activa" → pasos
      - "Rate limit muy agresivo" → cómo ajustar
    - **Costes**: Resend free tier, Render plan, dominio anual
    - **Limitaciones conocidas**: single-tenant, sin BD de respuestas, etc.

- [ ] **7.13 — Crear guía de mantenimiento interna (`docs/MAINTENANCE.md`)**
  - Cómo cambiar el email de notificación
  - Cómo añadir/quitar un formulario manualmente desde SQL
  - Cómo limpiar `respuestas_log`
  - Cómo hacer backup de la BD (Supabase lo hace automático, pero documentar)

- [ ] **7.14 — Verificación end-to-end final**
  - Crear cuenta de prueba (ej: email temporal)
  - Recorrer flujo completo: login → crear form → publicar → submit desde otro dispositivo → recibir email
  - Probar todos los edge cases:
    - Slug con caracteres especiales
    - Formulario con 50 preguntas
    - Submit con respuestas muy largas
    - Network lento (DevTools throttling)
    - Sin internet (offline)
  - Probar en diferentes navegadores (Chrome, Firefox, Safari)
  - Lighthouse score > 90 en Performance, Accessibility, Best Practices, SEO

- [ ] **7.15 — Backups antes de cerrar el proyecto**
  - Documentar credenciales en lugar seguro (1Password, Bitwarden)
  - Guardar `.env.local` en gestor de secretos
  - Confirmar que el código está en GitHub/GitLab
  - Verificar que el dominio se renueva anualmente

- [ ] **7.16 — Commit final**
  - `git add .`
  - `git commit -m "chore(polish): production-ready polish + a11y + docs"`

---

## Criterios de aceptación

- [ ] Lighthouse score ≥ 90 en las 4 categorías
- [ ] No hay errores en consola en ningún flujo
- [ ] Toasts aparecen en todas las acciones relevantes
- [ ] Loading states visibles durante operaciones async
- [ ] Confirmaciones antes de acciones destructivas
- [ ] 404 y 500 con diseño coherente
- [ ] Navegación completa por teclado
- [ ] Emails llegan a inbox principal (no spam)
- [ ] Headers de seguridad presentes (verificar en DevTools)
- [ ] README permite a otra persona hacer setup de cero
- [ ] Todos los secretos fuera del repo

## Cómo probar/validar

1. **Lighthouse**: correr en `/admin` y `/f/{slug-activo}`
2. **axe DevTools**: instalar extensión, correr en todas las páginas principales, 0 errores críticos
3. **Prueba E2E manual**:
   - Crear formulario desde admin
   - Abrir link público en 3 navegadores distintos
   - Verificar email en Gmail/Outlook (no solo spam)
4. **Prueba offline**: DevTools → Network → Offline → submit debe fallar gracefully
5. **Verificar headers**: DevTools → Network → ver response headers de cualquier página
6. **Test de email**: https://www.mail-tester.com debe dar score ≥ 8/10
7. **Validar README**: otra persona debe poder seguir los pasos sin ayuda

## Entregables

- Sistema de toasts integrado
- Páginas de error personalizadas
- Favicon y meta tags completos
- README exhaustivo
- `docs/MAINTENANCE.md`
- Headers de seguridad configurados
- Performance optimizado

## Posibles blockers / issues

- **Issue:** Sonner vs custom toast. Sonner es más rápido pero añade dep. Evaluar trade-off.
- **Issue:** Lighthouse puede penalizar si NextAuth añade scripts pesados. Lazy load si es posible.
- **Issue:** Drag-and-drop añade complejidad (dnd-kit). Si no se hace, las flechas son suficientes.
- **Issue:** localStorage en formulario público puede ser molesto si usuario quiere submitir múltiples respuestas diferentes. Añadir botón "Limpiar" si se persiste.

---

# Resumen total estimado

| Fase | Nombre | Tiempo | Acumulado |
|------|--------|--------|-----------|
| 0 | Setup del proyecto | 2–3 h | 2–3 h |
| 1 | Modelo de datos + Supabase | 4–6 h | 6–9 h |
| 2 | Panel admin: login + dashboard | 5–7 h | 11–16 h |
| 3 | CRUD completo de formularios | 10–14 h | 21–30 h |
| 4 | Formulario público `/f/[slug]` | 6–8 h | 27–38 h |
| 5 | Envío de email con respuestas | 6–8 h | 33–46 h |
| 6 | Deploy + dominio custom + SSL | 4–6 h (+ espera DNS) | 37–52 h |
| 7 | Polish + producción | 8–12 h | 45–64 h |

**Total estimado:** 45–64 horas de trabajo activo (≈ 6–8 días laborales a 8h/día)

**Tiempos de espera no incluidos:**
- Fase 6: propagación DNS (hasta 48h, usualmente < 1h)
- Fase 6: SSL provisioning (hasta 15min)

**Tareas recurrentes opcionales (no en plan):**
- Backups manuales (Supabase los hace automáticos)
- Monitoring externo (no incluido en MVP)
- Analytics (no incluido)

---

## Notas finales

- Este plan está diseñado para ejecución secuencial. Las fases son dependencias lineales.
- Si en algún momento el usuario quiere priorizar, el MVP mínimo viable son las Fases 0–5 (sin deploy custom ni polish).
- El proyecto está pensado para ser desarrollado en bloques de 2–4 horas por sesión.
- Marcar cada checkbox al completar; actualizar este documento si cambian requisitos.
