# FormProject

> Plataforma personal de creación y publicación de formularios, con panel de administración privado y vista pública compartible por enlace.

**Estado:** En producción desde 2026-08-12
**URL:** https://form.antoniocuevas.dev
**Fallback Render:** https://form-project-6p7y.onrender.com
**Repositorio:** https://github.com/ProtonTony06/form-project

---

## ¿Qué es?

FormProject es una herramienta single-tenant para crear formularios dinámicos, publicarlos en una URL pública compartible (`/f/[slug]`) y recoger respuestas desde un panel de administración.

A diferencia de Typeform/Google Forms/etc., **no es SaaS multi-tenant**: está pensada como utilidad personal del propietario. Solo existe una cuenta admin (hardcode por variables de entorno) y todos los formularios viven en una única base de datos.

### Funcionalidades

- **Builder visual de formularios** con preguntas dinámicas (`texto corto`, `texto largo`, `opciones`, `múltiple selección`, `email`, `número`, etc.).
- **2 preguntas automáticas inyectadas siempre** por el servicio: `nombre` y `email` (el builder las pre-carga como read-only).
- **Importación masiva de preguntas desde JSON** (`ImportarPreguntasJSON.tsx`).
- **Toggle de activación** por formulario — los formularios inactivos devuelven 404 en la vista pública.
- **Página pública limpia** en `/f/[slug]` con confirmación en `/gracias`.
- **Panel de respuestas** con detalle por envío y exportación.
- **Login con rate-limit** por IP y email + lockout (`lib/loginThrottle.ts`).
- **Botón "Volver al dashboard"** con estilo "ghost elevado" en todas las rutas internas de admin.

---

## Stack

| Capa            | Tecnología                                              |
| --------------- | ------------------------------------------------------- |
| Framework       | Next.js 14.2.35 (App Router)                            |
| Lenguaje        | TypeScript 5                                            |
| UI              | React 18 + Tailwind CSS 3 + `lucide-react`              |
| Auth            | NextAuth v5 (`lib/auth.ts`, lazy-init)                  |
| Validación      | Zod 4 + `react-hook-form` 7 + `@hookform/resolvers`     |
| Base de datos   | Supabase (PostgreSQL) — proyecto `azkzzcoqqnxgaxdasqky` |
| Hosting         | Render (Web Service, plan free — cold starts posibles)  |
| Dominio         | `form.antoniocuevas.dev` (DonDominio, wildcard)         |
| Hashing         | `bcryptjs` con `DUMMY_BCRYPT_HASH` para timing-safe     |

---

## Estructura del proyecto

```
app/
  (admin)/admin/           → páginas privadas (login, list, builder, respuestas)
  (public)/f/[slug]/       → formulario público + /gracias
  api/admin/               → endpoints administrativos (REST)
  layout.tsx               → root layout
  page.tsx                 → landing pública

components/
  admin/                   → FormularioBuilder, PreguntaEditor, ImportarPreguntasJSON,
                              DeleteFormularioButton, ToggleActivoButton, FormularioList
  ui/                      → Input reusable, Button (CVA), PageLoading

lib/
  auth.ts                  → NextAuth v5 config + rate-limit (lazy init)
  loginThrottle.ts         → rate-limit por IP y email + lockout
  button-styles.ts         → receta CVA extraída para uso en server components
  services/                → formulariosService, authService, respuestasService
  validators/              → esquemas Zod
  supabase/service.ts      → client service_role (server-only)

scripts/
  seed.ts                  → sembrar datos de prueba
  migrate.ts               → aplicar migraciones SQL
  limpiar-datos-prueba.ts  → limpiar respuestas/formularios de prueba

supabase/
  migrations/              → historial de migraciones SQL
  seed/                    → seeds iniciales

types/database.ts          → tipos generados desde Supabase (`npm run db:types`)
docs/PHASES.md             → roadmap completo del proyecto (Fase 0–7)
```

---

## Configuración inicial

### Variables de entorno

Crea `.env.local` (no commitear) con:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://azkzzcoqqnxgaxdasqky.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>     # server-only, marcar como secret
SUPABASE_PROJECT_ID=azkzzcoqqnxgaxdasqky

# NextAuth
NEXTAUTH_URL=http://localhost:3000               # en producción: https://form.antoniocuevas.dev
NEXTAUTH_SECRET=<secret>
NEXT_PUBLIC_APP_URL=http://localhost:3000         # debe coincidir con NEXTAUTH_URL

# Admin (Fase 2 - hardcode)
HARDCODE_ADMIN_EMAIL=admin@example.com
HARDCODE_ADMIN_PASSWORD=<hash-o-plain>

# Rate limit (opcional, tiene defaults razonables)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_ATTEMPTS=5
```

> ⚠️ En producción, `NEXTAUTH_URL` y `NEXT_PUBLIC_APP_URL` **deben** apuntar a `https://form.antoniocuevas.dev`, nunca a `localhost`. Si apuntan a localhost, el middleware de NextAuth falla y aparecen 404s fantasma en rutas admin.

### Instalación

```bash
npm install
npm run migrate              # aplica migraciones SQL a Supabase
npm run seed                 # opcional: datos de prueba
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Scripts npm

| Script                      | Función                                                |
| --------------------------- | ------------------------------------------------------ |
| `npm run dev`               | Servidor de desarrollo                                 |
| `npm run build`             | Build de producción                                     |
| `npm run start`             | Servidor de producción (tras build)                    |
| `npm run lint`              | ESLint                                                 |
| `npm run seed`              | Ejecuta `scripts/seed.ts`                              |
| `npm run migrate`           | Ejecuta `scripts/migrate.ts`                           |
| `npm run limpiar-datos-prueba` | Limpia respuestas/formularios de prueba              |
| `npm run db:types`          | Regenera `types/database.ts` desde Supabase            |

---

## Modelo de datos (resumen)

Las tablas principales viven en Supabase (ver `supabase/migrations/`):

- `formularios` — definición del formulario (slug, título, descripción, activo)
- `preguntas` — preguntas del formulario (tipo, contenido, opciones, requerido, orden)
- `respuestas` — envíos de usuarios con FK al formulario
- `respuesta_valores` — valores individuales por pregunta (FK a `respuestas`)

Las 2 preguntas automáticas (`nombre`, `email`) **no** se almacenan como filas en `preguntas`; se inyectan desde `formulariosService` al servir el formulario público y se guardan en `respuesta_valores` con un flag `es_automatica=true`.

---

## Convenciones del proyecto

- **Inputs nativos con `bg-white` deben llevar `text-slate-900` explícito** — el `globals.css` aplica `color: inherit` y sin la clase el texto sale muy claro.
- **Botones "Volver"** usan el estilo "ghost elevado" (h-10, shadow-sm, hover lift, group-hover direccional).
- **Headers con 4+ botones** usan breakpoint `xl:` (no `lg:`) para la fila horizontal — `lg:` queda apretado en laptops de 1280–1440px.
- **Componentes UI server-side** importan la receta CVA desde `lib/button-styles.ts` (no se puede usar `cva()` directamente en un server component por las directivas `"use client"`).
- **`use client` solo donde sea estrictamente necesario** — el builder y formularios públicos son client components; el resto son server components con islands.

---

## Despliegue

El deploy se hace en Render (Web Service conectado a `origin/main`):

1. Push a `main` → Render detecta y construye.
2. Las env vars se configuran en el dashboard de Render (las marcadas como SECRET).
3. El dominio `form.antoniocuevas.dev` apunta a `form-project-6p7y.onrender.com` vía DonDominio.

> **Cold starts**: el plan free de Render hiberna tras inactividad. El primer request puede tardar 30–90s.

---

## Decisiones de arquitectura (resumen)

- **Single-tenant por diseño** — no es SaaS. La cuenta admin es hardcode por env var (Fase 2).
- **2 preguntas automáticas siempre inyectadas** — simplifican el modelado y son consistentes en todos los formularios.
- **CVA extraído a `lib/button-styles.ts`** — necesario porque `cva()` no se puede importar en server components que no tienen `"use client"`.
- **Rate-limit en memoria (`Map`)** con `resetRateLimit()` para edge cases. **No usar en multi-instancia**.
- **`bcryptjs` con `DUMMY_BCRYPT_HASH`** — comparación timing-safe incluso cuando el usuario no existe.

---

## Roadmap histórico

Ver `docs/PHASES.md` para el desglose completo de las 8 fases (Fase 0 → Fase 7) que llevaron al proyecto a producción.

---

## Licencia

Proyecto personal. Sin licencia pública por ahora.
