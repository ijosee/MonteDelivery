# Documento de Requisitos — Migración de Prisma a Supabase

## Introducción

Este documento define los requisitos para migrar el proyecto **monte-delivery** (Pueblo Delivery) de Prisma ORM + NextAuth a Supabase Client + Supabase Auth. El objetivo es unificar el stack tecnológico con el proyecto hermano **gitan-app**, que ya utiliza `@supabase/supabase-js` y `@supabase/ssr` para acceso a datos y autenticación. La base de datos PostgreSQL existente en Supabase se mantiene intacta — solo cambia la capa de acceso.

## Glosario

- **Sistema_Migración**: El proceso y conjunto de cambios que transforman monte-delivery de Prisma/NextAuth a Supabase Client/Supabase Auth
- **Cliente_Supabase**: Instancia de `@supabase/supabase-js` configurada para interactuar con la base de datos y autenticación de Supabase
- **Cliente_Servidor**: Cliente de Supabase creado con `@supabase/ssr` para uso en Server Components, API Routes y middleware
- **Cliente_Navegador**: Cliente de Supabase creado con `@supabase/ssr` para uso en Client Components del navegador
- **Supabase_Auth**: Sistema de autenticación nativo de Supabase que gestiona sesiones, tokens y flujos de login/registro/reset
- **Tipos_Generados**: Tipos TypeScript generados con `supabase gen types typescript` que reemplazan los tipos de Prisma
- **RLS**: Row Level Security — políticas de seguridad a nivel de fila en PostgreSQL que Supabase respeta automáticamente
- **Capa_Acceso**: Módulo que encapsula todas las operaciones de lectura/escritura contra la base de datos
- **Ruta_API**: Endpoint HTTP definido en `src/app/api/` que maneja peticiones del cliente
- **Middleware_Auth**: Componente que intercepta peticiones HTTP para validar sesiones y aplicar control de acceso basado en roles
- **Seed**: Script que puebla la base de datos con datos iniciales de desarrollo y pruebas
- **Service_Role_Key**: Clave de Supabase con permisos elevados que omite RLS, usada solo en el servidor

## Requisitos

### Requisito 1: Configuración del Cliente Supabase

**User Story:** Como desarrollador, quiero tener utilidades de cliente Supabase para servidor y navegador, para poder acceder a la base de datos y autenticación desde cualquier contexto de la aplicación.

#### Criterios de Aceptación

1. THE Sistema_Migración SHALL proporcionar una función `createClient` para crear un Cliente_Servidor que utilice `@supabase/ssr` con las cookies de la petición actual
2. THE Sistema_Migración SHALL proporcionar una función `createClient` para crear un Cliente_Navegador que utilice `@supabase/ssr` con las cookies del navegador
3. THE Sistema_Migración SHALL proporcionar una función `createServiceClient` que cree un cliente con la Service_Role_Key para operaciones administrativas que omitan RLS
4. WHEN el archivo `src/lib/db.ts` sea reemplazado, THE Sistema_Migración SHALL eliminar todas las referencias a `PrismaClient`, `PrismaPg` y `@prisma/adapter-pg`
5. THE Sistema_Migración SHALL configurar las variables de entorno `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` como requeridas

### Requisito 2: Generación de Tipos TypeScript

**User Story:** Como desarrollador, quiero tipos TypeScript generados automáticamente desde el esquema de Supabase, para tener seguridad de tipos sin depender de Prisma.

#### Criterios de Aceptación

1. THE Sistema_Migración SHALL generar tipos TypeScript ejecutando `supabase gen types typescript` y almacenarlos en un archivo accesible por el proyecto
2. THE Tipos_Generados SHALL incluir definiciones para las 22 tablas del esquema: users, auth_accounts, sessions, restaurants, restaurant_users, opening_hours, delivery_zones, categories, products, allergens, product_allergens, carts, cart_items, addresses, geocoding_cache, orders, order_items, order_status_history, cookie_consents, legal_acceptances, phone_verifications, admin_audit_log
3. THE Tipos_Generados SHALL incluir definiciones para los 5 enums: UserRole, RestaurantUserRole, OrderStatus, FulfillmentType, ConsentType
4. WHEN un archivo importe tipos desde `@/generated/prisma/client`, THE Sistema_Migración SHALL reemplazar esa importación por la ruta de los Tipos_Generados de Supabase
5. THE Sistema_Migración SHALL añadir un script `gen:types` en `package.json` para regenerar los tipos bajo demanda

### Requisito 3: Migración de Autenticación — Registro

**User Story:** Como usuario nuevo, quiero registrarme con email y contraseña usando Supabase Auth, para crear mi cuenta en la plataforma.

#### Criterios de Aceptación

1. WHEN un usuario envíe el formulario de registro con nombre, email y contraseña válidos, THE Sistema_Migración SHALL utilizar `supabase.auth.signUp()` en lugar de crear el usuario manualmente con Prisma
2. WHEN Supabase Auth cree el usuario de autenticación, THE Sistema_Migración SHALL crear un registro correspondiente en la tabla `users` con el rol CUSTOMER y el mismo `id` que el usuario de Supabase Auth
3. WHEN el email ya esté registrado en Supabase Auth, THE Sistema_Migración SHALL devolver un error 409 con el mensaje "Ya existe una cuenta con este email."
4. THE Sistema_Migración SHALL eliminar la dependencia de `bcryptjs` para el hashing de contraseñas en el registro, delegando esa responsabilidad a Supabase Auth
5. IF Supabase Auth devuelve un error durante el registro, THEN THE Sistema_Migración SHALL devolver un error 500 con un mensaje descriptivo

### Requisito 4: Migración de Autenticación — Login

**User Story:** Como usuario registrado, quiero iniciar sesión con email y contraseña usando Supabase Auth, para acceder a mi cuenta.

#### Criterios de Aceptación

1. WHEN un usuario envíe credenciales válidas, THE Sistema_Migración SHALL utilizar `supabase.auth.signInWithPassword()` en lugar del flujo de Credentials de NextAuth
2. WHEN las credenciales sean incorrectas, THE Sistema_Migración SHALL devolver un error de autenticación sin revelar si el email existe
3. THE Sistema_Migración SHALL eliminar la lógica manual de bloqueo por intentos fallidos (`failedLoginAttempts`, `lockedUntil`) y delegar la protección contra fuerza bruta a Supabase Auth
4. WHEN el login sea exitoso, THE Sistema_Migración SHALL establecer las cookies de sesión de Supabase Auth mediante `@supabase/ssr`
5. THE Sistema_Migración SHALL eliminar el catch-all route `src/app/api/auth/[...nextauth]/route.ts` y los archivos `auth.ts` y `auth.config.ts` de NextAuth

### Requisito 5: Migración de Autenticación — Cierre de Sesión

**User Story:** Como usuario autenticado, quiero cerrar sesión de forma segura, para proteger mi cuenta.

#### Criterios de Aceptación

1. WHEN un usuario solicite cerrar sesión, THE Sistema_Migración SHALL llamar a `supabase.auth.signOut()` para invalidar la sesión
2. WHEN la sesión se cierre, THE Sistema_Migración SHALL limpiar las cookies de sesión de Supabase del navegador
3. WHEN la sesión se cierre, THE Sistema_Migración SHALL redirigir al usuario a la página de login

### Requisito 6: Migración de Autenticación — Recuperación de Contraseña

**User Story:** Como usuario que olvidó su contraseña, quiero recuperarla mediante Supabase Auth, para poder acceder de nuevo a mi cuenta.

#### Criterios de Aceptación

1. WHEN un usuario solicite recuperar su contraseña, THE Sistema_Migración SHALL utilizar `supabase.auth.resetPasswordForEmail()` en lugar de la lógica manual con tokens de Prisma
2. WHEN el usuario reciba el enlace de recuperación y envíe una nueva contraseña, THE Sistema_Migración SHALL utilizar `supabase.auth.updateUser()` para actualizar la contraseña
3. THE Sistema_Migración SHALL eliminar las rutas API `forgot-password` y `reset-password` que usan Prisma directamente, reemplazándolas por flujos nativos de Supabase Auth

### Requisito 7: Middleware de Autenticación y RBAC

**User Story:** Como sistema, quiero proteger las rutas según el rol del usuario usando Supabase Auth, para mantener el control de acceso basado en roles.

#### Criterios de Aceptación

1. THE Middleware_Auth SHALL utilizar `@supabase/ssr` para refrescar la sesión de Supabase Auth en cada petición
2. WHEN un usuario no autenticado acceda a una ruta protegida, THE Middleware_Auth SHALL redirigir a la página de login
3. WHEN un usuario autenticado acceda a una ruta protegida, THE Middleware_Auth SHALL consultar el rol del usuario desde la tabla `users` y verificar que tiene permiso para esa ruta
4. THE Middleware_Auth SHALL reemplazar el middleware actual basado en `auth()` de NextAuth por un middleware basado en `supabase.auth.getUser()`
5. THE Middleware_Auth SHALL mantener los mismos headers de seguridad (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Strict-Transport-Security)
6. THE Middleware_Auth SHALL mantener la misma estructura de rutas protegidas: `/carrito` y `/checkout` y `/pedidos` y `/perfil` para CUSTOMER, `/panel` para RESTAURANT_OWNER y RESTAURANT_STAFF, `/admin` para ADMIN

### Requisito 8: Migración de la Capa de Acceso a Datos — Consultas de Lectura

**User Story:** Como desarrollador, quiero que todas las consultas de lectura usen el cliente Supabase, para eliminar la dependencia de Prisma.

#### Criterios de Aceptación

1. WHEN una Ruta_API ejecute `prisma.xxx.findMany()`, THE Sistema_Migración SHALL reemplazarla por `supabase.from('xxx').select()`
2. WHEN una Ruta_API ejecute `prisma.xxx.findUnique()`, THE Sistema_Migración SHALL reemplazarla por `supabase.from('xxx').select().eq().single()`
3. WHEN una consulta Prisma use `include` para relaciones, THE Sistema_Migración SHALL traducirla a la sintaxis de select con relaciones de Supabase (ej: `select('*, restaurant(*)')`)
4. WHEN una consulta Prisma use `orderBy`, `skip` y `take`, THE Sistema_Migración SHALL traducirla a `.order()`, `.range()` de Supabase
5. WHEN una consulta Prisma use `where` con filtros, THE Sistema_Migración SHALL traducirla a los métodos de filtro de Supabase (`.eq()`, `.in()`, `.ilike()`, `.gte()`, `.lte()`)
6. WHEN una consulta Prisma use `count()`, THE Sistema_Migración SHALL traducirla a `supabase.from('xxx').select('*', { count: 'exact', head: true })`
7. THE Sistema_Migración SHALL migrar las consultas de lectura en las siguientes rutas API: restaurants, restaurants/[slug], restaurants/nearby, cart, orders, orders/[id], addresses, admin/users, admin/restaurants, admin/products, admin/categories, admin/orders, admin/metrics, admin/audit-log, restaurant/catalog, restaurant/orders, restaurant/staff, consent, phone-verification, user/export-data, geocoding/candidates

### Requisito 9: Migración de la Capa de Acceso a Datos — Operaciones de Escritura

**User Story:** Como desarrollador, quiero que todas las operaciones de escritura usen el cliente Supabase, para eliminar la dependencia de Prisma.

#### Criterios de Aceptación

1. WHEN una Ruta_API ejecute `prisma.xxx.create()`, THE Sistema_Migración SHALL reemplazarla por `supabase.from('xxx').insert()`
2. WHEN una Ruta_API ejecute `prisma.xxx.update()`, THE Sistema_Migración SHALL reemplazarla por `supabase.from('xxx').update().eq()`
3. WHEN una Ruta_API ejecute `prisma.xxx.delete()` o `prisma.xxx.deleteMany()`, THE Sistema_Migración SHALL reemplazarla por `supabase.from('xxx').delete().eq()`
4. WHEN una Ruta_API ejecute `prisma.$transaction()`, THE Sistema_Migración SHALL reemplazarla por una función RPC de Supabase o por operaciones secuenciales con manejo de errores y rollback manual
5. WHEN una operación de escritura devuelva el registro creado o actualizado, THE Sistema_Migración SHALL usar `.select()` encadenado para obtener los datos de retorno
6. THE Sistema_Migración SHALL migrar las operaciones de escritura en las siguientes rutas API: auth/register, cart/items, cart (DELETE), addresses, addresses/[id], orders (POST), orders/[id]/cancel, orders/[id]/confirm, admin/restaurants (POST/PATCH), admin/products (POST), admin/categories, restaurant/catalog/categories, restaurant/catalog/products, restaurant/orders/[id]/accept, restaurant/orders/[id]/reject, restaurant/orders/[id]/status, restaurant/staff/invite, consent, phone-verification/send, phone-verification/verify, user/delete-account

### Requisito 10: Migración de Servicios Internos

**User Story:** Como desarrollador, quiero que los servicios internos (auditoría, geocoding) usen el cliente Supabase, para completar la eliminación de Prisma.

#### Criterios de Aceptación

1. WHEN el servicio `audit.service.ts` registre una entrada de auditoría, THE Sistema_Migración SHALL usar `supabase.from('admin_audit_log').insert()` en lugar de `prisma.adminAuditLog.create()`
2. WHEN el servicio `geocoding.service.ts` consulte o escriba en la caché de geocodificación, THE Sistema_Migración SHALL usar `supabase.from('geocoding_cache')` en lugar de `prisma.geocodingCache`
3. THE Sistema_Migración SHALL usar el Cliente_Servidor con Service_Role_Key para los servicios internos que requieran omitir RLS

### Requisito 11: Migración del Sistema RBAC

**User Story:** Como desarrollador, quiero que el sistema de control de acceso basado en roles funcione con tipos de Supabase, para mantener la seguridad sin Prisma.

#### Criterios de Aceptación

1. THE Sistema_Migración SHALL reemplazar la importación de `UserRole` desde `@/generated/prisma/client` por un tipo equivalente definido en los Tipos_Generados de Supabase o un tipo local
2. THE Sistema_Migración SHALL mantener la misma estructura de permisos por rol (CUSTOMER, RESTAURANT_OWNER, RESTAURANT_STAFF, ADMIN) definida en `rbac.ts`
3. WHEN una Ruta_API obtenga la sesión del usuario, THE Sistema_Migración SHALL obtener el rol desde la tabla `users` usando `supabase.from('users').select('role').eq('id', userId).single()` en lugar de `session.user.role` de NextAuth
4. THE Sistema_Migración SHALL eliminar el archivo `src/types/next-auth.d.ts` que augmenta los tipos de NextAuth

### Requisito 12: Migración de Páginas de Autenticación

**User Story:** Como usuario, quiero que las páginas de login, registro y recuperación de contraseña funcionen con Supabase Auth, para poder autenticarme correctamente.

#### Criterios de Aceptación

1. WHEN el usuario envíe el formulario de login, THE Sistema_Migración SHALL llamar a Supabase Auth desde el cliente o mediante una Server Action en lugar de usar `signIn()` de NextAuth
2. WHEN el usuario envíe el formulario de registro, THE Sistema_Migración SHALL llamar a la API de registro migrada que usa Supabase Auth
3. WHEN el usuario envíe el formulario de recuperación de contraseña, THE Sistema_Migración SHALL llamar a Supabase Auth para enviar el email de recuperación
4. THE Sistema_Migración SHALL mantener las mismas rutas de páginas: `/auth/login`, `/auth/registro`, `/auth/reset-password`

### Requisito 13: Migración del Script de Seed

**User Story:** Como desarrollador, quiero que el script de seed funcione con el cliente Supabase o SQL directo, para poder poblar la base de datos sin Prisma.

#### Criterios de Aceptación

1. THE Sistema_Migración SHALL reescribir `prisma/seed.ts` para usar el cliente Supabase con Service_Role_Key o SQL directo en lugar de PrismaClient
2. THE Seed SHALL mantener los mismos datos de prueba: 14 alérgenos EU, 12 usuarios, 5 restaurantes, horarios de apertura, categorías, 50+ productos, 10 direcciones y 12 pedidos
3. WHEN el seed cree usuarios, THE Sistema_Migración SHALL crear los usuarios tanto en Supabase Auth como en la tabla `users` para mantener la consistencia
4. THE Sistema_Migración SHALL actualizar el script `prisma:seed` en `package.json` por un nuevo script que ejecute el seed migrado

### Requisito 14: Gestión de Dependencias

**User Story:** Como desarrollador, quiero que las dependencias del proyecto reflejen el nuevo stack, para mantener el proyecto limpio y sin paquetes innecesarios.

#### Criterios de Aceptación

1. THE Sistema_Migración SHALL añadir las dependencias `@supabase/supabase-js` y `@supabase/ssr` al proyecto
2. THE Sistema_Migración SHALL añadir `supabase` como dependencia de desarrollo para la generación de tipos
3. THE Sistema_Migración SHALL eliminar las dependencias: `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `@auth/prisma-adapter`, `next-auth`, `bcryptjs`
4. THE Sistema_Migración SHALL eliminar los archivos de configuración de Prisma: `prisma.config.ts` y la sección `prisma` de `package.json`
5. THE Sistema_Migración SHALL conservar el directorio `prisma/` con el schema y migraciones como referencia histórica

### Requisito 15: Configuración de Variables de Entorno

**User Story:** Como desarrollador, quiero que las variables de entorno reflejen el nuevo stack de Supabase, para configurar correctamente el proyecto.

#### Criterios de Aceptación

1. THE Sistema_Migración SHALL añadir las variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` al archivo `.env.example`
2. THE Sistema_Migración SHALL eliminar las variables `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` del archivo `.env.example`
3. THE Sistema_Migración SHALL eliminar la variable `DATABASE_URL` del archivo `.env.example` ya que el acceso se realiza a través de la API de Supabase
4. THE Sistema_Migración SHALL documentar en `.env.example` cómo obtener cada variable de Supabase

### Requisito 16: Limpieza de Archivos Obsoletos

**User Story:** Como desarrollador, quiero que se eliminen todos los archivos específicos de Prisma y NextAuth que ya no son necesarios, para mantener el proyecto limpio.

#### Criterios de Aceptación

1. THE Sistema_Migración SHALL eliminar los siguientes archivos: `src/lib/db.ts`, `src/lib/auth/auth.ts`, `src/lib/auth/auth.config.ts`, `src/types/next-auth.d.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `prisma.config.ts`
2. THE Sistema_Migración SHALL eliminar el directorio `src/generated/prisma/` que contiene los tipos generados por Prisma
3. THE Sistema_Migración SHALL crear los nuevos archivos de utilidades Supabase: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/middleware.ts`
4. IF algún archivo importa desde una ruta eliminada, THEN THE Sistema_Migración SHALL actualizar esa importación a la nueva ruta correspondiente

### Requisito 17: Row Level Security (RLS)

**User Story:** Como desarrollador, quiero considerar políticas RLS básicas, para que el acceso a datos a través del cliente Supabase sea seguro.

#### Criterios de Aceptación

1. THE Sistema_Migración SHALL documentar qué tablas requieren políticas RLS y cuáles se acceden solo con Service_Role_Key
2. WHEN una Ruta_API acceda a datos del usuario autenticado, THE Sistema_Migración SHALL usar el Cliente_Servidor con la anon key para que RLS filtre automáticamente por usuario
3. WHEN una Ruta_API requiera acceso administrativo sin restricciones de RLS, THE Sistema_Migración SHALL usar el cliente con Service_Role_Key
4. THE Sistema_Migración SHALL crear políticas RLS básicas para las tablas que se acceden con la anon key: users (lectura del propio perfil), carts (CRUD del propio carrito), addresses (CRUD de las propias direcciones), orders (lectura de los propios pedidos)
