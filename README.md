# 🏘️ Pueblo Delivery — Marketplace de comida a domicilio

Marketplace de delivery para pueblos y ciudades de Andalucía. Conecta clientes con restaurantes locales para pedidos ASAP y programados.

## Stack técnico

| Tecnología | Uso |
|---|---|
| Next.js 16 (App Router) + TypeScript | Framework full-stack |
| Tailwind CSS v4 | Estilos mobile-first |
| Prisma 7 + Postgres | ORM + Base de datos |
| Auth.js v5 | Autenticación (email + Google OAuth) |
| CartoCiudad | Geocodificación (gratuito, gobierno español) |
| Cloudflare R2 | Almacenamiento de imágenes |
| Resend | Envío de emails |
| Sentry | Monitorización de errores |
| Vitest + fast-check | Testing unitario + property-based |

---

## 🚀 Configuración local paso a paso

### Requisitos previos

- **Node.js 18+** instalado
- **pnpm** instalado (`npm install -g pnpm`)
- **Una cuenta en Supabase** (gratuita) → [supabase.com](https://supabase.com)

### Paso 1: Instalar dependencias

```bash
pnpm install
```

### Paso 2: Configurar la base de datos (Supabase)

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Si no tienes un proyecto, crea uno nuevo:
   - Nombre: `pueblo-delivery` (o el que quieras)
   - Región: `West EU (Ireland)` o la más cercana
   - Contraseña de la base de datos: **apúntala, la necesitarás**
3. Una vez creado, ve a **Settings** → **Database** (en el menú lateral)
4. En la sección **Connection string**, selecciona **URI**
5. Verás algo como:
   ```
   postgresql://postgres.[tu-ref]:[TU-PASSWORD]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
   ```
6. **Copia esa URL** y reemplaza `[TU-PASSWORD]` por la contraseña que pusiste al crear el proyecto
7. Abre el archivo `.env` en la raíz del proyecto y pega la URL en `DATABASE_URL`:
   ```
   DATABASE_URL="postgresql://postgres.abcdefgh:MiPassword123@aws-0-eu-west-3.pooler.supabase.com:6543/postgres"
   ```

> **Nota:** Usa la connection string con puerto **6543** (Transaction pooler), no la de puerto 5432.

### Paso 3: Generar el cliente Prisma

```bash
pnpm prisma generate
```

Esto genera los tipos TypeScript a partir del schema de la base de datos.

### Paso 4: Crear las tablas en Supabase

```bash
pnpm prisma migrate dev --name init
```

Esto crea las 21 tablas, enums, índices y relaciones en tu base de datos de Supabase. Tardará unos segundos.

> Si te da error de conexión, verifica que la `DATABASE_URL` en `.env` es correcta y que la contraseña no tiene caracteres especiales sin escapar.

### Paso 5: Cargar datos de prueba

```bash
pnpm prisma:seed
```

Esto carga:
- 14 alérgenos UE
- 5 restaurantes con horarios y zonas de reparto (Sevilla, Málaga, Córdoba, Cádiz, Granada)
- 52 productos con alérgenos asignados
- 12 usuarios con contraseñas hasheadas
- 10 direcciones de Andalucía
- 12 pedidos de ejemplo con historial de estados

### Paso 6: Arrancar el servidor

```bash
pnpm dev
```

Abre **http://localhost:3000** en tu navegador. ¡Ya está!

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
| `pnpm test` | Tests unitarios (Vitest) |
| `pnpm test:watch` | Tests en modo watch |
| `pnpm test:e2e` | Tests E2E (Playwright) |
| `pnpm prisma:seed` | Cargar datos de prueba |
| `pnpm prisma studio` | Explorar la DB visualmente |

---

## ⚙️ Variables de entorno

El archivo `.env` ya viene preconfigurado para desarrollo local. Solo necesitas rellenar `DATABASE_URL`.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | ✅ Sí | Connection string de Supabase Postgres |
| `NEXTAUTH_URL` | ✅ Sí | Ya configurada: `http://localhost:3000` |
| `NEXTAUTH_SECRET` | ✅ Sí | Ya generada automáticamente |
| `GOOGLE_CLIENT_ID` | ❌ No | Para login con Google (opcional) |
| `GOOGLE_CLIENT_SECRET` | ❌ No | Para login con Google (opcional) |
| `CARTOCIUDAD_BASE_URL` | ✅ Sí | Ya configurada (API gratuita) |
| `CLOUDFLARE_R2_*` | ❌ No | Para subir imágenes (opcional en dev) |
| `RESEND_API_KEY` | ❌ No | Emails se muestran en consola en dev |
| `SENTRY_*` | ❌ No | Monitorización (opcional en dev) |

---

## 🚢 Despliegue en Vercel

### Paso 1: Conectar repositorio

1. Ve a [vercel.com](https://vercel.com) → New Project
2. Importa el repositorio de GitHub/GitLab
3. Framework: Next.js (se detecta automáticamente)

### Paso 2: Configurar variables de entorno en Vercel

En el panel de Vercel → Settings → Environment Variables, añade:

```
DATABASE_URL          = (tu connection string de Supabase — usa la de producción)
NEXTAUTH_URL          = https://tu-dominio.vercel.app
NEXTAUTH_SECRET       = (genera uno nuevo con: openssl rand -base64 32)
GOOGLE_CLIENT_ID      = (si quieres login con Google)
GOOGLE_CLIENT_SECRET  = (si quieres login con Google)
CARTOCIUDAD_BASE_URL  = https://www.cartociudad.es/geocoder/api/geocoder
CLOUDFLARE_R2_*       = (credenciales de R2 para imágenes)
RESEND_API_KEY        = (API key de Resend para emails reales)
SENTRY_DSN            = (DSN de Sentry)
```

### Paso 3: Ejecutar migraciones en producción

Desde tu terminal local, apuntando a la DB de producción:

```bash
DATABASE_URL="tu-url-de-produccion" pnpm prisma migrate deploy
```

### Paso 4: Seed de datos (opcional)

```bash
DATABASE_URL="tu-url-de-produccion" pnpm prisma:seed
```

### Paso 5: Desplegar

Vercel despliega automáticamente con cada push a `main`. O haz deploy manual desde el panel.

---

## 🗂️ Estructura del proyecto

```
pueblo-delivery/
├── prisma/
│   ├── schema.prisma      # Schema de 21 tablas
│   └── seed.ts            # Datos de prueba
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (public)/      # Home, restaurantes, auth, ayuda
│   │   ├── (customer)/    # Carrito, checkout, pedidos, perfil
│   │   ├── (restaurant)/  # Panel de restaurante
│   │   ├── (admin)/       # Panel de administración
│   │   └── api/           # API Routes
│   ├── components/        # Componentes React
│   │   ├── ui/            # Button, Input, Card, Dialog, Badge, Tabs
│   │   ├── layout/        # Header, BottomNav, AppShell
│   │   ├── restaurant/    # RestaurantCard, RestaurantFilters
│   │   ├── product/       # ProductCard, AllergenBadge
│   │   ├── cart/          # CartItem, CartSummary, FABCart
│   │   ├── order/         # OrderTimeline, ETADisplay
│   │   └── legal/         # CookieBanner
│   ├── lib/               # Lógica de negocio
│   │   ├── domain/        # Funciones puras (FSM, ETA, Haversine, Slots)
│   │   ├── services/      # Geocoding, Email, Storage, Audit
│   │   ├── auth/          # Auth.js config + RBAC
│   │   └── validators/    # Schemas Zod
│   ├── hooks/             # useCart, usePolling, useAddressSearch
│   └── types/             # Tipos compartidos
├── public/
│   └── allergen-icons/    # 14 SVGs de alérgenos UE
├── .env                   # Variables de entorno (NO commitear)
├── .env.example           # Plantilla de variables
└── package.json
```

---

## 🐛 Solución de problemas

### "Error: connect ECONNREFUSED" al ejecutar migraciones
→ Verifica que `DATABASE_URL` en `.env` es correcta. Comprueba que no hay espacios ni saltos de línea.

### "Error: P1001: Can't reach database server"
→ Tu IP puede estar bloqueada en Supabase. Ve a Settings → Database → Network y verifica que tu IP está permitida (o activa "Allow all IPs" para desarrollo).

### "Error: relation does not exist"
→ No has ejecutado las migraciones. Ejecuta `pnpm prisma migrate dev --name init`.

### "Error: Unique constraint failed on the fields: (`email`)"
→ El seed ya se ejecutó antes. Puedes ignorar el error o resetear la DB con `pnpm prisma migrate reset`.

### El login con Google no funciona
→ Es opcional. Necesitas configurar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env`. Para desarrollo, usa el login con email/password.

### Los emails no llegan
→ En desarrollo, los emails se muestran en la **consola del servidor** (terminal donde ejecutas `pnpm dev`). Para emails reales, configura `RESEND_API_KEY`.
