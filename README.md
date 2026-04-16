# 🏘️ Pueblo Delivery — Marketplace de comida a domicilio

Marketplace de delivery para pueblos y ciudades de Andalucía. Conecta clientes con restaurantes locales para pedidos ASAP y programados.

## Stack técnico

| Tecnología | Uso |
|---|---|
| Next.js 16 (App Router) + TypeScript | Framework full-stack |
| Tailwind CSS v4 | Estilos mobile-first |
| Prisma 7 + Supabase PostgreSQL | ORM + Base de datos |
| Auth.js v5 | Autenticación (email + Google OAuth) |
| CartoCiudad | Geocodificación (gratuito, gobierno español) |
| Cloudflare R2 | Almacenamiento de imágenes |
| Resend | Envío de emails |
| Sentry | Monitorización de errores |
| Vitest + fast-check | Testing unitario + property-based |
| GitHub Actions | CI/CD (lint, tests, deploy) |
| Vercel | Hosting (producción y staging) |

---

## 🚀 Configuración local (desarrollo)

### Requisitos previos

- **Node.js 20+**
- **pnpm** (`npm install -g pnpm`)
- **Docker** corriendo (para Supabase local)
- **Supabase CLI** (`npm install -g supabase` o [ver docs](https://supabase.com/docs/guides/cli))

### Setup automático (recomendado)

```bash
# 1. Instalar dependencias
pnpm install

# 2. Generar el cliente Prisma
pnpm prisma generate

# 3. Levantar todo: Supabase local + migraciones + seed
chmod +x scripts/setup.sh
./scripts/setup.sh

# 4. Arrancar la app
pnpm dev
```

Abre **http://localhost:3000**. Listo.

### Qué hace `setup.sh`

1. Arranca Supabase local con Docker (`supabase start`) — PostgreSQL, Studio, Auth, Storage, Inbucket
2. Aplica las migraciones de Prisma contra la DB local (`prisma migrate deploy`)
3. Carga los datos de prueba vía SQL (`psql -f supabase/seed.sql`)
4. Muestra las URLs de los servicios y las credenciales de acceso

### Servicios locales

| Servicio | URL |
|---|---|
| App (Next.js) | http://localhost:3000 |
| Supabase Studio | http://127.0.0.1:54323 |
| Supabase API | http://127.0.0.1:54321 |
| PostgreSQL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Inbucket (emails) | http://127.0.0.1:54324 |

### Setup manual (paso a paso)

Si prefieres hacerlo a mano o no tienes Docker:

```bash
# 1. Instalar dependencias
pnpm install

# 2. Copiar y configurar variables de entorno
cp .env.example .env
# Edita .env y pon tu DATABASE_URL (local o remota de Supabase)

# 3. Generar cliente Prisma
pnpm prisma generate

# 4. Aplicar migraciones
npx prisma migrate deploy

# 5. Cargar datos de prueba (opcional)
pnpm prisma:seed

# 6. Arrancar
pnpm dev
```

---

## 🔑 Credenciales de prueba

Todos los usuarios tienen la contraseña: **`Password123!`**

| Rol | Email | Qué puede hacer |
|---|---|---|
| Admin | `admin@pueblodelivery.es` | Panel admin, métricas, gestión global |
| Propietario | `maria@saplaça.es` | Panel restaurante, catálogo, pedidos |
| Staff | `pedro@saplaça.es` | Gestionar pedidos del restaurante |
| Cliente | `ana@ejemplo.es` | Pedir comida, tracking, historial |

Otros clientes: `carlos@ejemplo.es`, `elena@ejemplo.es`, `miguel@ejemplo.es`, `sofia@ejemplo.es`

---

## 📋 Scripts disponibles

| Script | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo (http://localhost:3000) |
| `pnpm build` | Build de producción |
| `pnpm start` | Servidor de producción |
| `pnpm lint` | Linter ESLint |
| `pnpm test` | Tests unitarios (Vitest + fast-check) |
| `pnpm test:watch` | Tests en modo watch |
| `pnpm test:integration` | Tests de integración |
| `pnpm test:e2e` | Tests E2E (Playwright) |
| `pnpm prisma:seed` | Cargar datos de prueba vía TypeScript |
| `pnpm prisma studio` | Explorar la DB visualmente |

---

## ⚙️ Variables de entorno

Copia `.env.example` a `.env`. Con el setup local (Docker), solo necesitas ejecutar `setup.sh` — el `.env` ya viene configurado para la DB local.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string PostgreSQL (local o Supabase cloud) |
| `NEXTAUTH_URL` | ✅ | URL base de la app (`http://localhost:3000` en dev) |
| `NEXTAUTH_SECRET` | ✅ | Secret para Auth.js (generar con `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | ❌ | Para login con Google (opcional) |
| `GOOGLE_CLIENT_SECRET` | ❌ | Para login con Google (opcional) |
| `CARTOCIUDAD_BASE_URL` | ✅ | Ya configurada (API gratuita del gobierno) |
| `CLOUDFLARE_R2_*` | ❌ | Para subir imágenes (opcional en dev) |
| `RESEND_API_KEY` | ❌ | Emails se muestran en consola en dev |
| `SENTRY_*` | ❌ | Monitorización de errores (opcional en dev) |

---

## 🚢 Despliegue

El proyecto tiene dos formas de desplegar: automática (GitHub Actions) y manual (script local).

### Despliegue automático (CI/CD)

Cada push a `main` ejecuta automáticamente:

```
CI (lint + type-check + tests) → Migraciones Prisma → Deploy a Vercel
```

También puedes disparar un deploy manual desde **GitHub Actions → Deploy → Run workflow**, eligiendo entorno (`staging` o `production`) y si ejecutar el seed.

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para la configuración completa de secrets y environments en GitHub.

### Despliegue manual (script local)

```bash
# Desplegar a staging
./scripts/deploy.sh staging

# Desplegar a producción
./scripts/deploy.sh production
```

El script ejecuta: verificación de rama → lint → type-check → tests → build → migraciones Prisma → deploy a Vercel.

### Configurar Vercel

1. Conecta el repo en [vercel.com/new](https://vercel.com/new)
2. Configura las variables de entorno en Vercel → Settings → Environment Variables:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Connection string de Supabase producción |
| `NEXTAUTH_URL` | `https://tu-dominio.vercel.app` |
| `NEXTAUTH_SECRET` | Generar con `openssl rand -base64 32` |
| `CARTOCIUDAD_BASE_URL` | `https://www.cartociudad.es/geocoder/api/geocoder` |
| `SENTRY_DSN` | DSN de tu proyecto Sentry |
| `NEXT_PUBLIC_SENTRY_DSN` | Mismo valor que `SENTRY_DSN` |
| `SENTRY_AUTH_TOKEN` | Token de Sentry para source maps |
| `SENTRY_ORG` | Slug de tu organización en Sentry |
| `SENTRY_PROJECT` | Slug de tu proyecto en Sentry |

### Configurar Supabase (producción)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Copia la connection string (Settings → Database → URI)
3. Aplica migraciones: `DATABASE_URL="tu-url-prod" npx prisma migrate deploy`
4. (Opcional) Seed: `DATABASE_URL="tu-url-prod" pnpm prisma:seed`

---

## 🗂️ Estructura del proyecto

```
monte-delivery/
├── .github/workflows/     # CI/CD (ci.yml + deploy.yml)
├── prisma/
│   ├── schema.prisma      # Schema de 21 tablas
│   ├── migrations/        # Migraciones SQL
│   └── seed.ts            # Datos de prueba (TypeScript)
├── scripts/
│   ├── setup.sh           # Setup local (Supabase + migraciones + seed)
│   └── deploy.sh          # Deploy manual (staging/production)
├── supabase/
│   ├── config.toml        # Config de Supabase local (Docker)
│   └── seed.sql           # Datos de prueba (SQL, usado por setup.sh)
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (public)/      # Home, restaurantes, auth
│   │   ├── (customer)/    # Carrito, checkout, pedidos, perfil
│   │   ├── (restaurant)/  # Panel de restaurante
│   │   ├── (admin)/       # Panel de administración
│   │   └── api/           # API Routes
│   ├── components/        # Componentes React (ui, layout, cart, etc.)
│   ├── lib/               # Lógica de negocio
│   │   ├── domain/        # Funciones puras (FSM, ETA, Haversine, Slots)
│   │   ├── services/      # Geocoding, Email, Storage, Audit
│   │   ├── auth/          # Auth.js config + RBAC
│   │   └── validators/    # Schemas Zod
│   ├── hooks/             # useCart, usePolling, useAddressSearch
│   └── types/             # Tipos compartidos
├── public/allergen-icons/  # 14 SVGs de alérgenos UE
├── DEPLOYMENT.md           # Guía de CI/CD y secrets de GitHub
├── .env.example            # Plantilla de variables de entorno
└── package.json
```

---

## 🐛 Solución de problemas

### "Error: connect ECONNREFUSED" al ejecutar migraciones
→ Si usas Supabase local, verifica que Docker está corriendo y ejecuta `supabase start`. Si usas Supabase cloud, verifica la `DATABASE_URL` en `.env`.

### "Error: P1001: Can't reach database server"
→ Tu IP puede estar bloqueada en Supabase cloud. Ve a Settings → Database → Network y verifica que tu IP está permitida.

### "Error: relation does not exist"
→ No has ejecutado las migraciones. Ejecuta `npx prisma migrate deploy`.

### "Error: Unique constraint failed on the fields: (`email`)"
→ El seed ya se ejecutó antes. Puedes ignorar el error o resetear la DB.

### El login con Google no funciona
→ Es opcional. Configura `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env`. Para desarrollo, usa email/password.

### Los emails no llegan
→ En desarrollo local, los emails se muestran en la consola del servidor. Para emails reales, configura `RESEND_API_KEY`.

### Supabase local no arranca
→ Verifica que Docker está corriendo. Ejecuta `docker ps` para ver los contenedores. Si hay conflictos de puertos, para los contenedores existentes con `supabase stop`.
