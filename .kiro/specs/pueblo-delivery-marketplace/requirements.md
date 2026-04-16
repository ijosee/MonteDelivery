# Documento de Requisitos — Pueblo Delivery Marketplace

## Introducción

Pueblo Delivery Marketplace es una aplicación web de marketplace de delivery diseñada para pueblos y ciudades de Andalucía, España (UE). Permite a los clientes explorar restaurantes locales, realizar pedidos de comida a domicilio (ASAP o programados a hora exacta), y hacer seguimiento del estado de sus pedidos. Los restaurantes gestionan su propio reparto (sin riders de plataforma). El pago se realiza contra entrega (efectivo). La dirección de entrega se introduce mediante un flujo guiado con autocompletado vía CartoCiudad (servicio de geocodificación del gobierno español) y se valida que pertenezca a Andalucía. La aplicación cumple con la normativa europea (GDPR, ePrivacy, Consumer Rights, Reglamento 1169/2011 de alérgenos). Precios en EUR (€). Despliegue en Vercel. Mobile-first responsive.

ASUNCIÓN (MVP): El reparto lo gestiona cada restaurante. ALTERNATIVA (Fase 2): Riders de plataforma con geolocalización GPS en tiempo real.

ASUNCIÓN (MVP): Pago contra entrega (efectivo). ALTERNATIVA (Fase 2): Pagos online (Stripe/Redsys).

ASUNCIÓN (MVP): Tracking basado en estados del pedido + ETA estimada, sin GPS. ALTERNATIVA (Fase 2): Tracking GPS en tiempo real del repartidor.

ASUNCIÓN (MVP): Realtime mediante polling inteligente + Server Actions. ALTERNATIVA (Fase 2): WebSockets para notificaciones en tiempo real.

## Glosario

- **Sistema**: La aplicación web Pueblo Delivery Marketplace en su conjunto.
- **Catálogo**: El módulo que gestiona restaurantes, categorías y productos.
- **Carrito**: El módulo que gestiona la cesta de compra del cliente con productos seleccionados.
- **Checkout**: El módulo que valida y procesa la creación de un pedido.
- **Pedido**: Una solicitud de entrega de productos de un restaurante a una dirección del cliente.
- **FSM_Pedido**: La máquina de estados finitos que gobierna las transiciones de estado de un pedido.
- **Panel_Restaurante**: El dashboard de gestión para propietarios y staff de restaurantes.
- **Panel_Admin**: El dashboard de administración global del sistema.
- **Geocoder**: El módulo que convierte direcciones en coordenadas lat/lng usando CartoCiudad.
- **CartoCiudad**: Servicio de geocodificación gratuito del gobierno español (IGN/CNIG) que convierte direcciones en coordenadas lat/lng. No requiere API key. Usa dos endpoints: `candidates` (autocompletado de direcciones) y `find` (geocodificación final).
- **Geocoding_Cache**: Caché de resultados de geocodificación para evitar llamadas repetidas a CartoCiudad. Indexada por cadena de dirección normalizada.
- **Calculador_ETA**: El módulo que estima el tiempo de entrega de un pedido.
- **Validador_Zona**: El módulo que verifica si una dirección está dentro de la zona de reparto.
- **Auth**: El módulo de autenticación y autorización del sistema.
- **RBAC**: Control de acceso basado en roles (Role-Based Access Control).
- **CUSTOMER**: Rol de usuario cliente que realiza pedidos.
- **RESTAURANT_OWNER**: Rol de propietario de restaurante con gestión completa.
- **RESTAURANT_STAFF**: Rol de empleado de restaurante con gestión limitada de pedidos.
- **ADMIN**: Rol de administrador global del sistema.
- **ASAP**: Tipo de pedido para entrega lo antes posible.
- **SCHEDULED**: Tipo de pedido programado para una hora exacta.
- **ETA**: Estimated Time of Arrival — hora estimada de entrega.
- **Haversine**: Fórmula para calcular distancia entre dos puntos geográficos en una esfera.
- **Slot**: Franja horaria disponible para programar un pedido.
- **Idempotency_Key**: Clave única que previene la creación duplicada de pedidos.
- **Cookie_Banner**: El componente de interfaz que gestiona el consentimiento de cookies.
- **Alérgeno**: Sustancia que puede causar reacciones alérgicas, según Reglamento UE 1169/2011.
- **Info_Precontractual**: Información obligatoria que el Sistema muestra al cliente antes de confirmar un pedido según la Directiva de Derechos del Consumidor.
- **Storage**: El servicio de almacenamiento de imágenes (S3/R2/Supabase Storage).
- **Polling_Inteligente**: Mecanismo de consulta periódica al servidor con intervalos adaptativos.


## Requisitos

---

### Requisito 1: Listado de Restaurantes (Home)

**User Story:** Como CUSTOMER, quiero ver un listado de restaurantes disponibles con filtros, para encontrar rápidamente dónde pedir comida.

#### Criterios de Aceptación

1. WHEN el CUSTOMER accede a la página principal, THE Catálogo SHALL mostrar una lista de restaurantes activos con nombre, imagen, tipo de cocina, estado abierto/cerrado, coste de envío en EUR (€) y pedido mínimo en EUR (€).
2. WHEN el CUSTOMER aplica un filtro por tipo de cocina, THE Catálogo SHALL mostrar solo los restaurantes que coincidan con el tipo seleccionado.
3. WHEN el CUSTOMER activa el filtro "Abierto ahora", THE Catálogo SHALL mostrar solo los restaurantes cuyo horario de apertura incluya la hora actual.
4. WHEN el CUSTOMER aplica un filtro por coste de envío máximo, THE Catálogo SHALL mostrar solo los restaurantes cuyo coste de envío sea menor o igual al valor seleccionado.
5. WHEN el CUSTOMER aplica un filtro por pedido mínimo máximo, THE Catálogo SHALL mostrar solo los restaurantes cuyo pedido mínimo sea menor o igual al valor seleccionado.
6. WHEN el CUSTOMER combina múltiples filtros, THE Catálogo SHALL aplicar todos los filtros simultáneamente con lógica AND.
7. WHEN no hay restaurantes que coincidan con los filtros, THE Catálogo SHALL mostrar el mensaje "No se encontraron restaurantes con estos filtros. Prueba a cambiar los criterios de búsqueda."
8. THE Catálogo SHALL mostrar los restaurantes abiertos antes que los cerrados en el listado.

---

### Requisito 2: Ficha de Restaurante

**User Story:** Como CUSTOMER, quiero ver la información completa de un restaurante con su catálogo organizado por categorías, para decidir qué pedir.

#### Criterios de Aceptación

1. WHEN el CUSTOMER accede a la ficha de un restaurante, THE Catálogo SHALL mostrar nombre, imagen, descripción, tipo de cocina, horarios de apertura, zona de reparto (radio en km), coste de envío en EUR (€), pedido mínimo en EUR (€) y estado abierto/cerrado.
2. WHEN el CUSTOMER visualiza el catálogo del restaurante, THE Catálogo SHALL organizar los productos por categorías (ej: "Entrantes", "Principales", "Bebidas", "Postres").
3. WHEN el restaurante está cerrado, THE Catálogo SHALL mostrar el próximo horario de apertura y permitir al CUSTOMER navegar el catálogo para realizar un pedido SCHEDULED.
4. THE Catálogo SHALL mostrar cada producto con nombre, descripción, precio en EUR (€), imagen obligatoria y lista de alérgenos visibles.

---

### Requisito 3: Producto con Imagen Obligatoria y Alérgenos

**User Story:** Como CUSTOMER, quiero ver la imagen y los alérgenos de cada producto antes de añadirlo al carrito, para tomar decisiones informadas sobre mi pedido.

#### Criterios de Aceptación

1. THE Catálogo SHALL mostrar cada producto con una imagen válida (image_url NOT NULL).
2. THE Catálogo SHALL mostrar los 14 alérgenos del Reglamento UE 1169/2011 aplicables a cada producto mediante iconos y texto accesible antes de que el CUSTOMER añada el producto al Carrito.
3. WHEN un RESTAURANT_OWNER o ADMIN intenta crear o actualizar un producto sin imagen, THE Sistema SHALL rechazar la operación con el mensaje "La imagen del producto es obligatoria."
4. THE Sistema SHALL validar la presencia de image_url tanto en la interfaz de usuario como en el backend (API).
5. WHEN el CUSTOMER visualiza un producto, THE Catálogo SHALL listar los alérgenos presentes usando los nombres oficiales: Gluten, Crustáceos, Huevos, Pescado, Cacahuetes, Soja, Lácteos, Frutos de cáscara, Apio, Mostaza, Sésamo, Dióxido de azufre/Sulfitos, Altramuces, Moluscos.

---

### Requisito 4: Carrito Persistente

**User Story:** Como CUSTOMER, quiero que mi carrito se mantenga entre sesiones y poder ajustar cantidades y notas por producto, para completar mi pedido cuando esté listo.

#### Criterios de Aceptación

1. WHEN el CUSTOMER añade un producto al Carrito, THE Carrito SHALL almacenar el producto con cantidad, precio unitario en EUR (€) y notas opcionales por ítem.
2. WHEN el CUSTOMER modifica la cantidad de un producto en el Carrito, THE Carrito SHALL recalcular el subtotal en EUR (€) de forma inmediata.
3. WHEN el CUSTOMER cierra la sesión y vuelve a iniciar sesión, THE Carrito SHALL restaurar los productos previamente añadidos.
4. WHEN el CUSTOMER añade productos de un restaurante diferente al que ya tiene en el Carrito, THE Carrito SHALL mostrar un aviso: "Ya tienes productos de otro restaurante. ¿Deseas vaciar el carrito y añadir este producto?" con opciones "Vaciar y añadir" y "Cancelar".
5. THE Carrito SHALL mostrar el subtotal acumulado en EUR (€) en todo momento.
6. WHEN el CUSTOMER elimina todos los productos del Carrito, THE Carrito SHALL mostrar el mensaje "Tu carrito está vacío. ¡Explora los restaurantes!"

---

### Requisito 5: Checkout y Creación de Pedido

**User Story:** Como CUSTOMER, quiero completar mi pedido proporcionando dirección, teléfono y tipo de entrega, para recibir mi comida a domicilio.

#### Criterios de Aceptación

1. WHEN el CUSTOMER inicia el Checkout, THE Checkout SHALL requerir una dirección de entrega obligatoria y un número de teléfono obligatorio.
2. WHEN el CUSTOMER introduce una nueva dirección, THE Checkout SHALL presentar un flujo guiado mobile-first: (1) Calle y número con autocompletado vía CartoCiudad endpoint `candidates`, (2) Municipio obligatorio (solo municipios de Andalucía), (3) Código postal (auto-rellenado si disponible), (4) Piso/puerta (opcional, texto libre corto). WHEN el CUSTOMER confirma la dirección, THE Geocoder SHALL geocodificar la dirección final usando CartoCiudad endpoint `find` y almacenar lat/lng normalizados.
3. WHEN la dirección geocodificada por CartoCiudad tiene comunidadAutonoma distinto de "Andalucía", THE Validador_Zona SHALL mostrar el error con título "❌ Fuera de zona de servicio", mensaje "Por ahora solo repartimos en Andalucía. La dirección que has introducido está fuera de nuestra zona actual." y acción "Cambiar dirección".
4. WHEN el Geocoder no puede resolver la dirección del CUSTOMER, THE Sistema SHALL mostrar el error con título "❌ No hemos podido encontrar la dirección", mensaje "Revisa la calle y el número e inténtalo de nuevo. Usa una dirección postal completa y válida." y acción "Editar dirección".
5. WHEN la dirección del CUSTOMER está fuera de la zona de reparto del restaurante (distance_km > delivery_radius_km calculado con Haversine), THE Validador_Zona SHALL mostrar el error con título "🚫 Este restaurante no llega a tu dirección", mensaje "Este restaurante reparte hasta {X} km y tu dirección está a {Y} km." y acciones "Ver restaurantes cercanos" / "Cambiar dirección".
6. WHEN el CUSTOMER selecciona tipo de pedido ASAP y el restaurante está cerrado, THE Checkout SHALL mostrar el error con título "⏰ Restaurante cerrado", mensaje "Este restaurante está cerrado ahora mismo. Puedes programar tu pedido para más tarde." y acción "Programar pedido".
7. WHEN el CUSTOMER selecciona tipo de pedido SCHEDULED y la hora seleccionada no está dentro del horario del restaurante, THE Checkout SHALL mostrar el error con título "⏱️ Hora no disponible", mensaje "La hora seleccionada no está dentro del horario del restaurante. Elige otra hora disponible." y acción: selector de hora válido.
8. WHEN el CUSTOMER selecciona tipo de pedido SCHEDULED, THE Checkout SHALL mostrar los slots disponibles obtenidos del endpoint GET /restaurants/{id}/available-slots.
9. WHEN el CUSTOMER confirma el pedido, THE Checkout SHALL mostrar un resumen con subtotal, coste de envío y total en EUR (€) como Info_Precontractual antes de la confirmación final.
10. WHEN el CUSTOMER confirma el pedido, THE Checkout SHALL verificar que todos los productos del Carrito siguen disponibles.
11. WHEN un producto del Carrito ya no está disponible, THE Checkout SHALL mostrar el mensaje "El producto [nombre_producto] ya no está disponible. Por favor, revisa tu carrito."
12. WHEN el CUSTOMER confirma el pedido, THE Checkout SHALL crear el pedido con una Idempotency_Key única para prevenir duplicados.
13. WHEN el CUSTOMER envía el formulario de confirmación dos veces (doble submit), THE Checkout SHALL detectar la Idempotency_Key duplicada y retornar el pedido existente sin crear uno nuevo.
14. THE Checkout SHALL permitir al CUSTOMER guardar múltiples direcciones de entrega en su perfil.
15. WHEN el CUSTOMER confirma el pedido, THE Checkout SHALL mostrar la Info_Precontractual obligatoria: identidad del restaurante, precio total desglosado (subtotal + envío), forma de pago (contra entrega), plazo de entrega estimado (ETA) y condiciones de cancelación.

---

### Requisito 6: Pedidos ASAP

**User Story:** Como CUSTOMER, quiero realizar un pedido para entrega inmediata, para recibir mi comida lo antes posible.

#### Criterios de Aceptación

1. WHEN el CUSTOMER selecciona fulfillment_type ASAP, THE Checkout SHALL verificar que el restaurante está abierto en el momento de la confirmación.
2. WHEN el pedido ASAP es creado, THE Calculador_ETA SHALL calcular la ETA usando la fórmula: eta = now + prep_time + travel_time + buffer.
3. WHEN el CUSTOMER desea cancelar un pedido ASAP, THE FSM_Pedido SHALL permitir la cancelación solo mientras el estado sea PLACED.
4. WHEN el CUSTOMER intenta cancelar un pedido ASAP en estado diferente a PLACED, THE FSM_Pedido SHALL mostrar el mensaje "Este pedido ya no se puede cancelar porque está siendo preparado."

**Ejemplo concreto — Pedido ASAP:**
- Hora actual: 13:00. Restaurante "Hamburguesería Sa Plaça" abierto (12:00–16:00).
- Carrito: 2x Burger Clásica (8,50 € c/u) + 1x Patatas (3,50 €) = Subtotal 20,50 €. Envío: 2,00 €. Total: 22,50 €.
- Distancia: 1,2 km. prep_time = 20 + (3 × 2) = 26 min. travel_time = 1,2 × 4 = 4,8 min ≈ 5 min. buffer = 8 min. ETA = 13:00 + 26 + 5 + 8 = 13:39.
- Mensaje al cliente: "Entrega estimada: 13:39."

---

### Requisito 7: Pedidos Programados (SCHEDULED)

**User Story:** Como CUSTOMER, quiero programar un pedido para una hora exacta, para recibir mi comida cuando me convenga.

#### Criterios de Aceptación

1. WHEN el CUSTOMER selecciona fulfillment_type SCHEDULED, THE Checkout SHALL requerir un campo scheduled_for (timestamp con zona horaria) obligatorio.
2. THE Sistema SHALL generar slots con intervalo de 10 minutos (slot_interval_minutes = 10). ASUNCIÓN (MVP): Intervalo fijo de 10 min. ALTERNATIVA (Fase 2): Intervalo configurable por restaurante.
3. THE Sistema SHALL requerir un tiempo mínimo de antelación de 30 minutos (schedule_lead_time_min = 30). ASUNCIÓN (MVP): 30 min fijos. ALTERNATIVA (Fase 2): Configurable por restaurante.
4. THE Sistema SHALL permitir programar pedidos hasta 2 días en el futuro (max_schedule_days = 2). ASUNCIÓN (MVP): 2 días fijos. ALTERNATIVA (Fase 2): Configurable por restaurante.
5. THE Sistema SHALL definir una ventana de preparación de 45 minutos (prep_window_min = 45). ASUNCIÓN (MVP): 45 min fijos. ALTERNATIVA (Fase 2): Configurable por restaurante.
6. WHEN el endpoint GET /restaurants/{id}/available-slots es consultado con un parámetro date=YYYY-MM-DD, THE Sistema SHALL retornar solo los slots que cumplan: (a) están dentro del horario de apertura del restaurante, (b) son >= NOW + schedule_lead_time_min, y (c) son <= NOW + max_schedule_days.
7. WHILE el restaurante está cerrado, THE Checkout SHALL permitir pedidos SCHEDULED solo si existe un horario de apertura futuro dentro de max_schedule_days.
8. WHEN un pedido SCHEDULED tiene scheduled_for a más de prep_window_min (45 min) del momento actual, THE Panel_Restaurante SHALL clasificar el pedido como "Próximos".
9. WHEN un pedido SCHEDULED tiene scheduled_for a menos de o igual a prep_window_min (45 min) del momento actual, THE Panel_Restaurante SHALL clasificar el pedido como "A preparar".
10. WHEN el CUSTOMER desea cancelar un pedido SCHEDULED en estado ACCEPTED, THE FSM_Pedido SHALL permitir la cancelación solo si faltan más de 60 minutos para scheduled_for.
11. WHEN el CUSTOMER desea cancelar un pedido SCHEDULED que aún no ha sido aceptado (estado PLACED), THE FSM_Pedido SHALL permitir la cancelación en cualquier momento.
12. WHEN un pedido SCHEDULED es creado, THE Calculador_ETA SHALL mostrar una ventana de entrega de 10 minutos alrededor de scheduled_for (ej: "Entrega prevista: 13:30–13:40").

**Ejemplo concreto 1 — Pedido SCHEDULED para hoy:**
- Hora actual: 11:00. Restaurante "Casa Tradición" abierto (13:00–16:00, 20:00–23:00).
- CUSTOMER selecciona SCHEDULED. Slots disponibles desde 13:00 (>= 11:00 + 30 min y dentro de horario).
- CUSTOMER elige 13:30. Carrito: 1x Paella Mixta (12,00 €) + 1x Ensalada (6,50 €) = 18,50 €. Envío: 1,50 €. Total: 20,00 €.
- Mensaje: "Entrega prevista: 13:30–13:40."

**Ejemplo concreto 2 — Pedido SCHEDULED para mañana:**
- Hora actual: 22:00 (lunes). Restaurante "Pizzería Forn Nou" cerrado ahora (horario: 12:00–15:00, 19:00–23:00).
- CUSTOMER selecciona SCHEDULED. Slots disponibles: martes 12:00–15:00 y 19:00–23:00.
- CUSTOMER elige martes 20:00. Carrito: 2x Pizza Margarita (9,00 € c/u) = 18,00 €. Envío: 2,50 €. Total: 20,50 €.
- Mensaje: "Entrega prevista: martes 20:00–20:10."

**Ejemplo concreto 3 — Cancelación SCHEDULED:**
- Hora actual: 12:00. Pedido SCHEDULED para 14:00 en estado ACCEPTED.
- Faltan 120 min > 60 min → Cancelación permitida.
- Si fueran las 13:15 (faltan 45 min < 60 min) → Cancelación denegada: "No puedes cancelar este pedido porque falta menos de 1 hora para la entrega programada."


---

### Requisito 8: Estados del Pedido (FSM)

**User Story:** Como CUSTOMER, quiero ver el estado actualizado de mi pedido con una línea de tiempo visual, para saber en qué punto se encuentra mi entrega.

#### Criterios de Aceptación

1. THE FSM_Pedido SHALL gestionar los siguientes estados: PLACED, ACCEPTED, REJECTED (terminal), PREPARING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED (terminal), CANCELLED (terminal).
2. THE FSM_Pedido SHALL permitir únicamente las siguientes transiciones: PLACED→ACCEPTED, PLACED→REJECTED, PLACED→CANCELLED, ACCEPTED→PREPARING, ACCEPTED→CANCELLED (solo SCHEDULED con >60 min), PREPARING→READY_FOR_PICKUP, READY_FOR_PICKUP→OUT_FOR_DELIVERY, OUT_FOR_DELIVERY→DELIVERED.
3. WHEN un RESTAURANT_OWNER o RESTAURANT_STAFF intenta una transición no permitida, THE FSM_Pedido SHALL rechazar la operación con el mensaje "Transición de estado no válida: no se puede pasar de [estado_actual] a [estado_solicitado]."
4. WHEN se produce una transición de estado, THE FSM_Pedido SHALL registrar la transición en OrderStatusHistory con timestamp, estado anterior, estado nuevo, usuario que realizó el cambio y motivo opcional.
5. WHEN se produce una transición de estado, THE Calculador_ETA SHALL recalcular la ETA del pedido.
6. WHEN se produce una transición de estado, THE Sistema SHALL notificar al CUSTOMER mediante notificación in-app y opcionalmente por email.
7. WHEN se produce una transición de estado, THE Sistema SHALL registrar la operación en admin_audit_log.
8. THE FSM_Pedido SHALL garantizar idempotencia en las actualizaciones de estado: si se recibe una solicitud para transicionar a un estado en el que el pedido ya se encuentra, THE FSM_Pedido SHALL retornar éxito sin crear un registro duplicado en OrderStatusHistory.
9. WHEN el CUSTOMER consulta el tracking de su pedido, THE Sistema SHALL mostrar una línea de tiempo visual con todos los estados alcanzados, timestamps y la ETA actual.

**Permisos de transición (RBAC):**
- PLACED→ACCEPTED: RESTAURANT_OWNER, RESTAURANT_STAFF
- PLACED→REJECTED: RESTAURANT_OWNER, RESTAURANT_STAFF (motivo obligatorio)
- PLACED→CANCELLED: CUSTOMER (ASAP: solo en PLACED; SCHEDULED: según regla de 60 min)
- ACCEPTED→PREPARING: RESTAURANT_OWNER, RESTAURANT_STAFF
- ACCEPTED→CANCELLED: CUSTOMER (solo SCHEDULED con >60 min antes de scheduled_for)
- PREPARING→READY_FOR_PICKUP: RESTAURANT_OWNER, RESTAURANT_STAFF
- READY_FOR_PICKUP→OUT_FOR_DELIVERY: RESTAURANT_OWNER, RESTAURANT_STAFF
- OUT_FOR_DELIVERY→DELIVERED: RESTAURANT_OWNER, RESTAURANT_STAFF

---

### Requisito 9: Tracking de Pedido y ETA

**User Story:** Como CUSTOMER, quiero ver la ETA estimada de mi pedido actualizada en tiempo real, para saber cuándo llegará mi comida.

#### Criterios de Aceptación

1. WHEN un pedido ASAP es creado, THE Calculador_ETA SHALL calcular la ETA con la fórmula: prep_time = prep_time_base_minutes (20) + (num_items × prep_time_per_item_minutes (2)) + queue_factor. ASUNCIÓN (MVP): prep_time_base = 20 min, per_item = 2 min. ALTERNATIVA (Fase 2): Configurable por restaurante.
2. WHEN el restaurante tiene más de 3 pedidos activos, THE Calculador_ETA SHALL añadir queue_factor = (pedidos_activos - 3) × 3 minutos.
3. THE Calculador_ETA SHALL calcular travel_time = distance_km × 4 min/km. ASUNCIÓN (MVP): 4 min/km fijo. ALTERNATIVA (Fase 2): Factor configurable según zona urbana/rural.
4. THE Calculador_ETA SHALL añadir un buffer de 8 minutos a toda estimación. ASUNCIÓN (MVP): 8 min fijo. ALTERNATIVA (Fase 2): Buffer dinámico basado en histórico.
5. WHEN un pedido SCHEDULED es creado, THE Calculador_ETA SHALL mostrar la ventana de entrega como "Entrega prevista: [scheduled_for]–[scheduled_for + 10 min]".
6. WHEN el estado del pedido cambia, THE Calculador_ETA SHALL recalcular la ETA y actualizar la información mostrada al CUSTOMER.
7. THE Sistema SHALL actualizar la información de tracking del CUSTOMER mediante Polling_Inteligente con intervalo adaptativo: 10 segundos cuando el pedido está en PREPARING/READY_FOR_PICKUP/OUT_FOR_DELIVERY, 30 segundos en otros estados activos. ASUNCIÓN (MVP): Polling. ALTERNATIVA (Fase 2): WebSockets.

**Ejemplo numérico 1 — ETA ASAP sin cola:**
- 3 ítems, distancia 1,5 km, 2 pedidos activos en restaurante.
- prep_time = 20 + (3 × 2) = 26 min. queue_factor = 0 (≤3 pedidos). travel_time = 1,5 × 4 = 6 min. buffer = 8 min.
- ETA = 26 + 6 + 8 = 40 min desde la creación.

**Ejemplo numérico 2 — ETA ASAP con cola:**
- 5 ítems, distancia 2,0 km, 6 pedidos activos en restaurante.
- prep_time = 20 + (5 × 2) = 30 min. queue_factor = (6 - 3) × 3 = 9 min. travel_time = 2,0 × 4 = 8 min. buffer = 8 min.
- ETA = 30 + 9 + 8 + 8 = 55 min desde la creación.

**Ejemplo numérico 3 — ETA SCHEDULED:**
- Pedido programado para 14:00. Ventana de entrega: "Entrega prevista: 14:00–14:10."

---

### Requisito 10: Historial de Pedidos

**User Story:** Como CUSTOMER, quiero ver el historial de mis pedidos anteriores, para consultar qué he pedido y repetir pedidos.

#### Criterios de Aceptación

1. WHEN el CUSTOMER accede a su historial de pedidos, THE Sistema SHALL mostrar una lista paginada de pedidos ordenados por fecha descendente con: número de pedido, nombre del restaurante, fecha, estado final, total en EUR (€).
2. WHEN el CUSTOMER selecciona un pedido del historial, THE Sistema SHALL mostrar el detalle completo: productos, cantidades, precios, dirección de entrega, tipo de pedido (ASAP/SCHEDULED), línea de tiempo de estados y total.

---

### Requisito 11: Autenticación

**User Story:** Como usuario, quiero registrarme e iniciar sesión de forma segura con email/contraseña o Google, para acceder a la plataforma.

#### Criterios de Aceptación

1. THE Auth SHALL permitir el registro con email y contraseña.
2. THE Auth SHALL permitir el inicio de sesión con Google OAuth.
3. WHEN un usuario se registra con email, THE Auth SHALL enviar un email de verificación antes de activar la cuenta.
4. WHEN un usuario solicita restablecer su contraseña, THE Auth SHALL enviar un email con un enlace de restablecimiento válido durante 1 hora.
5. THE Auth SHALL almacenar las contraseñas con hash seguro (bcrypt con cost factor >= 10).
6. WHEN un usuario inicia sesión, THE Auth SHALL crear una sesión segura con cookie httpOnly, secure y sameSite=lax.
7. IF un usuario introduce credenciales incorrectas 5 veces consecutivas, THEN THE Auth SHALL bloquear temporalmente el acceso durante 15 minutos y mostrar el mensaje "Demasiados intentos fallidos. Inténtalo de nuevo en 15 minutos."
8. THE Auth SHALL asignar el rol CUSTOMER por defecto a los nuevos registros.

---

### Requisito 12: Roles y Permisos (RBAC)

**User Story:** Como ADMIN, quiero gestionar los roles y permisos de los usuarios, para controlar el acceso a las funcionalidades del sistema.

#### Criterios de Aceptación

1. THE RBAC SHALL definir cuatro roles: CUSTOMER, RESTAURANT_OWNER, RESTAURANT_STAFF, ADMIN.
2. WHEN un RESTAURANT_OWNER invita a un usuario como RESTAURANT_STAFF, THE RBAC SHALL asociar al usuario con el restaurante específico del OWNER.
3. THE RBAC SHALL impedir que RESTAURANT_STAFF edite catálogo, precios, horarios o zonas de reparto del restaurante.
4. THE RBAC SHALL permitir que RESTAURANT_STAFF gestione pedidos (aceptar, rechazar, cambiar estados).
5. THE RBAC SHALL permitir que ADMIN desactive restaurantes y consulte el registro de auditoría.
6. WHEN un usuario sin el rol adecuado intenta acceder a un recurso protegido, THE RBAC SHALL retornar error 403 con el mensaje "No tienes permisos para realizar esta acción."

**Matriz de permisos:**

| Recurso | Acción | CUSTOMER | RESTAURANT_OWNER | RESTAURANT_STAFF | ADMIN |
|---|---|---|---|---|---|
| Restaurantes | Ver listado | ✅ | ✅ | ✅ | ✅ |
| Restaurantes | Ver detalle | ✅ | ✅ (propio) | ✅ (propio) | ✅ |
| Restaurantes | Crear | ❌ | ❌ | ❌ | ✅ |
| Restaurantes | Editar | ❌ | ✅ (propio) | ❌ | ✅ |
| Restaurantes | Activar/Desactivar | ❌ | ❌ | ❌ | ✅ |
| Categorías | CRUD | ❌ | ✅ (propio) | ❌ | ✅ |
| Productos | CRUD | ❌ | ✅ (propio) | ❌ | ✅ |
| Productos | Ver | ✅ | ✅ (propio) | ✅ (propio) | ✅ |
| Carrito | CRUD | ✅ (propio) | ❌ | ❌ | ❌ |
| Pedidos | Crear | ✅ | ❌ | ❌ | ❌ |
| Pedidos | Ver propios | ✅ (propio) | ✅ (su restaurante) | ✅ (su restaurante) | ✅ |
| Pedidos | Aceptar/Rechazar | ❌ | ✅ (su restaurante) | ✅ (su restaurante) | ❌ |
| Pedidos | Cambiar estado | ❌ | ✅ (su restaurante) | ✅ (su restaurante) | ❌ |
| Pedidos | Cancelar | ✅ (propio, según reglas) | ❌ | ❌ | ❌ |
| Staff | Invitar/Gestionar | ❌ | ✅ (su restaurante) | ❌ | ❌ |
| Usuarios | Gestionar | ❌ | ❌ | ❌ | ✅ |
| Auditoría | Ver logs | ❌ | ❌ | ❌ | ✅ |
| Métricas | Ver dashboard | ❌ | ✅ (su restaurante) | ❌ | ✅ |


---

### Requisito 13: Panel de Restaurante

**User Story:** Como RESTAURANT_OWNER, quiero gestionar los pedidos entrantes desde un panel de control, para aceptar, preparar y entregar pedidos eficientemente.

#### Criterios de Aceptación

1. WHEN un RESTAURANT_OWNER o RESTAURANT_STAFF accede al Panel_Restaurante, THE Panel_Restaurante SHALL mostrar una cola de pedidos ASAP pendientes ordenados por fecha de creación ascendente.
2. WHEN un RESTAURANT_OWNER o RESTAURANT_STAFF accede al Panel_Restaurante, THE Panel_Restaurante SHALL mostrar una lista de pedidos SCHEDULED dividida en "Próximos" (faltan > 45 min) y "A preparar" (faltan ≤ 45 min).
3. WHEN un RESTAURANT_OWNER o RESTAURANT_STAFF acepta un pedido, THE FSM_Pedido SHALL transicionar el pedido de PLACED a ACCEPTED.
4. WHEN un RESTAURANT_OWNER o RESTAURANT_STAFF rechaza un pedido, THE FSM_Pedido SHALL requerir un motivo obligatorio y transicionar el pedido de PLACED a REJECTED.
5. WHEN un RESTAURANT_OWNER o RESTAURANT_STAFF cambia el estado de un pedido, THE Panel_Restaurante SHALL actualizar la vista en tiempo real mediante Polling_Inteligente.
6. THE Panel_Restaurante SHALL mostrar un indicador sonoro y visual cuando llega un nuevo pedido.
7. THE Panel_Restaurante SHALL mostrar el número de pedidos activos y la ETA promedio actual.

---

### Requisito 14: Panel de Administración

**User Story:** Como ADMIN, quiero gestionar restaurantes, categorías, productos y ver métricas, para mantener la plataforma operativa.

#### Criterios de Aceptación

1. WHEN un ADMIN accede al Panel_Admin, THE Panel_Admin SHALL mostrar un dashboard con métricas básicas: total de pedidos (hoy/semana/mes), pedidos por estado, ingresos totales en EUR (€), restaurantes activos.
2. THE Panel_Admin SHALL permitir al ADMIN realizar CRUD completo de restaurantes: crear, leer, actualizar, activar/desactivar.
3. THE Panel_Admin SHALL permitir al ADMIN realizar CRUD completo de categorías por restaurante.
4. THE Panel_Admin SHALL permitir al ADMIN realizar CRUD completo de productos con validación obligatoria de imagen.
5. WHEN un ADMIN desactiva un restaurante, THE Catálogo SHALL dejar de mostrar el restaurante en el listado público y THE Checkout SHALL rechazar nuevos pedidos para ese restaurante.
6. THE Panel_Admin SHALL permitir al ADMIN ver todos los pedidos del sistema con filtros por restaurante, estado, fecha y tipo (ASAP/SCHEDULED).
7. THE Panel_Admin SHALL permitir al ADMIN consultar el registro de auditoría (admin_audit_log) con filtros por usuario, acción y fecha.

---

### Requisito 15: Mapas y Geocoding

**User Story:** Como CUSTOMER, quiero que mi dirección sea validada automáticamente para saber si estoy dentro de la zona de reparto, para evitar pedidos que no puedan ser entregados.

#### Criterios de Aceptación

1. WHEN el CUSTOMER guarda una dirección, THE Geocoder SHALL convertir la dirección en coordenadas lat/lng usando CartoCiudad: primero el endpoint `candidates` para autocompletado de sugerencias, y luego el endpoint `find` para geocodificación final (dirección → lat/lng). DECISIÓN CERRADA (MVP): Proveedor CartoCiudad (gratuito, gobierno español, sin API key). ALTERNATIVA (Fase 2): Múltiples proveedores con fallback.
2. WHEN el Geocoder no puede resolver una dirección, THE Sistema SHALL mostrar el error con título "❌ No hemos podido encontrar la dirección", mensaje "Revisa la calle y el número e inténtalo de nuevo. Usa una dirección postal completa y válida." y acción "Editar dirección".
3. WHEN la dirección geocodificada por CartoCiudad tiene el campo comunidadAutonoma distinto de "Andalucía", THE Validador_Zona SHALL rechazar la dirección con el error con título "❌ Fuera de zona de servicio", mensaje "Por ahora solo repartimos en Andalucía. La dirección que has introducido está fuera de nuestra zona actual." y acción "Cambiar dirección".
4. WHEN el Geocoder recibe una solicitud de geocodificación, THE Geocoding_Cache SHALL verificar si existe un resultado previo para la misma cadena de dirección normalizada. WHEN existe un resultado en caché, THE Geocoder SHALL retornar el resultado cacheado sin llamar a CartoCiudad. WHEN no existe, THE Geocoder SHALL llamar a CartoCiudad y almacenar el resultado en Geocoding_Cache.
5. WHEN el CUSTOMER selecciona una dirección para un pedido, THE Validador_Zona SHALL verificar si la dirección está dentro del radio de reparto del restaurante usando la fórmula Haversine.
6. THE Validador_Zona SHALL calcular la distancia en kilómetros entre la dirección del CUSTOMER (lat/lng) y la ubicación del restaurante (lat/lng) usando la fórmula Haversine.
7. THE Sistema SHALL almacenar las coordenadas lat/lng con minimización de datos (acceso restringido, no expuestas en APIs públicas) conforme a GDPR.
8. THE Sistema SHALL NO almacenar rutas ni datos de tracking del repartidor en MVP.

**Pseudocódigo de funciones clave:**

```
function searchAddressCandidates(query: string): CartoCiudadCandidate[]
  // Llama a CartoCiudad endpoint: GET /candidates?q={query}&limit=5
  // Retorna lista de sugerencias de direcciones

function geocodeAddress(address: string): { lat: number, lng: number, comunidadAutonoma: string } | Error
  // 1. Verificar Geocoding_Cache por cadena de dirección normalizada
  cached = geocodingCache.get(normalizeAddress(address))
  if cached: return cached
  // 2. Llamar a CartoCiudad endpoint: GET /find?q={address}
  result = cartociudad.find(address)
  if !result: return Error("❌ No hemos podido encontrar la dirección")
  // 3. Validar que comunidadAutonoma === "Andalucía"
  if result.comunidadAutonoma !== "Andalucía":
    return Error("❌ Fuera de zona de servicio")
  // 4. Almacenar en Geocoding_Cache
  geocodingCache.set(normalizeAddress(address), result)
  return { lat: result.lat, lng: result.lng, comunidadAutonoma: result.comunidadAutonoma }

function isInsideDeliveryZone(customerLat, customerLng, restaurantLat, restaurantLng, radiusKm): boolean
  distance = distanceKm(customerLat, customerLng, restaurantLat, restaurantLng)
  return distance <= radiusKm

function distanceKm(lat1, lng1, lat2, lng2): number
  // Fórmula Haversine
  R = 6371 // Radio de la Tierra en km
  dLat = toRad(lat2 - lat1)
  dLng = toRad(lng2 - lng1)
  a = sin(dLat/2)^2 + cos(toRad(lat1)) * cos(toRad(lat2)) * sin(dLng/2)^2
  c = 2 * atan2(sqrt(a), sqrt(1-a))
  return R * c

function computeEta(order, restaurant, distance): DateTime
  prepTime = restaurant.prep_time_base + (order.itemCount * restaurant.prep_time_per_item)
  activeOrders = countActiveOrders(restaurant.id)
  queueFactor = max(0, (activeOrders - 3) * 3)
  travelTime = distance * 4 // min/km
  buffer = 8
  if order.fulfillmentType == ASAP:
    return now() + prepTime + queueFactor + travelTime + buffer
  else: // SCHEDULED
    return order.scheduledFor // ventana: scheduledFor a scheduledFor+10min
```

---

### Requisito 16: Cumplimiento GDPR

**User Story:** Como CUSTOMER, quiero que mis datos personales sean tratados conforme al GDPR, para ejercer mis derechos de privacidad.

#### Criterios de Aceptación

1. THE Sistema SHALL procesar datos personales del CUSTOMER bajo la base legal de ejecución de contrato (Art. 6.1.b GDPR) para la gestión de pedidos.
2. THE Sistema SHALL aplicar el principio de minimización de datos: recoger solo los datos estrictamente necesarios para la prestación del servicio (nombre, email, teléfono, dirección de entrega).
3. WHEN el CUSTOMER solicita la exportación de sus datos, THE Sistema SHALL generar un archivo descargable con todos los datos personales del CUSTOMER en formato JSON en un plazo máximo de 30 días.
4. WHEN el CUSTOMER solicita el borrado de su cuenta, THE Sistema SHALL eliminar o anonimizar todos los datos personales del CUSTOMER, manteniendo los datos de pedidos anonimizados necesarios para obligaciones legales (facturación) durante el período de retención legal.
5. THE Sistema SHALL definir períodos de retención: datos de pedidos 5 años (obligación fiscal), datos de cuenta 30 días tras solicitud de borrado, logs de auditoría 2 años.
6. THE Sistema SHALL registrar en admin_audit_log todas las operaciones sobre datos personales (acceso, modificación, borrado, exportación).
7. THE Sistema SHALL cifrar los datos en tránsito (HTTPS/TLS) y aplicar controles de acceso a datos sensibles (lat/lng, teléfono).

---

### Requisito 17: Cumplimiento ePrivacy (Cookies)

**User Story:** Como CUSTOMER, quiero gestionar mis preferencias de cookies, para controlar qué datos se recopilan sobre mi navegación.

#### Criterios de Aceptación

1. WHEN el CUSTOMER accede al Sistema por primera vez, THE Cookie_Banner SHALL mostrar un banner de consentimiento de cookies con opciones: "Necesarias" (siempre activas), "Analíticas" (opt-in) y "Marketing" (opt-in).
2. THE Cookie_Banner SHALL NO establecer cookies analíticas ni de marketing hasta que el CUSTOMER otorgue consentimiento explícito.
3. WHEN el CUSTOMER otorga o revoca consentimiento, THE Sistema SHALL registrar el consentimiento en la tabla cookie_consents con timestamp, tipo de cookie y decisión.
4. THE Sistema SHALL permitir al CUSTOMER revocar su consentimiento de cookies en cualquier momento desde la página de configuración de privacidad.
5. THE Sistema SHALL respetar la revocación de consentimiento eliminando las cookies no necesarias del navegador del CUSTOMER.

---

### Requisito 18: Cumplimiento Consumer Rights (Info Precontractual)

**User Story:** Como CUSTOMER, quiero recibir información clara antes de confirmar mi pedido, para tomar una decisión de compra informada conforme a la Directiva de Derechos del Consumidor.

#### Criterios de Aceptación

1. WHEN el CUSTOMER llega al paso final del Checkout, THE Checkout SHALL mostrar la Info_Precontractual obligatoria: identidad del restaurante (nombre, dirección, CIF/NIF), descripción de los productos, precio total desglosado (subtotal + envío en EUR €), forma de pago (contra entrega), plazo de entrega estimado (ETA), y condiciones de cancelación.
2. THE Checkout SHALL requerir que el CUSTOMER acepte explícitamente las condiciones generales y la política de privacidad mediante un checkbox antes de confirmar el pedido.
3. WHEN el CUSTOMER confirma el pedido, THE Sistema SHALL registrar la aceptación legal en la tabla legal_acceptances con timestamp, versión del documento aceptado y dirección IP.
4. THE Sistema SHALL enviar un email de confirmación del pedido al CUSTOMER con el resumen completo del pedido y la Info_Precontractual.

---

### Requisito 19: Cumplimiento Reglamento 1169/2011 (Alérgenos)

**User Story:** Como CUSTOMER con alergias alimentarias, quiero ver los alérgenos de cada producto antes de comprarlo, para evitar reacciones alérgicas.

#### Criterios de Aceptación

1. THE Catálogo SHALL modelar los 14 alérgenos obligatorios del Reglamento UE 1169/2011: Gluten, Crustáceos, Huevos, Pescado, Cacahuetes, Soja, Lácteos, Frutos de cáscara, Apio, Mostaza, Sésamo, Dióxido de azufre/Sulfitos, Altramuces, Moluscos.
2. THE Catálogo SHALL mostrar los alérgenos de cada producto de forma accesible (iconos + texto) en la ficha del producto y en el Carrito.
3. WHEN un RESTAURANT_OWNER o ADMIN crea o edita un producto, THE Sistema SHALL requerir la selección explícita de alérgenos presentes (puede ser ninguno, pero la selección es obligatoria).
4. THE Catálogo SHALL mostrar los alérgenos antes de que el CUSTOMER añada el producto al Carrito, cumpliendo el requisito de información previa a la compra.


---

### Requisito 20: UX/UI Responsive Mobile-First

**User Story:** Como CUSTOMER, quiero usar la aplicación cómodamente desde mi móvil, tablet o escritorio, para pedir comida desde cualquier dispositivo.

#### Criterios de Aceptación

1. THE Sistema SHALL implementar un diseño responsive mobile-first con los breakpoints: móvil (<640px), tablet (640px–1024px), desktop (>1024px).
2. WHILE el CUSTOMER usa un dispositivo móvil, THE Sistema SHALL mostrar una navegación inferior (bottom nav) con iconos para: Inicio, Buscar, Pedidos, Perfil.
3. WHILE el CUSTOMER usa un dispositivo móvil, THE Sistema SHALL mostrar un botón flotante de carrito con el número de ítems y el subtotal en EUR (€).
4. THE Sistema SHALL cumplir criterios de accesibilidad: foco visible en elementos interactivos, tamaño mínimo de botones de 44x44px, contraste mínimo 4.5:1 para texto, etiquetas ARIA en elementos interactivos.
5. THE Sistema SHALL mostrar todos los textos de interfaz en español (ES).

**Pantallas MVP (wireframes textuales):**

**Home (móvil):**
```
[Logo: Pueblo Delivery]
[Barra búsqueda: "¿Qué te apetece hoy?"]
[Filtros: Tipo | Abierto | Envío | Mín.]
[Card restaurante: Imagen | Nombre | Tipo | ⭐ Abierto | Envío 2,00€ | Mín. 10€]
[Card restaurante: ...]
[Bottom nav: 🏠 Inicio | 🔍 Buscar | 📋 Pedidos | 👤 Perfil]
[FAB carrito: 🛒 3 · 22,50€]
```

**Restaurante (móvil):**
```
[Imagen cabecera restaurante]
[Nombre | Tipo | Estado: Abierto hasta 16:00]
[Info: Envío 2,00€ | Mín. 10€ | Radio 3km]
[Tabs categorías: Entrantes | Principales | Bebidas | Postres]
[Producto: Imagen | Nombre | Precio 8,50€ | 🥜🥛 alérgenos | [+] Añadir]
[Producto: ...]
```

**Carrito (móvil):**
```
[← Volver] Carrito
[Restaurante: Hamburguesería Sa Plaça]
[Producto: 2x Burger Clásica · 17,00€ | Notas: "Sin cebolla" | [-] 2 [+] | 🗑]
[Producto: 1x Patatas · 3,50€ | [-] 1 [+] | 🗑]
[Subtotal: 20,50€]
[Botón: Ir al checkout →]
```

**Checkout (móvil, pasos):**
```
Paso 1 — Dirección:
[Direcciones guardadas: ○ C/ Sierpes 12, Sevilla | ○ Av. de la Constitución 5, Sevilla]
[+ Añadir nueva dirección]
  Flujo guiado (nueva dirección):
  [1. Calle y número: __________ (autocompletado CartoCiudad candidates)]
     [Sugerencias: C/ Sierpes 12 | C/ Sierpes 14 | ...]
  [2. Municipio: __________ (obligatorio, solo Andalucía)]
  [3. Código postal: __________ (auto-rellenado si disponible)]
  [4. Piso/puerta: __________ (opcional)]
  [Confirmar dirección → geocodificación CartoCiudad find]
[Teléfono: +34 ________]
[Siguiente →]

Paso 2 — Tipo de entrega:
[○ Lo antes posible (ASAP) | ○ Programar hora]
[Si SCHEDULED: Selector de fecha + slots disponibles]
[Siguiente →]

Paso 3 — Confirmar pedido:
[Resumen productos]
[Subtotal: 20,50€ | Envío: 2,00€ | Total: 22,50€]
[Pago: Contra entrega (efectivo)]
[ETA: Entrega estimada 13:39]
[Info restaurante: Hamburguesería Sa Plaça, C/ Feria 1, CIF B12345678]
[☑ Acepto las condiciones generales y la política de privacidad]
[Botón: Confirmar pedido · 22,50€]
```

**Confirmación:**
```
[✅ ¡Pedido confirmado!]
[Pedido #1234]
[ETA: Entrega estimada 13:39]
[Botón: Ver seguimiento]
```

**Tracking:**
```
[Pedido #1234 — Hamburguesería Sa Plaça]
[Timeline: ✅ Pedido recibido 13:00 → ✅ Aceptado 13:02 → 🔄 Preparando 13:05 → ○ Listo → ○ En camino → ○ Entregado]
[ETA actualizada: 13:39]
[Pago: Contra entrega · 22,50€]
```

**Perfil:**
```
[Avatar | Nombre | Email]
[Mis direcciones | Mis pedidos | Configuración privacidad | Cómo funciona | FAQ]
[Cerrar sesión]
```

**Dashboard restaurante (tablet/desktop):**
```
[Nombre restaurante | Estado: Abierto]
[Tabs: Pedidos ASAP | Programados | Historial | Configuración]

Pedidos ASAP:
[Card: #1234 | 13:00 | 3 ítems | 22,50€ | ETA 13:39 | [Aceptar] [Rechazar]]

Programados — A preparar:
[Card: #1235 | Para 14:00 | 2 ítems | 20,00€ | [Aceptar] [Rechazar]]

Programados — Próximos:
[Card: #1236 | Para mañana 13:30 | 4 ítems | 35,00€]
```

**Admin dashboard (desktop):**
```
[Métricas: Pedidos hoy: 24 | Semana: 156 | Ingresos semana: 3.420€]
[Sidebar: Restaurantes | Categorías | Productos | Pedidos | Usuarios | Auditoría]
[Tabla restaurantes: Nombre | Tipo | Estado | Pedidos hoy | Acciones]
```

---

### Requisito 21: Guía "Cómo Funciona" y FAQ

**User Story:** Como CUSTOMER o RESTAURANT_OWNER, quiero entender cómo funciona la plataforma, para usarla correctamente.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar una página "Cómo funciona" accesible desde el menú principal con una guía paso a paso para clientes: (1) Elige un restaurante, (2) Añade productos al carrito, (3) Introduce tu dirección y elige hora de entrega, (4) Confirma el pedido, (5) Sigue el estado de tu pedido, (6) Recibe y paga al repartidor.
2. THE Sistema SHALL mostrar una guía paso a paso para restaurantes: (1) Recibe pedidos en tu panel, (2) Acepta o rechaza pedidos, (3) Marca el pedido como "Preparando", (4) Marca como "Listo para recoger", (5) Marca como "En camino", (6) Marca como "Entregado".
3. THE Sistema SHALL mostrar una sección FAQ con las siguientes preguntas y respuestas:
   - "¿Puedo programar un pedido?" → "Sí, puedes elegir una hora exacta de entrega en intervalos de 10 minutos, hasta 2 días en el futuro."
   - "¿Puedo cancelar mi pedido?" → "Pedidos ASAP: puedes cancelar mientras el restaurante no lo haya aceptado. Pedidos programados: puedes cancelar hasta 60 minutos antes de la hora de entrega si ya fue aceptado, o en cualquier momento si aún no fue aceptado."
   - "¿Qué pasa si mi pedido se retrasa?" → "La ETA se actualiza automáticamente. Si hay un retraso significativo, el restaurante puede contactarte por teléfono."
   - "¿Cómo sé si un producto tiene alérgenos?" → "Cada producto muestra sus alérgenos con iconos y texto antes de añadirlo al carrito, conforme al Reglamento UE 1169/2011."

---

### Requisito 22: Arquitectura Técnica

**User Story:** Como desarrollador, quiero una arquitectura clara y desplegable en Vercel, para implementar y mantener la aplicación eficientemente.

#### Criterios de Aceptación

1. THE Sistema SHALL usar Next.js (App Router) con TypeScript y Tailwind CSS como framework frontend y backend.
2. THE Sistema SHALL usar Auth.js (NextAuth) con proveedores Credentials (email/contraseña) y Google OAuth para autenticación.
3. THE Sistema SHALL usar Prisma ORM con PostgreSQL (Neon o Supabase) como base de datos. ASUNCIÓN (MVP): Neon Postgres. ALTERNATIVA (Fase 2): Evaluación de Supabase si se necesitan funcionalidades adicionales.
4. THE Sistema SHALL usar un servicio de almacenamiento de imágenes compatible con S3 (S3/R2/Supabase Storage). ASUNCIÓN (MVP): Cloudflare R2 por coste. ALTERNATIVA (Fase 2): Migración a S3 si se necesita CDN avanzado.
5. THE Sistema SHALL usar Server Actions de Next.js para mutaciones y API Routes para endpoints REST.
6. THE Sistema SHALL usar Polling_Inteligente para actualizaciones en tiempo real con intervalos adaptativos.
7. THE Sistema SHALL usar Resend para envío de emails (reset de contraseña, confirmación de pedido). ASUNCIÓN (MVP): Resend. ALTERNATIVA (Fase 2): SendGrid si se necesita mayor volumen.
8. THE Sistema SHALL integrar Sentry para monitorización de errores y logs estructurados.
9. THE Sistema SHALL ser desplegable en Vercel con configuración de variables de entorno.

**Diagrama de arquitectura:**

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                               │
│  (Navegador — Mobile/Tablet/Desktop)                        │
│  Next.js App Router (RSC + Client Components)               │
│  Tailwind CSS — Mobile-first responsive                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│                    VERCEL EDGE                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Next.js App Router                       │    │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │  Pages/   │  │ Server       │  │ API Routes   │  │    │
│  │  │  Layouts  │  │ Actions      │  │ /api/*       │  │    │
│  │  └──────────┘  └──────────────┘  └──────────────┘  │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │           Middleware (Auth + RBAC)             │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└──────┬──────────┬──────────────┬───────────────┬────────────┘
       │          │              │               │
┌──────▼───┐ ┌───▼────────┐ ┌──▼──────────┐ ┌──▼──────────┐
│ Postgres │ │ Storage    │ │ CartoCiudad │ │ Email       │
│ (Neon)   │ │ (R2/S3)    │ │ Geocoding   │ │ (Resend)    │
│ Prisma   │ │ Imágenes   │ │ (gratuito)  │ │ Reset/Conf. │
└──────────┘ └────────────┘ └─────────────┘ └─────────────┘
       │
┌──────▼──────────────────────────────────────────────────────┐
│                      SENTRY                                  │
│  Error tracking + Logs estructurados                        │
└─────────────────────────────────────────────────────────────┘
```


---

### Requisito 23: Modelo de Datos

**User Story:** Como desarrollador, quiero un modelo de datos completo y normalizado, para implementar la base de datos con todas las relaciones y constraints necesarios.

#### Criterios de Aceptación

1. THE Sistema SHALL implementar las siguientes tablas con sus relaciones:

**Tabla users:**
- id (UUID, PK), email (VARCHAR UNIQUE NOT NULL), name (VARCHAR NOT NULL), password_hash (VARCHAR NULL — null si OAuth), phone (VARCHAR NULL), role (ENUM: CUSTOMER, RESTAURANT_OWNER, RESTAURANT_STAFF, ADMIN), email_verified (BOOLEAN DEFAULT false), is_active (BOOLEAN DEFAULT true), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ).

**Tabla auth_accounts:**
- id (UUID, PK), user_id (UUID FK→users), provider (VARCHAR NOT NULL — "credentials" | "google"), provider_account_id (VARCHAR NOT NULL), created_at (TIMESTAMPTZ).
- UNIQUE(provider, provider_account_id).

**Tabla sessions:**
- id (UUID, PK), user_id (UUID FK→users), session_token (VARCHAR UNIQUE NOT NULL), expires_at (TIMESTAMPTZ NOT NULL), created_at (TIMESTAMPTZ).

**Tabla restaurants:**
- id (UUID, PK), name (VARCHAR NOT NULL), slug (VARCHAR UNIQUE NOT NULL), description (TEXT), image_url (VARCHAR NOT NULL), type (VARCHAR NOT NULL — ej: "hamburguesas", "pollos", "tradicional", "pizza", "fast_food"), address (VARCHAR NOT NULL), lat (DECIMAL(10,8) NOT NULL), lng (DECIMAL(11,8) NOT NULL), phone (VARCHAR NOT NULL), cif (VARCHAR NOT NULL), delivery_fee_eur (DECIMAL(5,2) NOT NULL), min_order_eur (DECIMAL(5,2) NOT NULL), delivery_radius_km (DECIMAL(4,1) NOT NULL), prep_time_base_minutes (INT DEFAULT 20), prep_time_per_item_minutes (INT DEFAULT 2), is_active (BOOLEAN DEFAULT true), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ).

**Tabla restaurant_users:**
- id (UUID, PK), restaurant_id (UUID FK→restaurants), user_id (UUID FK→users), role (ENUM: OWNER, STAFF), created_at (TIMESTAMPTZ).
- UNIQUE(restaurant_id, user_id).

**Tabla opening_hours:**
- id (UUID, PK), restaurant_id (UUID FK→restaurants), day_of_week (INT 0-6, 0=lunes), open_time (TIME NOT NULL), close_time (TIME NOT NULL), created_at (TIMESTAMPTZ).
- INDEX(restaurant_id, day_of_week).

**Tabla delivery_zones:**
- id (UUID, PK), restaurant_id (UUID FK→restaurants UNIQUE), radius_km (DECIMAL(4,1) NOT NULL), center_lat (DECIMAL(10,8) NOT NULL), center_lng (DECIMAL(11,8) NOT NULL), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ).

**Tabla categories:**
- id (UUID, PK), restaurant_id (UUID FK→restaurants), name (VARCHAR NOT NULL), sort_order (INT DEFAULT 0), is_active (BOOLEAN DEFAULT true), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ).
- INDEX(restaurant_id, sort_order).

**Tabla products:**
- id (UUID, PK), category_id (UUID FK→categories), restaurant_id (UUID FK→restaurants), name (VARCHAR NOT NULL), description (TEXT), price_eur (DECIMAL(6,2) NOT NULL), image_url (VARCHAR NOT NULL), is_available (BOOLEAN DEFAULT true), sort_order (INT DEFAULT 0), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ).
- INDEX(restaurant_id, category_id).
- CHECK(image_url IS NOT NULL AND image_url != '').

**Tabla allergens:**
- id (INT, PK), code (VARCHAR UNIQUE NOT NULL), name_es (VARCHAR NOT NULL), icon (VARCHAR NOT NULL).
- Seed con 14 alérgenos UE.

**Tabla product_allergens:**
- product_id (UUID FK→products), allergen_id (INT FK→allergens).
- PK(product_id, allergen_id).

**Tabla carts:**
- id (UUID, PK), user_id (UUID FK→users UNIQUE), restaurant_id (UUID FK→restaurants NULL), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ).

**Tabla cart_items:**
- id (UUID, PK), cart_id (UUID FK→carts), product_id (UUID FK→products), quantity (INT NOT NULL CHECK(quantity > 0)), notes (TEXT NULL), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ).
- UNIQUE(cart_id, product_id).

**Tabla addresses:**
- id (UUID, PK), user_id (UUID FK→users), label (VARCHAR NULL — ej: "Casa", "Trabajo"), street (VARCHAR NOT NULL), municipality (VARCHAR NOT NULL), city (VARCHAR NOT NULL), postal_code (VARCHAR NOT NULL), floor_door (VARCHAR NULL — ej: "3ºB", "Bajo izq"), autonomous_community (VARCHAR NOT NULL), lat (DECIMAL(10,8) NOT NULL), lng (DECIMAL(11,8) NOT NULL), is_default (BOOLEAN DEFAULT false), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ).
- INDEX(user_id).
- CHECK(autonomous_community = 'Andalucía').

**Tabla geocoding_cache:**
- id (UUID, PK), address_query (VARCHAR NOT NULL UNIQUE — cadena de dirección normalizada), lat (DECIMAL(10,8) NOT NULL), lng (DECIMAL(11,8) NOT NULL), autonomous_community (VARCHAR NOT NULL), municipality (VARCHAR NULL), postal_code (VARCHAR NULL), raw_response (JSONB NULL — respuesta completa de CartoCiudad), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ).
- INDEX(address_query).
- Nota: Los resultados se cachean para evitar llamadas repetidas a CartoCiudad.

**Tabla orders:**
- id (UUID, PK), order_number (SERIAL UNIQUE), user_id (UUID FK→users), restaurant_id (UUID FK→restaurants), address_id (UUID FK→addresses), phone (VARCHAR NOT NULL), status (ENUM: PLACED, ACCEPTED, REJECTED, PREPARING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED), fulfillment_type (ENUM: ASAP, SCHEDULED), scheduled_for (TIMESTAMPTZ NULL — obligatorio si SCHEDULED, NULL si ASAP), subtotal_eur (DECIMAL(8,2) NOT NULL), delivery_fee_eur (DECIMAL(5,2) NOT NULL), total_eur (DECIMAL(8,2) NOT NULL), eta (TIMESTAMPTZ NULL), idempotency_key (UUID UNIQUE NOT NULL), rejection_reason (TEXT NULL), cancellation_reason (TEXT NULL), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ).
- INDEX(user_id, created_at DESC).
- INDEX(restaurant_id, status).
- INDEX(idempotency_key).
- CHECK(fulfillment_type = 'ASAP' OR scheduled_for IS NOT NULL).

**Tabla order_items:**
- id (UUID, PK), order_id (UUID FK→orders), product_id (UUID FK→products), product_name (VARCHAR NOT NULL — snapshot), product_price_eur (DECIMAL(6,2) NOT NULL — snapshot), quantity (INT NOT NULL), notes (TEXT NULL), created_at (TIMESTAMPTZ).

**Tabla order_status_history:**
- id (UUID, PK), order_id (UUID FK→orders), previous_status (VARCHAR NULL), new_status (VARCHAR NOT NULL), changed_by_user_id (UUID FK→users), reason (TEXT NULL), created_at (TIMESTAMPTZ).
- INDEX(order_id, created_at).

**Tabla cookie_consents:**
- id (UUID, PK), user_id (UUID FK→users NULL — puede ser anónimo), session_id (VARCHAR NULL), consent_type (ENUM: NECESSARY, ANALYTICS, MARKETING), granted (BOOLEAN NOT NULL), ip_address (VARCHAR NULL), user_agent (TEXT NULL), created_at (TIMESTAMPTZ), revoked_at (TIMESTAMPTZ NULL).

**Tabla legal_acceptances:**
- id (UUID, PK), user_id (UUID FK→users), document_type (VARCHAR NOT NULL — "terms", "privacy"), document_version (VARCHAR NOT NULL), ip_address (VARCHAR NULL), accepted_at (TIMESTAMPTZ NOT NULL).
- INDEX(user_id, document_type).

**Tabla admin_audit_log:**
- id (UUID, PK), user_id (UUID FK→users), action (VARCHAR NOT NULL), resource_type (VARCHAR NOT NULL), resource_id (VARCHAR NULL), details (JSONB NULL), ip_address (VARCHAR NULL), created_at (TIMESTAMPTZ).
- INDEX(user_id, created_at).
- INDEX(resource_type, resource_id).

2. THE Sistema SHALL aplicar todas las foreign keys, índices y constraints definidos anteriormente.
3. THE Sistema SHALL usar UUIDs como claves primarias para todas las tablas excepto allergens (INT autoincremental) y order_number (SERIAL).

---

### Requisito 24: APIs y Contratos

**User Story:** Como desarrollador, quiero contratos de API claros y completos, para implementar el frontend y backend de forma consistente.

#### Criterios de Aceptación

1. THE Sistema SHALL exponer los siguientes endpoints REST:

**Restaurantes:**
- `GET /api/restaurants` — Listado con filtros (type, is_open, max_delivery_fee, max_min_order). Respuesta: `{ restaurants: Restaurant[], total: number }`.
- `GET /api/restaurants/:slug` — Detalle con productos y categorías. Respuesta: `{ restaurant: RestaurantDetail }`.
- `GET /api/restaurants/:id/available-slots?date=YYYY-MM-DD` — Slots disponibles. Respuesta: `{ slots: string[], date: string }`. Ejemplo: `{ slots: ["13:00","13:10","13:20",...], date: "2024-03-15" }`.

**Carrito:**
- `GET /api/cart` — Carrito del usuario autenticado. Respuesta: `{ cart: Cart | null }`.
- `POST /api/cart/items` — Añadir ítem. Body: `{ productId: string, quantity: number, notes?: string }`. Respuesta: `{ cart: Cart }`.
- `PATCH /api/cart/items/:itemId` — Actualizar cantidad/notas. Body: `{ quantity?: number, notes?: string }`. Respuesta: `{ cart: Cart }`.
- `DELETE /api/cart/items/:itemId` — Eliminar ítem. Respuesta: `{ cart: Cart }`.
- `DELETE /api/cart` — Vaciar carrito. Respuesta: `{ success: true }`.

**Pedidos:**
- `POST /api/orders` — Crear pedido. Body: `{ addressId: string, phone: string, fulfillmentType: "ASAP" | "SCHEDULED", scheduledFor?: string, idempotencyKey: string }`. Respuesta: `{ order: Order }`. Errores: 400 (validación), 409 (idempotency_key duplicada), 422 (restaurante cerrado, fuera de zona, producto no disponible).
- `GET /api/orders` — Historial del usuario. Query: `page, limit`. Respuesta: `{ orders: OrderSummary[], total: number, page: number }`.
- `GET /api/orders/:id` — Detalle con tracking. Respuesta: `{ order: OrderDetail, statusHistory: StatusEntry[], eta: string | null }`.
- `POST /api/orders/:id/cancel` — Cancelar pedido. Body: `{ reason?: string }`. Respuesta: `{ order: Order }`. Errores: 403 (no permitido), 409 (estado no cancelable).

**Restaurante (Panel):**
- `GET /api/restaurant/orders` — Pedidos del restaurante del usuario. Query: `status, fulfillmentType, page`. Respuesta: `{ orders: RestaurantOrder[], total: number }`.
- `POST /api/restaurant/orders/:id/accept` — Aceptar pedido. Respuesta: `{ order: Order }`.
- `POST /api/restaurant/orders/:id/reject` — Rechazar pedido. Body: `{ reason: string }`. Respuesta: `{ order: Order }`.
- `POST /api/restaurant/orders/:id/status` — Cambiar estado. Body: `{ status: OrderStatus }`. Respuesta: `{ order: Order }`. Errores: 409 (transición inválida).
- `POST /api/restaurant/staff/invite` — Invitar staff. Body: `{ email: string }`. Respuesta: `{ user: User }`.

**Admin:**
- `GET /api/admin/restaurants` — CRUD restaurantes. Soporta POST, PATCH, DELETE.
- `GET /api/admin/categories` — CRUD categorías.
- `GET /api/admin/products` — CRUD productos (validación imagen obligatoria).
- `GET /api/admin/orders` — Todos los pedidos con filtros.
- `GET /api/admin/users` — Gestión usuarios.
- `GET /api/admin/audit-log` — Logs de auditoría con filtros.
- `GET /api/admin/metrics` — Métricas dashboard.

**Direcciones:**
- `GET /api/addresses` — Direcciones del usuario. Respuesta: `{ addresses: Address[] }`.
- `POST /api/addresses` — Crear dirección (geocoding automático vía CartoCiudad). Body: `{ street: string, municipality: string, city: string, postalCode: string, floorDoor?: string, label?: string }`. Respuesta: `{ address: Address }`. Errores: 422 (dirección no geocodificable o fuera de Andalucía).
- `DELETE /api/addresses/:id` — Eliminar dirección.

**Geocoding (proxy CartoCiudad):**
- `GET /api/geocoding/candidates?q=...` — Proxy al endpoint `candidates` de CartoCiudad para autocompletado de direcciones. Query: `q` (cadena de búsqueda). Respuesta: `{ candidates: { address: string, municipality: string, province: string, postalCode: string }[] }`. Nota: Filtra resultados para mostrar solo direcciones de Andalucía.

**Auth:**
- `POST /api/auth/register` — Registro. Body: `{ email: string, password: string, name: string }`.
- `POST /api/auth/[...nextauth]` — NextAuth endpoints (login, callback, session).
- `POST /api/auth/forgot-password` — Solicitar reset. Body: `{ email: string }`.
- `POST /api/auth/reset-password` — Reset con token. Body: `{ token: string, password: string }`.

**GDPR:**
- `POST /api/user/export-data` — Exportar datos personales. Respuesta: `{ downloadUrl: string }`.
- `POST /api/user/delete-account` — Solicitar borrado de cuenta.

**Formato de errores estándar:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La imagen del producto es obligatoria.",
    "details": [{ "field": "image_url", "message": "Campo requerido" }]
  }
}
```
Códigos HTTP: 400 (validación), 401 (no autenticado), 403 (no autorizado), 404 (no encontrado), 409 (conflicto/idempotencia), 422 (entidad no procesable — reglas de negocio).


---

### Requisito 25: Seguridad, Privacidad y Compliance

**User Story:** Como ADMIN, quiero que la plataforma cumpla con los estándares de seguridad y privacidad europeos, para operar legalmente y proteger los datos de los usuarios.

#### Criterios de Aceptación

1. THE Sistema SHALL cifrar todas las comunicaciones con HTTPS/TLS.
2. THE Sistema SHALL almacenar contraseñas con bcrypt (cost factor >= 10).
3. THE Sistema SHALL implementar protección CSRF en todos los formularios de mutación.
4. THE Sistema SHALL implementar rate limiting en endpoints de autenticación (máximo 10 intentos por minuto por IP).
5. THE Sistema SHALL validar y sanitizar todas las entradas de usuario en el backend para prevenir XSS e inyección SQL (Prisma parametriza queries por defecto).
6. THE Sistema SHALL implementar headers de seguridad: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security.
7. THE Sistema SHALL restringir el acceso a coordenadas lat/lng: no exponer en APIs públicas, solo usar internamente para cálculos de zona y ETA.
8. THE Sistema SHALL registrar en admin_audit_log todas las operaciones administrativas y de acceso a datos personales.
9. THE Sistema SHALL implementar sesiones con expiración configurable (default 7 días) y renovación automática.
10. IF un token de sesión es comprometido, THEN THE Auth SHALL permitir al usuario invalidar todas las sesiones activas desde su perfil.

---

### Requisito 26: Seed Data Completa para Demo

**User Story:** Como desarrollador, quiero datos de seed completos para una demo funcional, para probar todas las funcionalidades sin configuración manual.

#### Criterios de Aceptación

1. THE Sistema SHALL incluir seed data con 5 restaurantes:
   - "Hamburguesería Sa Plaça" (tipo: hamburguesas, envío: 2,00€, mín: 10,00€, radio: 3km)
   - "Pollos al Ast Can Toni" (tipo: pollos, envío: 1,50€, mín: 8,00€, radio: 2,5km)
   - "Casa Tradición" (tipo: tradicional, envío: 1,50€, mín: 12,00€, radio: 4km)
   - "Pizzería Forn Nou" (tipo: pizza, envío: 2,50€, mín: 10,00€, radio: 3,5km)
   - "Fast & Go" (tipo: fast_food, envío: 1,00€, mín: 6,00€, radio: 2km)

2. THE Sistema SHALL incluir entre 8 y 12 productos por restaurante (40-60 total) con image_url válido y alérgenos asignados.

**Productos ejemplo por restaurante:**

**Hamburguesería Sa Plaça:**
- Burger Clásica (8,50€) — Gluten, Lácteos, Huevos, Sésamo
- Burger Doble (11,00€) — Gluten, Lácteos, Huevos, Sésamo
- Burger Vegana (9,50€) — Gluten, Soja
- Patatas Fritas (3,50€) — Gluten
- Aros de Cebolla (4,00€) — Gluten, Huevos
- Nuggets de Pollo (6,00€) — Gluten, Huevos
- Ensalada César (7,50€) — Lácteos, Huevos, Pescado, Gluten
- Coca-Cola (2,50€) — (sin alérgenos)
- Agua Mineral (1,50€) — (sin alérgenos)
- Brownie (4,50€) — Gluten, Lácteos, Huevos, Frutos de cáscara

**Pollos al Ast Can Toni:**
- Pollo Entero al Ast (12,00€) — (sin alérgenos)
- Medio Pollo al Ast (7,00€) — (sin alérgenos)
- Alitas Picantes (6,50€) — Gluten
- Muslos de Pollo (5,50€) — (sin alérgenos)
- Patatas Asadas (3,00€) — (sin alérgenos)
- Ensalada Mixta (4,50€) — (sin alérgenos)
- Pan de Pueblo (1,50€) — Gluten
- Salsa Alioli (1,00€) — Huevos, Mostaza
- Fanta Naranja (2,50€) — (sin alérgenos)
- Flan Casero (3,50€) — Lácteos, Huevos

**Casa Tradición:**
- Paella Mixta (12,00€) — Crustáceos, Moluscos, Pescado
- Arroz a Banda (10,00€) — Pescado
- Ensalada Mixta (6,50€) — (sin alérgenos)
- Salmorejo Cordobés (5,50€) — Gluten, Huevos
- Flamenquín (9,00€) — Gluten, Huevos, Lácteos
- Gazpacho Andaluz (5,00€) — (sin alérgenos)
- Pescaíto Frito (8,50€) — Gluten, Pescado
- Rabo de Toro (11,00€) — Apio, Dióxido de azufre/Sulfitos
- Vino de la Casa (copa) (3,50€) — Dióxido de azufre/Sulfitos
- Torrija (4,00€) — Gluten, Lácteos, Huevos

**Pizzería Forn Nou:**
- Pizza Margarita (9,00€) — Gluten, Lácteos
- Pizza Pepperoni (10,50€) — Gluten, Lácteos
- Pizza 4 Quesos (11,00€) — Gluten, Lácteos
- Pizza Vegetal (10,00€) — Gluten, Lácteos
- Pizza Barbacoa (11,50€) — Gluten, Lácteos, Mostaza
- Calzone (10,00€) — Gluten, Lácteos, Huevos
- Focaccia de Ajo (5,00€) — Gluten, Lácteos
- Tiramisú (5,50€) — Gluten, Lácteos, Huevos
- Cerveza Artesana (3,50€) — Gluten
- Helado Artesano (4,00€) — Lácteos, Huevos, Frutos de cáscara

**Fast & Go:**
- Hot Dog Clásico (4,50€) — Gluten, Mostaza
- Hot Dog Completo (5,50€) — Gluten, Mostaza, Lácteos
- Wrap de Pollo (6,00€) — Gluten, Lácteos
- Nachos con Queso (5,00€) — Gluten, Lácteos
- Bocadillo de Lomo (5,50€) — Gluten
- Patatas Bravas (3,50€) — Gluten, Huevos
- Croquetas (4 uds) (4,00€) — Gluten, Lácteos, Huevos
- Refresco (2,00€) — (sin alérgenos)
- Batido (3,50€) — Lácteos
- Churros con Chocolate (4,50€) — Gluten, Lácteos

3. THE Sistema SHALL incluir los siguientes usuarios de seed:
   - Admin: admin@demo.eu / DemoPass!234 (rol: ADMIN)
   - Owner 1: owner1@demo.eu / DemoPass!234 (rol: RESTAURANT_OWNER, restaurante: Hamburguesería Sa Plaça)
   - Owner 2: owner2@demo.eu / DemoPass!234 (rol: RESTAURANT_OWNER, restaurante: Pollos al Ast Can Toni + Casa Tradición)
   - Owner 3: owner3@demo.eu / DemoPass!234 (rol: RESTAURANT_OWNER, restaurante: Pizzería Forn Nou + Fast & Go)
   - Staff 1: staff1@demo.eu / DemoPass!234 (rol: RESTAURANT_STAFF, restaurante: Hamburguesería Sa Plaça)
   - Staff 2: staff2@demo.eu / DemoPass!234 (rol: RESTAURANT_STAFF, restaurante: Pizzería Forn Nou)
   - Staff 3: staff3@demo.eu / DemoPass!234 (rol: RESTAURANT_STAFF, restaurante: Casa Tradición)
   - Customer 1: cliente1@demo.eu / DemoPass!234 (rol: CUSTOMER)
   - Customer 2: cliente2@demo.eu / DemoPass!234 (rol: CUSTOMER)
   - Customer 3: cliente3@demo.eu / DemoPass!234 (rol: CUSTOMER)
   - Customer 4: cliente4@demo.eu / DemoPass!234 (rol: CUSTOMER)
   - Customer 5: cliente5@demo.eu / DemoPass!234 (rol: CUSTOMER)

4. THE Sistema SHALL incluir 10 direcciones de seed con lat/lng válidos (zona Andalucía — centrado en Córdoba, 37.8882° N, 4.7794° W):
   - C/ Sierpes 12, 41004 Sevilla — lat: 37.3886, lng: -5.9953
   - Av. de la Constitución 5, 41001 Sevilla — lat: 37.3861, lng: -5.9926
   - C/ Larios 3, 29015 Málaga — lat: 36.7213, lng: -4.4214
   - Pl. de las Tendillas 1, 14002 Córdoba — lat: 37.8847, lng: -4.7792
   - C/ Mesones 8, 18001 Granada — lat: 37.1760, lng: -3.5986
   - C/ Tetuán 15, 41001 Sevilla — lat: 37.3900, lng: -5.9960
   - Av. de Andalucía 22, 29007 Málaga — lat: 36.7150, lng: -4.4300
   - C/ Cruz Conde 7, 14001 Córdoba — lat: 37.8835, lng: -4.7810
   - Av. de la Constitución 30, 18012 Granada — lat: 37.1780, lng: -3.6010
   - C/ San Fernando 4, 41004 Sevilla — lat: 37.3840, lng: -5.9930

5. THE Sistema SHALL incluir 12 pedidos de seed (6 ASAP + 6 SCHEDULED) con OrderStatusHistory completo que cubra todos los estados posibles, incluyendo pedidos en cada estado terminal (DELIVERED, REJECTED, CANCELLED) y pedidos en estados intermedios (PREPARING, OUT_FOR_DELIVERY).

6. THE Sistema SHALL entregar el seed data en tres formatos: SQL INSERT statements, JSON fixtures y Prisma seed TypeScript (prisma/seed.ts).

---

### Requisito 27: Setup Local y Deploy Vercel

**User Story:** Como desarrollador, quiero instrucciones claras de setup local y deploy, para poner en marcha el proyecto rápidamente.

#### Criterios de Aceptación

1. THE Sistema SHALL requerir las siguientes variables de entorno:
   - `DATABASE_URL` — URL de conexión a PostgreSQL (Neon).
   - `AUTH_SECRET` — Secreto para Auth.js/NextAuth.
   - `GOOGLE_CLIENT_ID` — Client ID de Google OAuth.
   - `GOOGLE_CLIENT_SECRET` — Client Secret de Google OAuth.
   - `STORAGE_ACCESS_KEY` — Clave de acceso al servicio de almacenamiento.
   - `STORAGE_SECRET_KEY` — Clave secreta del servicio de almacenamiento.
   - `STORAGE_BUCKET` — Nombre del bucket de almacenamiento.
   - `STORAGE_ENDPOINT` — Endpoint del servicio de almacenamiento.
   - `RESEND_API_KEY` — API key de Resend para emails.
   - `CARTOCIUDAD_BASE_URL` — URL base de la API de CartoCiudad (default: https://www.cartociudad.es/geocoder/api/geocoder). No requiere API key.
   - `SENTRY_DSN` — DSN de Sentry para monitorización.
   - `NEXT_PUBLIC_APP_URL` — URL pública de la aplicación.

2. THE Sistema SHALL documentar los comandos de setup local:
   ```
   pnpm install
   cp .env.example .env.local  # Configurar variables
   pnpm prisma generate
   pnpm prisma migrate dev
   pnpm prisma db seed
   pnpm dev
   ```

3. THE Sistema SHALL incluir un checklist de deploy en Vercel:
   - Conectar repositorio Git.
   - Configurar todas las variables de entorno en Vercel dashboard.
   - Configurar build command: `pnpm build`.
   - Configurar output directory: `.next`.
   - Ejecutar migraciones de Prisma en el primer deploy.
   - Verificar conexión a Neon Postgres.
   - Configurar dominio personalizado (opcional).

4. WHILE la variable de entorno NODE_ENV es "development" y la base de datos está vacía, THE Sistema SHALL ejecutar automáticamente el seed de datos demo ("Demo mode"). ASUNCIÓN (MVP): Auto-seed solo en dev. ALTERNATIVA (Fase 2): Panel admin para importar/exportar datos.

---

### Requisito 28: Testing y QA

**User Story:** Como desarrollador, quiero una estrategia de testing completa, para garantizar la calidad y fiabilidad de la aplicación.

#### Criterios de Aceptación

1. THE Sistema SHALL incluir tests unitarios para:
   - Cálculo de ETA (computeEta) con diferentes combinaciones de ítems, distancia y cola.
   - Generación de slots válidos (getAvailableSlots) con diferentes horarios y restricciones.
   - Transiciones de la FSM de pedidos (validar transiciones permitidas y rechazar las no permitidas).
   - Fórmula Haversine (distanceKm) con coordenadas conocidas.
   - Validación de zona de reparto (isInsideDeliveryZone).

2. THE Sistema SHALL incluir tests de integración para:
   - Crear pedido ASAP completo (carrito → checkout → pedido → tracking).
   - Crear pedido SCHEDULED completo con slot válido.
   - Flujo de aceptación y cambio de estados por restaurante.
   - Registro e inicio de sesión con email/contraseña.

3. THE Sistema SHALL incluir tests E2E con Playwright para:
   - Flujo completo de cliente: buscar restaurante → añadir productos → checkout → confirmar → ver tracking.
   - Flujo de restaurante: ver pedido → aceptar → preparar → listo → en camino → entregado.
   - Flujo admin: crear restaurante → añadir categoría → añadir producto con imagen.

4. THE Sistema SHALL incluir tests de edge cases para:
   - Slot inválido (fuera de horario, pasado, sin lead time).
   - Dirección fuera de zona de reparto.
   - Dirección fuera de Andalucía (comunidadAutonoma !== "Andalucía") — bloqueada con error "❌ Fuera de zona de servicio".
   - Restaurante cerrado para pedido ASAP.
   - Producto sin imagen (rechazado).
   - Doble submit con misma idempotency_key.
   - Transición de estado no permitida.
   - Cancelación de pedido SCHEDULED con menos de 60 min.
   - CartoCiudad candidates autocomplete: verificar que retorna sugerencias válidas y filtra por Andalucía.
   - Geocoding_Cache hit/miss: verificar que un segundo geocoding de la misma dirección usa caché sin llamar a CartoCiudad.

5. FOR ALL valores válidos de ETA inputs (ítems, distancia, cola), parsing la ETA calculada y recalculándola SHALL producir un resultado equivalente (propiedad round-trip del Calculador_ETA).

6. FOR ALL transiciones de estado válidas en la FSM_Pedido, aplicar la transición y verificar el estado resultante SHALL producir el estado esperado según la tabla de transiciones definida (propiedad de modelo de la FSM).

7. FOR ALL coordenadas válidas (lat1, lng1, lat2, lng2), la función distanceKm SHALL retornar un valor >= 0 y distanceKm(a, b) SHALL ser igual a distanceKm(b, a) (propiedad de simetría y no-negatividad de Haversine).

8. FOR ALL slots generados por getAvailableSlots, cada slot SHALL estar dentro del horario de apertura del restaurante, ser >= NOW + schedule_lead_time_min, y ser <= NOW + max_schedule_days (propiedad de invariante de slots).

---

### Requisito 29: Backlog por Fases

**User Story:** Como Product Owner, quiero un backlog organizado por fases, para planificar el desarrollo incremental de la plataforma.

#### Criterios de Aceptación

1. THE Sistema SHALL definir el backlog MVP (Fase 1) incluyendo todas las funcionalidades descritas en los requisitos 1-28 de este documento.

2. THE Sistema SHALL definir el backlog de Fase 2 incluyendo:
   - Rol COURIER con gestión de riders de plataforma.
   - Geolocalización GPS en tiempo real del repartidor.
   - WebSockets para notificaciones push en tiempo real.
   - Pagos online (Stripe/Redsys).
   - Intervalos de slot configurables por restaurante.
   - Lead time y prep_window configurables por restaurante.
   - Buffer de ETA dinámico basado en histórico.
   - Múltiples proveedores de geocoding con fallback.
   - Apple OAuth.
   - Chat entre cliente y restaurante.
   - Valoraciones y reseñas.

3. THE Sistema SHALL definir el backlog de Fase 3 incluyendo:
   - Promociones y códigos de descuento.
   - Programa de fidelización (loyalty points).
   - Multi-vertical (farmacia, supermercado, etc.).
   - App nativa (React Native / Expo).
   - Analytics avanzado y reporting.
   - Multi-idioma (catalán, inglés).