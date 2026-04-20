# Guía de Despliegue — Monte Delivery

## Arquitectura

```
┌──────────────────┐     ┌──────────────────────────────┐
│   Vercel          │     │   Supabase                    │
│   (Frontend)      │────▶│   (PostgreSQL)                │
│                   │     │                                │
│   - Next.js SSR   │     │   - Base de datos              │
│   - API Routes    │     │   - Migraciones (Prisma)       │
│   - Static Assets │     │                                │
└──────────────────┘     └──────────────────────────────┘
```

---

## 1. Desarrollo local

### Requisitos

- Node.js 20+, pnpm, Docker, Supabase CLI

### Setup

```bash
pnpm install
pnpm prisma generate
chmod +x scripts/setup.sh
./scripts/setup.sh    # Supabase local + migraciones + seed
pnpm dev              # http://localhost:3000
```

El script `setup.sh` levanta Supabase local con Docker (PostgreSQL en puerto 54322, Studio en 54323), aplica las migraciones de Prisma, y carga los datos de prueba.

### Parar servicios

```bash
supabase stop         # Para los contenedores Docker
```

### Resetear la base de datos

```bash
supabase stop
./scripts/setup.sh    # Vuelve a levantar todo limpio
```

---

## 2. CI/CD con GitHub Actions

### Workflows

| Workflow | Archivo | Trigger | Qué hace |
|---|---|---|---|
| **CI** | `.github/workflows/ci.yml` | Push/PR a `main` o `develop` | Lint + type-check + tests |
| **Deploy** | `.github/workflows/deploy.yml` | Push a `main` o manual dispatch | Quality gate + migraciones + deploy a Vercel |

### Pipeline de deploy

```
quality-gate → migrate → seed (opcional) → deploy
```

- **quality-gate**: lint, type-check, tests, build de producción
- **migrate**: `npx prisma migrate deploy` contra la DB del entorno
- **seed**: `pnpm prisma:seed` (solo en dispatch manual con `run_seed: true`)
- **deploy**: build y deploy a Vercel con CLI

### Concurrencia

- **CI**: cancela runs anteriores en la misma rama (`cancel-in-progress: true`)
- **Deploy**: encola (no cancela) para evitar deploys parciales (`cancel-in-progress: false`)

---

## 3. Secrets de GitHub

### Secrets de repositorio

Configurar en **Settings → Secrets and variables → Actions → Repository secrets**:

| Secret | Usado por | Descripción |
|---|---|---|
| `VERCEL_TOKEN` | Deploy | Token de API de Vercel |
| `VERCEL_ORG_ID` | Deploy | ID de organización en Vercel |
| `VERCEL_PROJECT_ID` | Deploy | ID del proyecto en Vercel |
| `NEXTAUTH_URL` | Build | URL canónica de la app |
| `NEXTAUTH_SECRET` | Build | Secret de Auth.js (`openssl rand -base64 32`) |
| `SENTRY_DSN` | Build | DSN de Sentry |
| `NEXT_PUBLIC_SENTRY_DSN` | Build | DSN de Sentry (cliente) |
| `SENTRY_AUTH_TOKEN` | Build | Token para subir source maps |
| `SENTRY_ORG` | Build | Slug de organización en Sentry |
| `SENTRY_PROJECT` | Build | Slug de proyecto en Sentry |

### Secrets de entorno

Configurar en **Settings → Environments → (staging/production) → Environment secrets**:

| Secret | Entornos | Descripción |
|---|---|---|
| `DATABASE_URL` | `staging`, `production` | Connection string de Supabase PostgreSQL |

---

## 4. GitHub Environments

1. Ir a **Settings → Environments**
2. Crear dos entornos: **`staging`** y **`production`**
3. En cada uno, añadir el secret `DATABASE_URL` con la connection string de su base de datos
4. (Opcional) Añadir protección a `production`: required reviewers, deployment branches (`main`)

---

## 5. Deploy manual

### Desde GitHub Actions

1. Ir a **Actions → Deploy → Run workflow**
2. Elegir rama, entorno (`staging` o `production`), y si ejecutar seed
3. Click **Run workflow**

### Desde terminal (script local)

```bash
./scripts/deploy.sh staging      # Despliega a staging
./scripts/deploy.sh production   # Despliega a producción
```

El script verifica la rama, ejecuta quality checks, aplica migraciones, y despliega a Vercel.

---

## 6. Configurar Vercel (primera vez)

1. Conectar el repo en [vercel.com/new](https://vercel.com/new)
2. Framework: Next.js (auto-detectado)
3. Añadir variables de entorno (ver sección de secrets arriba)
4. Obtener `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` de `.vercel/project.json` tras ejecutar `vercel link`

---

## 7. Configurar Supabase producción (primera vez)

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Copiar connection string: **Settings → Database → Connection string → URI**
3. Aplicar migraciones:
   ```bash
   DATABASE_URL="tu-url-produccion" npx prisma migrate deploy
   ```
4. (Opcional) Cargar datos iniciales:
   ```bash
   DATABASE_URL="tu-url-produccion" pnpm prisma:seed
   ```

---

## 8. Ejecutar seed en producción

Solo disponible vía dispatch manual para evitar ejecuciones accidentales:

1. **Actions → Deploy → Run workflow**
2. Seleccionar entorno
3. Activar **Run seed script after migrations**
4. Click **Run workflow**

El seed ejecuta `npx prisma generate` + `pnpm prisma:seed` con el `DATABASE_URL` del entorno seleccionado.
