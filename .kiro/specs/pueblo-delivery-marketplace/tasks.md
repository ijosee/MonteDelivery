# Plan de Implementación: Pueblo Delivery Marketplace

## Visión General

Plan de implementación completo para el MVP de Pueblo Delivery Marketplace — una aplicación web de delivery para pueblos y ciudades de Andalucía. Stack: Next.js App Router + TypeScript + Tailwind CSS + Prisma + Neon Postgres + Auth.js v5. Cada tarea construye sobre las anteriores de forma incremental, terminando con la integración completa de todos los componentes.

## Tareas

- [x] 1. Scaffolding del proyecto y configuración base
  - [x] 1.1 Inicializar proyecto Next.js con App Router, TypeScript y Tailwind CSS
    - Crear proyecto con `create-next-app` usando App Router y TypeScript
    - Configurar `tailwind.config.ts` con breakpoints mobile-first (<640px, 640px–1024px, >1024px)
    - Configurar `tsconfig.json` con strict mode y alias `@/` para `src/`
    - Instalar dependencias: `prisma`, `@prisma/client`, `zod`, `bcryptjs`, `next-auth@beta`, `@auth/prisma-adapter`
    - Instalar dependencias de desarrollo: `vitest`, `fast-check`, `@playwright/test`
    - Crear `.env.example` con todas las variables de entorno del Requisito 27.1
    - Crear estructura de directorios según diseño: `src/app/`, `src/lib/`, `src/components/`, `src/hooks/`, `src/types/`, `prisma/`
    - _Requisitos: 22.1, 27.1, 27.2_

  - [x] 1.2 Configurar Prisma y conexión a base de datos
    - Crear `prisma/schema.prisma` con el schema completo de 21 tablas según diseño (User, AuthAccount, Session, Restaurant, RestaurantUser, OpeningHour, DeliveryZone, Category, Product, Allergen, ProductAllergen, Cart, CartItem, Address, GeocodingCache, Order, OrderItem, OrderStatusHistory, CookieConsent, LegalAcceptance, AdminAuditLog)
    - Definir todos los enums: UserRole, RestaurantUserRole, OrderStatus, FulfillmentType, ConsentType
    - Configurar todos los índices, constraints UNIQUE y relaciones FK según Requisito 23
    - Crear `src/lib/db.ts` con singleton de Prisma Client
    - Ejecutar `prisma generate` y `prisma migrate dev` para crear la migración inicial
    - _Requisitos: 22.3, 23.1, 23.2, 23.3_

  - [x] 1.3 Configurar Vitest y estructura de testing
    - Crear `vitest.config.ts` con globals, environment node, alias `@/`, coverage v8
    - Crear `vitest.integration.config.ts` para tests de integración con DB de test
    - Instalar y configurar Playwright: `playwright.config.ts` con baseURL y proyecto chromium
    - Verificar que `pnpm vitest --run` ejecuta correctamente
    - _Requisitos: 28.1, 28.3_

- [ ] 2. Capa de dominio — Funciones puras y constantes
  - [x] 2.1 Implementar módulo Haversine (`src/lib/domain/haversine.ts`)
    - Implementar `distanceKm(lat1, lng1, lat2, lng2)` con fórmula Haversine y constante EARTH_RADIUS_KM = 6371
    - Implementar `isInsideDeliveryZone(customerLat, customerLng, restaurantLat, restaurantLng, radiusKm)`
    - Exportar constante EARTH_RADIUS_KM y tipos
    - _Requisitos: 15.5, 15.6_

  - [ ]* 2.2 Property tests para Haversine
    - **Propiedad 5: Simetría y no-negatividad de Haversine** — Para cualquier par de coordenadas válidas, verificar no-negatividad, simetría e identidad
    - **Valida: Requisitos 15.6, 28.7**
    - **Propiedad 6: Validación de zona de reparto** — Para cualquier dirección, restaurante y radio, `isInsideDeliveryZone` retorna true sii `distanceKm <= R`
    - **Valida: Requisitos 5.5, 15.5**

  - [x] 2.3 Implementar ETACalculator (`src/lib/domain/eta-calculator.ts`)
    - Implementar `computeEta(input: ETAInput): ETAResult` con constantes MVP: PREP_TIME_BASE=20, PREP_TIME_PER_ITEM=2, QUEUE_THRESHOLD=3, QUEUE_FACTOR_PER_ORDER=3, TRAVEL_TIME_PER_KM=4, BUFFER_MINUTES=8, SCHEDULED_WINDOW=10
    - Para ASAP: eta = now + prepTime + queueFactor + travelTime + buffer
    - Para SCHEDULED: eta = scheduledFor, etaWindowEnd = scheduledFor + 10 min
    - Exportar constantes y tipos ETAInput, ETAResult
    - _Requisitos: 6.2, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 2.4 Property tests para ETACalculator
    - **Propiedad 12: Cálculo de ETA ASAP** — Para cualquier pedido ASAP con N ítems, distancia D y C pedidos activos, verificar fórmula exacta y que eta > now
    - **Valida: Requisitos 6.2, 9.1, 9.2, 9.3, 9.4, 28.5**
    - **Propiedad 13: Ventana de entrega SCHEDULED** — Para cualquier pedido SCHEDULED, la ventana es exactamente [scheduledFor, scheduledFor + 10 min]
    - **Valida: Requisitos 7.12, 9.5**

  - [x] 2.5 Implementar OrderFSM (`src/lib/domain/order-fsm.ts`)
    - Implementar mapa TRANSITIONS con todas las transiciones válidas según Requisito 8.2
    - Implementar mapa TRANSITION_PERMISSIONS con roles permitidos por transición según Requisito 8 (permisos RBAC)
    - Implementar `validateTransition(ctx: TransitionContext): TransitionResult` con lógica de idempotencia, verificación de transición, permisos de rol, regla de cancelación SCHEDULED >60 min, regla ASAP solo cancelable en PLACED
    - Implementar `isTerminalStatus(status)` para DELIVERED, REJECTED, CANCELLED
    - Mensajes de error exactos según requisitos
    - _Requisitos: 8.1, 8.2, 8.3, 8.8, 6.3, 6.4, 7.10, 7.11_

  - [ ]* 2.6 Property tests para OrderFSM
    - **Propiedad 9: Modelo de transiciones de la FSM** — Para cualquier estado actual y destino, verificar que transiciones permitidas tienen éxito y no permitidas fallan con mensaje exacto
    - **Valida: Requisitos 8.2, 8.3, 28.6**
    - **Propiedad 10: Idempotencia de la FSM** — Si se solicita transición al mismo estado actual, retorna éxito sin cambio
    - **Valida: Requisito 8.8**
    - **Propiedad 11: Reglas de cancelación de pedidos** — Verificar las 5 reglas de cancelación: ASAP en PLACED (sí), ASAP no PLACED (no), SCHEDULED en PLACED (siempre sí), SCHEDULED ACCEPTED >60min (sí), SCHEDULED ACCEPTED <=60min (no)
    - **Valida: Requisitos 6.3, 6.4, 7.10, 7.11**

  - [x] 2.7 Implementar SlotGenerator (`src/lib/domain/slot-generator.ts`)
    - Implementar `getAvailableSlots(input: SlotGeneratorInput): string[]` con constantes MVP: SLOT_INTERVAL_MINUTES=10, SCHEDULE_LEAD_TIME_MIN=30, MAX_SCHEDULE_DAYS=2
    - Cada slot cumple: (a) dentro de horario de apertura, (b) >= now + 30 min, (c) <= now + 2 días
    - Conversión de día de semana: JS getDay() (0=domingo) → sistema (0=lunes)
    - Exportar constantes y tipos OpeningHour, SlotGeneratorInput
    - _Requisitos: 7.2, 7.3, 7.4, 7.6_

  - [ ]* 2.8 Property tests para SlotGenerator
    - **Propiedad 7: Invariante de slots generados** — Para cualquier restaurante, fecha y now, todos los slots cumplen las 3 condiciones (horario, lead time, max days) y están separados por 10 min
    - **Valida: Requisitos 7.2, 7.3, 7.4, 7.6, 28.8**
    - **Propiedad 8: Clasificación de pedidos programados** — Para cualquier pedido SCHEDULED, si scheduledFor - now > 45 min → "Próximos", si <= 45 min → "A preparar"
    - **Valida: Requisitos 7.5, 7.8, 7.9**

  - [x] 2.9 Implementar constantes de alérgenos (`src/lib/domain/allergens.ts`)
    - Definir array EU_ALLERGENS con los 14 alérgenos del Reglamento UE 1169/2011: id, code, nameEs, icon
    - Nombres oficiales en español: Gluten, Crustáceos, Huevos, Pescado, Cacahuetes, Soja, Lácteos, Frutos de cáscara, Apio, Mostaza, Sésamo, Dióxido de azufre/Sulfitos, Altramuces, Moluscos
    - Exportar tipo Allergen e interfaz
    - _Requisitos: 3.5, 19.1_

  - [x] 2.10 Implementar constantes globales y errores tipados
    - Crear `src/lib/constants.ts` con constantes de configuración MVP
    - Crear `src/lib/errors.ts` con todos los errores tipados del diseño: OUTSIDE_SERVICE_AREA, ADDRESS_NOT_FOUND, OUTSIDE_DELIVERY_ZONE, RESTAURANT_CLOSED, SLOT_UNAVAILABLE, PRODUCT_UNAVAILABLE, PRODUCT_IMAGE_REQUIRED, INVALID_TRANSITION, CANCEL_NOT_ALLOWED_ASAP, CANCEL_NOT_ALLOWED_SCHEDULED, FORBIDDEN, TOO_MANY_ATTEMPTS, NO_RESTAURANTS_FOUND, CART_EMPTY_MESSAGE, CART_DIFFERENT_RESTAURANT
    - Cada error con code, title, message, action y httpStatus exactos según requisitos
    - _Requisitos: 5.3, 5.4, 5.5, 5.6, 5.7, 5.11, 8.3, 12.6_

- [x] 3. Checkpoint — Verificar capa de dominio
  - Ejecutar todos los tests unitarios y property tests: `pnpm vitest --run`
  - Verificar que todas las funciones puras pasan sus tests
  - Asegurar que no hay errores de TypeScript: `pnpm tsc --noEmit`
  - Preguntar al usuario si hay dudas antes de continuar

- [ ] 4. Validadores Zod y tipos compartidos
  - [x] 4.1 Implementar schemas de validación Zod
    - Crear `src/lib/validators/order.schema.ts` con createOrderSchema (addressId, phone +34XXXXXXXXX, fulfillmentType, scheduledFor, idempotencyKey) y refinamiento SCHEDULED requiere scheduledFor
    - Crear `src/lib/validators/address.schema.ts` con createAddressSchema (street, municipality, city, postalCode 5 dígitos, floorDoor opcional, label opcional)
    - Crear `src/lib/validators/product.schema.ts` con createProductSchema (categoryId, name, description, priceEur positivo, imageUrl obligatoria con mensaje "La imagen del producto es obligatoria.", allergenIds array 1-14)
    - Crear `src/lib/validators/auth.schema.ts` con registerSchema, loginSchema, resetPasswordSchema
    - _Requisitos: 3.3, 3.4, 5.1, 5.2, 11.1, 25.5_

  - [ ]* 4.2 Property test para validación de imagen de producto
    - **Propiedad 3: Validación obligatoria de imagen de producto** — Para cualquier intento de crear/actualizar producto con imageUrl vacío, nulo o ausente, el sistema rechaza con "La imagen del producto es obligatoria."
    - **Valida: Requisitos 3.1, 3.3, 3.4**

  - [x] 4.3 Implementar tipos compartidos (`src/types/index.ts`)
    - Definir tipos TypeScript para respuestas de API, DTOs de restaurante, producto, pedido, carrito
    - Definir tipo Permission y constantes de permisos
    - _Requisitos: 24.1_


- [x] 5. Sistema de autenticación y autorización
  - [x] 5.1 Configurar Auth.js v5 con Credentials y Google OAuth
    - Crear `src/lib/auth/auth.config.ts` con providers Credentials (email/password) y Google OAuth
    - Implementar lógica de authorize: validar con Zod, buscar usuario, verificar bcrypt, verificar email_verified, rate limiting (5 intentos → bloqueo 15 min)
    - Configurar callbacks jwt y session para incluir role e id
    - Configurar sesión JWT con maxAge 7 días
    - Crear `src/lib/auth/auth.ts` con helpers getSession, signIn, signOut
    - Crear ruta API `src/app/api/auth/[...nextauth]/route.ts`
    - _Requisitos: 11.1, 11.2, 11.5, 11.6, 11.7, 11.8, 25.9_

  - [x] 5.2 Implementar RBAC (`src/lib/auth/rbac.ts`)
    - Definir tipo Permission con todas las acciones del sistema
    - Implementar mapa ROLE_PERMISSIONS con los 4 roles y sus permisos según la matriz del Requisito 12
    - Implementar `hasPermission(role, permission)` y `requirePermission(role, permission)` que lanza error 403
    - _Requisitos: 12.1, 12.3, 12.4, 12.5, 12.6_

  - [ ]* 5.3 Property test para RBAC
    - **Propiedad 15: Enforcement de permisos RBAC** — Para cualquier usuario con rol R y recurso que requiere permiso P, si R no incluye P, retorna error 403 con mensaje exacto
    - **Valida: Requisitos 12.3, 12.4, 12.6**

  - [x] 5.4 Implementar Middleware de autenticación y seguridad
    - Crear `src/middleware.ts` con verificación de rutas protegidas por rol según diseño
    - Aplicar security headers a todas las respuestas: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Strict-Transport-Security, Content-Security-Policy
    - Redirigir a /auth/login si no autenticado, a / si rol insuficiente
    - _Requisitos: 12.6, 25.1, 25.6_

  - [x] 5.5 Implementar páginas de autenticación
    - Crear `src/app/(public)/auth/login/page.tsx` con formulario email/password y botón Google OAuth
    - Crear `src/app/(public)/auth/registro/page.tsx` con formulario de registro (nombre, email, password)
    - Crear `src/app/(public)/auth/reset-password/page.tsx` con flujo de restablecimiento de contraseña
    - Crear API routes: `POST /api/auth/register`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
    - Implementar hash bcrypt con cost factor >= 10 para contraseñas
    - Asignar rol CUSTOMER por defecto a nuevos registros
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5, 11.8_

- [x] 6. Servicios de infraestructura
  - [x] 6.1 Implementar GeocodingService con caché (`src/lib/services/geocoding.service.ts`)
    - Implementar `normalizeAddress(address)` para normalizar cadenas de dirección (lowercase, sin diacríticos, trim)
    - Implementar `searchCandidates(query, limit)` que llama a CartoCiudad endpoint `candidates` y filtra por Andalucía
    - Implementar `geocodeAddress(address)` que: (1) verifica geocoding_cache, (2) si miss llama a CartoCiudad `find`, (3) valida comunidadAutonoma === "Andalucía", (4) almacena en cache
    - Crear API route proxy `GET /api/geocoding/candidates?q=...` para autocompletado desde el cliente
    - _Requisitos: 15.1, 15.2, 15.3, 15.4_

  - [x] 6.2 Implementar StorageService (`src/lib/services/storage.service.ts`)
    - Implementar upload de imágenes a Cloudflare R2 (compatible S3)
    - Implementar delete de imágenes
    - Validar tipos de archivo permitidos (JPEG, PNG, WebP)
    - _Requisitos: 22.4_

  - [x] 6.3 Implementar EmailService (`src/lib/services/email.service.ts`)
    - Configurar cliente Resend con API key
    - Implementar envío de email de verificación de cuenta
    - Implementar envío de email de restablecimiento de contraseña (enlace válido 1 hora)
    - Implementar envío de email de confirmación de pedido con resumen completo e Info_Precontractual
    - _Requisitos: 11.3, 11.4, 18.4, 22.7_

  - [x] 6.4 Implementar AuditService (`src/lib/services/audit.service.ts`)
    - Implementar `logAudit(entry: AuditEntry)` que inserta en admin_audit_log
    - Registrar userId, action, resourceType, resourceId, details, ipAddress
    - Usar en todas las operaciones administrativas y de acceso a datos personales
    - _Requisitos: 8.7, 16.6, 25.8_

  - [x] 6.5 Configurar Sentry para monitorización
    - Instalar `@sentry/nextjs`
    - Configurar `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
    - Configurar `next.config.ts` con plugin de Sentry
    - Capturar errores no manejados y logs estructurados
    - _Requisitos: 22.8_

- [x] 7. Checkpoint — Verificar infraestructura base
  - Ejecutar `pnpm tsc --noEmit` para verificar tipos
  - Ejecutar `pnpm vitest --run` para verificar tests existentes
  - Verificar que el middleware protege rutas correctamente
  - Preguntar al usuario si hay dudas antes de continuar

- [ ] 8. Catálogo — Listado de restaurantes y ficha
  - [x] 8.1 Implementar API de listado de restaurantes
    - Crear `GET /api/restaurants` con filtros: type, is_open (comparar con horarios actuales), max_delivery_fee, max_min_order
    - Aplicar todos los filtros con lógica AND (Requisito 1.6)
    - Ordenar abiertos antes que cerrados (Requisito 1.8)
    - Retornar: nombre, imagen, tipo de cocina, estado abierto/cerrado, coste de envío EUR, pedido mínimo EUR
    - Mensaje vacío: "No se encontraron restaurantes con estos filtros. Prueba a cambiar los criterios de búsqueda."
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ]* 8.2 Property tests para filtros de restaurantes
    - **Propiedad 1: Corrección de filtros de restaurantes** — Para cualquier lista y combinación de filtros, el resultado contiene únicamente y todos los restaurantes que cumplen TODOS los filtros (AND)
    - **Valida: Requisitos 1.2, 1.3, 1.4, 1.5, 1.6**
    - **Propiedad 2: Invariante de ordenación — abiertos antes que cerrados** — Para todo par (r_i, r_j) con i < j, si r_j está abierto entonces r_i también está abierto
    - **Valida: Requisito 1.8**

  - [x] 8.3 Implementar página Home — listado de restaurantes
    - Crear `src/app/(public)/page.tsx` como RSC con listado de restaurantes
    - Implementar componente `RestaurantCard` con imagen, nombre, tipo, estado, envío, mínimo
    - Implementar barra de filtros: tipo de cocina, "Abierto ahora", coste de envío máximo, pedido mínimo máximo
    - Implementar estado vacío con mensaje del Requisito 1.7
    - Diseño mobile-first con cards apiladas en móvil, grid en tablet/desktop
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 20.1_

  - [x] 8.4 Implementar API de detalle de restaurante
    - Crear `GET /api/restaurants/:slug` con productos organizados por categorías
    - Incluir: nombre, imagen, descripción, tipo, horarios, zona de reparto, envío, mínimo, estado
    - Incluir productos con nombre, descripción, precio EUR, imagen, alérgenos
    - Si cerrado, mostrar próximo horario de apertura
    - _Requisitos: 2.1, 2.2, 2.3, 2.4_

  - [x] 8.5 Implementar página de ficha de restaurante
    - Crear `src/app/(public)/restaurante/[slug]/page.tsx` como RSC
    - Mostrar cabecera con imagen, nombre, tipo, estado, horarios, envío, mínimo, radio
    - Implementar tabs de categorías (Entrantes, Principales, Bebidas, Postres)
    - Implementar `ProductCard` con imagen, nombre, precio EUR, alérgenos (iconos + texto), botón añadir
    - Implementar `AllergenBadge` con icono SVG y nombre oficial en español
    - Si cerrado: mostrar próximo horario y permitir navegar catálogo para pedido SCHEDULED
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.5, 19.2, 19.4_

  - [x] 8.6 Crear iconos SVG de los 14 alérgenos
    - Crear directorio `public/allergen-icons/` con 14 SVGs: gluten.svg, crustaceans.svg, eggs.svg, fish.svg, peanuts.svg, soy.svg, dairy.svg, tree-nuts.svg, celery.svg, mustard.svg, sesame.svg, sulphites.svg, lupin.svg, molluscs.svg
    - SVGs accesibles con título y descripción
    - _Requisitos: 3.2, 19.2_

- [ ] 9. Sistema de carrito persistente
  - [x] 9.1 Implementar API de carrito
    - Crear `GET /api/cart` — carrito del usuario autenticado
    - Crear `POST /api/cart/items` — añadir ítem (productId, quantity, notes)
    - Crear `PATCH /api/cart/items/:itemId` — actualizar cantidad/notas
    - Crear `DELETE /api/cart/items/:itemId` — eliminar ítem
    - Crear `DELETE /api/cart` — vaciar carrito
    - Detectar cambio de restaurante: si el carrito tiene productos de otro restaurante, retornar conflicto 409 con mensaje "Ya tienes productos de otro restaurante..."
    - Carrito persistente en DB (tabla carts + cart_items), vinculado a userId
    - Recalcular subtotal en cada operación
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 24.1_

  - [ ]* 9.2 Property test para subtotal del carrito
    - **Propiedad 4: Invariante de subtotal del carrito** — Para cualquier carrito con N ítems, subtotal === suma(precio_unitario × cantidad) para cada ítem
    - **Valida: Requisitos 4.2, 4.5**

  - [x] 9.3 Implementar página y componentes de carrito
    - Crear `src/app/(customer)/carrito/page.tsx` con lista de ítems del carrito
    - Implementar `CartItem` con nombre, cantidad, precio, notas, botones +/- y eliminar
    - Implementar `CartSummary` con subtotal EUR
    - Implementar estado vacío: "Tu carrito está vacío. ¡Explora los restaurantes!"
    - Implementar diálogo de confirmación para cambio de restaurante
    - Botón "Ir al checkout"
    - _Requisitos: 4.1, 4.2, 4.4, 4.5, 4.6, 20.5_

  - [x] 9.4 Implementar FAB de carrito y hook useCart
    - Crear `src/components/cart/FABCart.tsx` — botón flotante con número de ítems y subtotal EUR
    - Crear `src/hooks/use-cart.ts` — hook cliente para estado del carrito (fetch, add, update, remove)
    - FAB visible en móvil en todas las páginas cuando hay ítems
    - _Requisitos: 20.3_


- [ ] 10. Checkout y creación de pedidos
  - [x] 10.1 Implementar API de direcciones y geocodificación
    - Crear `GET /api/addresses` — direcciones del usuario
    - Crear `POST /api/addresses` — crear dirección con geocodificación automática vía CartoCiudad: (1) geocodificar con `find`, (2) validar comunidadAutonoma === "Andalucía", (3) almacenar lat/lng
    - Crear `DELETE /api/addresses/:id` — eliminar dirección
    - Errores: 422 si dirección no geocodificable o fuera de Andalucía con mensajes exactos
    - No exponer lat/lng en APIs públicas (GDPR)
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.14, 15.1, 15.7, 24.1_

  - [x] 10.2 Implementar API de slots disponibles
    - Crear `GET /api/restaurants/:id/available-slots?date=YYYY-MM-DD`
    - Usar SlotGenerator para generar slots que cumplan las 3 condiciones
    - Retornar array de strings "HH:mm" y fecha
    - _Requisitos: 5.8, 7.6, 24.1_

  - [x] 10.3 Implementar API de creación de pedidos
    - Crear `POST /api/orders` con validación Zod completa
    - Verificar idempotency_key: si duplicada, retornar pedido existente sin crear nuevo (409)
    - Verificar que restaurante está abierto para ASAP (error RESTAURANT_CLOSED)
    - Verificar que slot es válido para SCHEDULED (error SLOT_UNAVAILABLE)
    - Verificar zona de reparto con Haversine (error OUTSIDE_DELIVERY_ZONE con distancias)
    - Verificar disponibilidad de todos los productos del carrito (error PRODUCT_UNAVAILABLE)
    - Calcular ETA con computeEta
    - Crear pedido + order_items (snapshot de nombre y precio) + order_status_history (PLACED)
    - Vaciar carrito tras crear pedido
    - Registrar en audit log
    - _Requisitos: 5.9, 5.10, 5.11, 5.12, 5.13, 5.15, 6.1, 6.2, 8.4, 24.1_

  - [x] 10.4 Implementar página de checkout (flujo guiado mobile-first)
    - Crear `src/app/(customer)/checkout/page.tsx` con 3 pasos
    - **Paso 1 — Dirección**: Direcciones guardadas + "Añadir nueva dirección"
    - Flujo guiado nueva dirección: (1) Calle y número con autocompletado CartoCiudad candidates, (2) Municipio obligatorio (solo Andalucía), (3) CP auto-rellenado, (4) Piso/puerta opcional
    - Implementar `src/hooks/use-address-search.ts` con debounce 300ms para autocompletado
    - Campo teléfono obligatorio (+34)
    - **Paso 2 — Tipo de entrega**: ASAP o SCHEDULED con selector de slots
    - **Paso 3 — Confirmar pedido**: Resumen con subtotal, envío, total EUR; Info_Precontractual (identidad restaurante, desglose precios, forma de pago, ETA, condiciones cancelación); checkbox aceptación condiciones y privacidad; botón confirmar
    - Mostrar errores con títulos y mensajes exactos según requisitos
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.15, 18.1, 18.2, 20.1_

  - [x] 10.5 Implementar página de confirmación de pedido
    - Crear página de confirmación con: ✅ ¡Pedido confirmado!, número de pedido, ETA, botón "Ver seguimiento"
    - Registrar aceptación legal en tabla legal_acceptances (timestamp, versión documento, IP)
    - Enviar email de confirmación con resumen completo vía EmailService
    - _Requisitos: 18.3, 18.4_

- [ ] 11. Tracking de pedidos e historial
  - [x] 11.1 Implementar API de tracking y detalle de pedido
    - Crear `GET /api/orders/:id` con detalle completo: productos, cantidades, precios, dirección, tipo, línea de tiempo de estados, ETA actual
    - Crear `GET /api/orders` con historial paginado ordenado por fecha descendente
    - Crear `POST /api/orders/:id/cancel` con validación de reglas de cancelación (FSM)
    - _Requisitos: 8.9, 10.1, 10.2, 24.1_

  - [x] 11.2 Implementar página de tracking de pedido
    - Crear `src/app/(customer)/pedidos/[id]/page.tsx` con línea de tiempo visual
    - Implementar `OrderTimeline` con estados alcanzados, timestamps y ETA actual
    - Implementar `ETADisplay` con ETA para ASAP y ventana para SCHEDULED
    - Implementar polling inteligente con `src/hooks/use-polling.ts`: 10s para PREPARING/READY_FOR_PICKUP/OUT_FOR_DELIVERY, 30s para otros estados activos, desactivado para terminales
    - Botón cancelar visible según reglas de la FSM
    - _Requisitos: 8.9, 9.6, 9.7, 6.3, 7.10_

  - [x] 11.3 Implementar página de historial de pedidos
    - Crear `src/app/(customer)/pedidos/page.tsx` con lista paginada
    - Mostrar: número de pedido, nombre restaurante, fecha, estado final, total EUR
    - Click en pedido → detalle completo
    - _Requisitos: 10.1, 10.2_

- [ ] 12. Panel de restaurante
  - [x] 12.1 Implementar API del panel de restaurante
    - Crear `GET /api/restaurant/orders` con filtros por status y fulfillmentType, paginado
    - Crear `POST /api/restaurant/orders/:id/accept` — transición PLACED→ACCEPTED
    - Crear `POST /api/restaurant/orders/:id/reject` — transición PLACED→REJECTED con motivo obligatorio
    - Crear `POST /api/restaurant/orders/:id/status` — cambiar estado según FSM con validación de permisos
    - Crear `POST /api/restaurant/staff/invite` — invitar staff por email
    - Registrar todas las transiciones en OrderStatusHistory y audit log
    - Recalcular ETA en cada transición de estado
    - Notificar al customer (in-app + email opcional)
    - _Requisitos: 8.4, 8.5, 8.6, 8.7, 13.3, 13.4, 24.1_

  - [x] 12.2 Implementar dashboard del panel de restaurante
    - Crear `src/app/(restaurant)/panel/page.tsx` con dashboard de pedidos
    - Cola de pedidos ASAP pendientes ordenados por fecha ascendente
    - Lista de pedidos SCHEDULED dividida en "Próximos" (>45 min) y "A preparar" (<=45 min)
    - Indicador sonoro y visual para nuevos pedidos
    - Número de pedidos activos y ETA promedio
    - Polling inteligente para actualización en tiempo real
    - _Requisitos: 13.1, 13.2, 13.5, 13.6, 13.7_

  - [x] 12.3 Implementar gestión de catálogo del restaurante
    - Crear `src/app/(restaurant)/panel/catalogo/page.tsx` para RESTAURANT_OWNER
    - CRUD de categorías (nombre, orden)
    - CRUD de productos con validación de imagen obligatoria y selección de alérgenos
    - Upload de imágenes a R2 vía StorageService
    - RESTAURANT_STAFF no puede editar catálogo (RBAC)
    - _Requisitos: 12.3, 14.3, 14.4_

  - [x] 12.4 Implementar gestión de staff
    - Crear `src/app/(restaurant)/panel/staff/page.tsx` para RESTAURANT_OWNER
    - Listar staff asociado al restaurante
    - Invitar nuevo staff por email
    - _Requisitos: 12.2_

- [ ] 13. Panel de administración
  - [x] 13.1 Implementar APIs de administración
    - Crear `GET/POST/PATCH /api/admin/restaurants` — CRUD restaurantes con activar/desactivar
    - Crear `GET/POST/PATCH/DELETE /api/admin/categories` — CRUD categorías por restaurante
    - Crear `GET/POST/PATCH/DELETE /api/admin/products` — CRUD productos con validación imagen
    - Crear `GET /api/admin/orders` — todos los pedidos con filtros (restaurante, estado, fecha, tipo)
    - Crear `GET /api/admin/users` — gestión de usuarios
    - Crear `GET /api/admin/audit-log` — logs de auditoría con filtros (usuario, acción, fecha)
    - Crear `GET /api/admin/metrics` — métricas: total pedidos (hoy/semana/mes), por estado, ingresos EUR, restaurantes activos
    - Todas las operaciones registradas en audit log
    - _Requisitos: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 24.1_

  - [x] 13.2 Implementar dashboard de administración
    - Crear `src/app/(admin)/admin/page.tsx` con métricas: pedidos hoy/semana/mes, por estado, ingresos EUR, restaurantes activos
    - _Requisitos: 14.1_

  - [x] 13.3 Implementar páginas CRUD de administración
    - Crear `src/app/(admin)/admin/restaurantes/page.tsx` — tabla con nombre, tipo, estado, pedidos hoy, acciones (editar, activar/desactivar)
    - Crear `src/app/(admin)/admin/pedidos/page.tsx` — tabla con filtros por restaurante, estado, fecha, tipo
    - Crear `src/app/(admin)/admin/usuarios/page.tsx` — gestión de usuarios
    - Crear `src/app/(admin)/admin/auditoria/page.tsx` — logs de auditoría con filtros
    - Al desactivar restaurante: no aparece en listado público, checkout rechaza nuevos pedidos
    - _Requisitos: 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [x] 14. Checkpoint — Verificar flujos principales
  - Ejecutar todos los tests: `pnpm vitest --run`
  - Verificar tipos: `pnpm tsc --noEmit`
  - Verificar que los flujos principales funcionan end-to-end
  - Preguntar al usuario si hay dudas antes de continuar


- [ ] 15. Cumplimiento normativo (GDPR, ePrivacy, Consumer Rights)
  - [x] 15.1 Implementar Cookie Banner
    - Crear `src/components/legal/CookieBanner.tsx` con opciones: "Necesarias" (siempre activas), "Analíticas" (opt-in), "Marketing" (opt-in)
    - No establecer cookies analíticas ni marketing sin consentimiento explícito
    - Registrar consentimiento en tabla cookie_consents (timestamp, tipo, decisión, IP, user_agent)
    - Mostrar banner en primera visita
    - _Requisitos: 17.1, 17.2, 17.3_

  - [x] 15.2 Implementar página de configuración de privacidad
    - Crear `src/app/(customer)/perfil/privacidad/page.tsx`
    - Permitir revocar consentimiento de cookies en cualquier momento
    - Eliminar cookies no necesarias al revocar
    - Botón "Exportar mis datos" → genera JSON descargable con todos los datos personales
    - Botón "Eliminar mi cuenta" → anonimizar datos, mantener pedidos anonimizados para obligaciones fiscales (5 años)
    - Registrar todas las operaciones en audit log
    - _Requisitos: 16.3, 16.4, 16.5, 16.6, 17.4, 17.5_

  - [x] 15.3 Implementar APIs GDPR
    - Crear `POST /api/user/export-data` — generar JSON con todos los datos personales del usuario
    - Crear `POST /api/user/delete-account` — anonimizar datos personales, mantener datos de pedidos anonimizados
    - Períodos de retención: pedidos 5 años, cuenta 30 días tras borrado, audit logs 2 años
    - _Requisitos: 16.3, 16.4, 16.5, 24.1_

- [ ] 16. UX/UI — Layout responsive y navegación
  - [x] 16.1 Implementar Root Layout y providers
    - Crear `src/app/layout.tsx` con providers (SessionProvider, etc.), metadata, fuentes
    - Integrar CookieBanner en el layout raíz
    - Configurar idioma español (lang="es")
    - _Requisitos: 20.5_

  - [x] 16.2 Implementar navegación mobile-first
    - Crear `src/components/layout/Header.tsx` con logo "Pueblo Delivery" y navegación desktop
    - Crear `src/components/layout/BottomNav.tsx` con iconos: 🏠 Inicio, 🔍 Buscar, 📋 Pedidos, 👤 Perfil (visible solo en móvil)
    - Integrar FABCart en el layout (visible en móvil cuando hay ítems)
    - _Requisitos: 20.2, 20.3_

  - [x] 16.3 Implementar componentes UI base
    - Crear `src/components/ui/` con componentes base: Button, Input, Card, Select, Dialog, Badge, Tabs
    - Cumplir accesibilidad: foco visible, botones 44x44px mínimo, contraste 4.5:1, etiquetas ARIA
    - Todos los textos en español
    - _Requisitos: 20.4, 20.5_

  - [x] 16.4 Implementar página de perfil
    - Crear `src/app/(customer)/perfil/page.tsx` con avatar, nombre, email
    - Links a: Mis direcciones, Mis pedidos, Configuración privacidad, Cómo funciona, FAQ
    - Botón cerrar sesión
    - Crear `src/app/(customer)/perfil/direcciones/page.tsx` para gestionar direcciones guardadas
    - _Requisitos: 5.14_

- [ ] 17. Página "Cómo funciona" y FAQ
  - [x] 17.1 Implementar página de ayuda
    - Crear `src/app/(public)/como-funciona/page.tsx`
    - Guía paso a paso para clientes: (1) Elige restaurante, (2) Añade productos, (3) Introduce dirección y hora, (4) Confirma pedido, (5) Sigue estado, (6) Recibe y paga
    - Guía paso a paso para restaurantes: (1) Recibe pedidos, (2) Acepta/rechaza, (3) Preparando, (4) Listo, (5) En camino, (6) Entregado
    - Sección FAQ con las 4 preguntas y respuestas exactas del Requisito 21.3
    - Accesible desde menú principal
    - _Requisitos: 21.1, 21.2, 21.3_

- [ ] 18. Seed data completa
  - [x] 18.1 Implementar script de seed (`prisma/seed.ts`)
    - Seed de 14 alérgenos UE en tabla allergens
    - Seed de 5 restaurantes con datos completos: nombre, slug, tipo, dirección, lat/lng (zona Andalucía), envío, mínimo, radio, horarios de apertura, zona de reparto
    - Seed de categorías por restaurante (Entrantes, Principales, Bebidas, Postres, etc.)
    - Seed de 50 productos (8-12 por restaurante) con image_url placeholder válido y alérgenos asignados según Requisito 26.2
    - Seed de 12 usuarios con roles según Requisito 26.3 (1 admin, 3 owners, 3 staff, 5 customers), passwords hasheadas con bcrypt
    - Seed de asociaciones restaurant_users (owners y staff a sus restaurantes)
    - Seed de 10 direcciones con lat/lng válidos de Andalucía según Requisito 26.4
    - Seed de 12 pedidos (6 ASAP + 6 SCHEDULED) con OrderStatusHistory completo cubriendo todos los estados (DELIVERED, REJECTED, CANCELLED, PREPARING, OUT_FOR_DELIVERY)
    - Configurar `package.json` con script `prisma:seed` que ejecuta `prisma/seed.ts`
    - _Requisitos: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6_

- [x] 19. Checkpoint — Verificar aplicación completa
  - Ejecutar todos los tests: `pnpm vitest --run`
  - Ejecutar seed: `pnpm prisma db seed`
  - Verificar tipos: `pnpm tsc --noEmit`
  - Verificar que la aplicación compila: `pnpm build`
  - Preguntar al usuario si hay dudas antes de continuar

- [ ] 20. Seguridad y rate limiting
  - [x] 20.1 Implementar protección CSRF y rate limiting
    - Implementar protección CSRF en todos los formularios de mutación (Server Actions ya incluyen CSRF por defecto en Next.js)
    - Implementar rate limiting en endpoints de autenticación: máximo 10 intentos por minuto por IP
    - Implementar bloqueo de cuenta tras 5 intentos fallidos de login (15 min)
    - Validar y sanitizar todas las entradas en backend (Prisma parametriza queries, Zod valida inputs)
    - _Requisitos: 25.3, 25.4, 25.5_

  - [x] 20.2 Verificar headers de seguridad y restricciones de datos
    - Verificar que middleware aplica todos los security headers: CSP, X-Frame-Options, X-Content-Type-Options, HSTS
    - Verificar que lat/lng no se exponen en APIs públicas
    - Verificar que todas las operaciones admin se registran en audit log
    - Implementar invalidación de todas las sesiones activas desde perfil
    - _Requisitos: 25.6, 25.7, 25.8, 25.10_

- [ ] 21. Tests de integración y E2E
  - [ ]* 21.1 Tests de integración — flujos de pedidos
    - Test: Crear pedido ASAP completo (carrito → checkout → pedido → tracking)
    - Test: Crear pedido SCHEDULED completo con slot válido
    - Test: Flujo de aceptación y cambio de estados por restaurante (PLACED → ACCEPTED → PREPARING → READY → OUT → DELIVERED)
    - Test: Doble submit con misma idempotency_key retorna mismo pedido
    - **Propiedad 14: Idempotencia de creación de pedidos** — Para cualquier par de solicitudes con misma idempotency_key, se crea exactamente un pedido
    - **Valida: Requisitos 5.12, 5.13**
    - _Requisitos: 28.2_

  - [ ]* 21.2 Tests de integración — auth y geocoding
    - Test: Registro e inicio de sesión con email/contraseña
    - Test: Geocodificar dirección → cache hit en segunda llamada
    - Test: Dirección fuera de Andalucía → error "Fuera de zona de servicio"
    - _Requisitos: 28.2_

  - [ ]* 21.3 Tests E2E con Playwright
    - Test: Flujo completo de cliente: buscar restaurante → añadir productos → checkout → confirmar → ver tracking
    - Test: Flujo de restaurante: ver pedido → aceptar → preparar → listo → en camino → entregado
    - Test: Flujo admin: crear restaurante → añadir categoría → añadir producto con imagen
    - Test: Flujo de dirección CartoCiudad: autocompletado → geocodificación
    - _Requisitos: 28.3_

  - [ ]* 21.4 Tests de edge cases
    - Test: Slot inválido (fuera de horario, pasado, sin lead time)
    - Test: Dirección fuera de zona de reparto (distance_km > delivery_radius_km)
    - Test: Restaurante cerrado para pedido ASAP
    - Test: Producto sin imagen rechazado
    - Test: Transición de estado no permitida (ej: PREPARING → PLACED)
    - Test: Cancelación SCHEDULED con menos de 60 min → rechazada
    - Test: Carrito de otro restaurante → aviso con opciones
    - _Requisitos: 28.4_

- [ ] 22. Configuración de despliegue Vercel
  - [x] 22.1 Configurar proyecto para despliegue
    - Configurar `next.config.ts` con output standalone si necesario, configuración de imágenes (dominios R2)
    - Crear `.env.example` completo con todas las variables documentadas
    - Configurar build command: `pnpm build`
    - Verificar que `pnpm build` completa sin errores
    - Documentar checklist de deploy en README: conectar repo, configurar env vars, ejecutar migraciones, verificar conexión Neon
    - _Requisitos: 22.9, 27.2, 27.3_

- [x] 23. Checkpoint final — Verificar MVP completo
  - Ejecutar suite completa de tests: `pnpm vitest --run`
  - Ejecutar build de producción: `pnpm build`
  - Verificar tipos: `pnpm tsc --noEmit`
  - Verificar que seed funciona: `pnpm prisma db seed`
  - Verificar que todos los requisitos están cubiertos por las tareas implementadas
  - Preguntar al usuario si hay dudas o ajustes necesarios

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos que implementa para trazabilidad
- Los checkpoints aseguran validación incremental del progreso
- Los property tests validan las 15 propiedades de corrección definidas en el documento de diseño
- Los unit tests validan casos específicos y edge cases de los requisitos
- Todos los textos de interfaz están en español (ES)
- Stack: Next.js App Router + TypeScript + Tailwind CSS + Prisma + Neon Postgres + Auth.js v5 + Vitest + fast-check + Playwright