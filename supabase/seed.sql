-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed Data: Pueblo Delivery Marketplace
-- ═══════════════════════════════════════════════════════════════════════════════
-- 14 EU allergens, 12 users, 5 restaurants, 20 categories, 52 products,
-- 10 addresses, 12 orders with items and status history.
--
-- IMPORTANT: This file contains ONLY INSERT statements.
-- Tables are created by Prisma migrations (`npx prisma migrate deploy`).
-- Run this AFTER migrations: psql $DATABASE_URL -f supabase/seed.sql
--
-- All passwords: Password123!
-- bcrypt hash: $2b$10$seJWVQSGNX1FF0oEO9VoUujJ2LRmVBuZ2FJYy6e5F5RLqjwE1H71m
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Allergens (14 EU — Reglamento UE 1169/2011) ─────────────────────────

INSERT INTO allergens (id, code, "nameEs", icon) VALUES
(1,  'GLUTEN',       'Gluten',                      'gluten.svg'),
(2,  'CRUSTACEANS',  'Crustáceos',                   'crustaceans.svg'),
(3,  'EGGS',         'Huevos',                       'eggs.svg'),
(4,  'FISH',         'Pescado',                      'fish.svg'),
(5,  'PEANUTS',      'Cacahuetes',                   'peanuts.svg'),
(6,  'SOY',          'Soja',                         'soy.svg'),
(7,  'DAIRY',        'Lácteos',                      'dairy.svg'),
(8,  'TREE_NUTS',    'Frutos de cáscara',            'tree-nuts.svg'),
(9,  'CELERY',       'Apio',                         'celery.svg'),
(10, 'MUSTARD',      'Mostaza',                      'mustard.svg'),
(11, 'SESAME',       'Sésamo',                       'sesame.svg'),
(12, 'SULPHITES',    'Dióxido de azufre/Sulfitos',   'sulphites.svg'),
(13, 'LUPIN',        'Altramuces',                   'lupin.svg'),
(14, 'MOLLUSCS',     'Moluscos',                     'molluscs.svg');

-- ─── 2. Users (12 total) ─────────────────────────────────────────────────────
-- 1 admin, 3 restaurant owners, 3 staff, 5 customers
-- All with password: Password123!

INSERT INTO users (id, name, email, "emailVerified", "passwordHash", image, role, "failedLoginAttempts", "lockedUntil", "createdAt", "updatedAt") VALUES
('user-admin-001', 'Admin Pueblo',    'admin@pueblodelivery.es',  now(), '$2b$10$seJWVQSGNX1FF0oEO9VoUujJ2LRmVBuZ2FJYy6e5F5RLqjwE1H71m', NULL, 'ADMIN',            0, NULL, now(), now()),
('user-owner-001', 'María García',    'maria@saplaça.es',         now(), '$2b$10$seJWVQSGNX1FF0oEO9VoUujJ2LRmVBuZ2FJYy6e5F5RLqjwE1H71m', NULL, 'RESTAURANT_OWNER', 0, NULL, now(), now()),
('user-owner-002', 'Antonio López',   'antonio@casatradicion.es', now(), '$2b$10$seJWVQSGNX1FF0oEO9VoUujJ2LRmVBuZ2FJYy6e5F5RLqjwE1H71m', NULL, 'RESTAURANT_OWNER', 0, NULL, now(), now()),
('user-owner-003', 'Carmen Ruiz',     'carmen@pizzeriaforn.es',   now(), '$2b$10$seJWVQSGNX1FF0oEO9VoUujJ2LRmVBuZ2FJYy6e5F5RLqjwE1H71m', NULL, 'RESTAURANT_OWNER', 0, NULL, now(), now()),
('user-staff-001', 'Pedro Martínez',  'pedro@saplaça.es',         now(), '$2b$10$seJWVQSGNX1FF0oEO9VoUujJ2LRmVBuZ2FJYy6e5F5RLqjwE1H71m', NULL, 'RESTAURANT_STAFF', 0, NULL, now(), now()),
('user-staff-002', 'Laura Fernández', 'laura@casatradicion.es',   now(), '$2b$10$seJWVQSGNX1FF0oEO9VoUujJ2LRmVBuZ2FJYy6e5F5RLqjwE1H71m', NULL, 'RESTAURANT_STAFF', 0, NULL, now(), now()),
('user-staff-003', 'Javier Sánchez',  'javier@pizzeriaforn.es',   now(), '$2b$10$seJWVQSGNX1FF0oEO9VoUujJ2LRmVBuZ2FJYy6e5F5RLqjwE1H71m', NULL, 'RESTAURANT_STAFF', 0, NULL, now(), now()),
('user-cust-001',  'Ana Moreno',      'ana@ejemplo.es',           now(), '$2b$10$seJWVQSGNX1FF0oEO9VoUujJ2LRmVBuZ2FJYy6e5F5RLqjwE1H71m', NULL, 'CUSTOMER',         0, NULL, now(), now()),
('user-cust-002',  'Carlos Díaz',     'carlos@ejemplo.es',        now(), '$2b$10$seJWVQSGNX1FF0oEO9VoUujJ2LRmVBuZ2FJYy6e5F5RLqjwE1H71m', NULL, 'CUSTOMER',         0, NULL, now(), now()),
('user-cust-003',  'Elena Torres',    'elena@ejemplo.es',         now(), '$2b$10$seJWVQSGNX1FF0oEO9VoUujJ2LRmVBuZ2FJYy6e5F5RLqjwE1H71m', NULL, 'CUSTOMER',         0, NULL, now(), now()),
('user-cust-004',  'Miguel Romero',   'miguel@ejemplo.es',        now(), '$2b$10$seJWVQSGNX1FF0oEO9VoUujJ2LRmVBuZ2FJYy6e5F5RLqjwE1H71m', NULL, 'CUSTOMER',         0, NULL, now(), now()),
('user-cust-005',  'Sofía Navarro',   'sofia@ejemplo.es',         now(), '$2b$10$seJWVQSGNX1FF0oEO9VoUujJ2LRmVBuZ2FJYy6e5F5RLqjwE1H71m', NULL, 'CUSTOMER',         0, NULL, now(), now());

-- ─── 3. Restaurants (5 in Andalucía) ─────────────────────────────────────────

INSERT INTO restaurants (id, name, slug, description, "imageUrl", "cuisineType", "deliveryFeeEur", "minOrderEur", "deliveryRadiusKm", lat, lng, "isActive", "createdAt", "updatedAt") VALUES
('rest-001', 'Hamburguesería Sa Plaça', 'hamburgueseria-sa-placa', 'Las mejores hamburguesas artesanales del pueblo.',       'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=500&fit=crop', 'hamburguesas', 2.00, 10.00, 5.0,  37.3886, -5.9823, true, now(), now()),
('rest-002', 'Casa Tradición',          'casa-tradicion',          'Cocina tradicional andaluza con productos de la tierra.', 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&h=500&fit=crop', 'tradicional',  1.50, 12.00, 4.0,  36.7213, -4.4214, true, now(), now()),
('rest-003', 'Pizzería Forn Nou',       'pizzeria-forn-nou',       'Pizza artesanal al horno de leña.',                       'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=500&fit=crop', 'pizza',        2.50,  8.00, 6.0,  36.8381, -4.7794, true, now(), now()),
('rest-004', 'Pollos El Rincón',        'pollos-el-rincon',        'Pollo asado y platos de pollo para toda la familia.',     'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&h=500&fit=crop', 'pollos',       1.00,  8.00, 3.5,  36.5298, -6.2926, true, now(), now()),
('rest-005', 'Kebab Alhambra',          'kebab-alhambra',          'Kebabs, falafel y cocina mediterránea.',                  'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&h=500&fit=crop', 'fast_food',    1.50,  6.00, 5.0,  37.1773, -3.5986, true, now(), now());

-- ─── 4. Restaurant Users (owners + staff) ───────────────────────────────────

INSERT INTO restaurant_users (id, "userId", "restaurantId", role) VALUES
-- Owner 1 owns rest-001 and rest-004
('ru-001', 'user-owner-001', 'rest-001', 'OWNER'),
('ru-002', 'user-owner-002', 'rest-002', 'OWNER'),
('ru-003', 'user-owner-003', 'rest-003', 'OWNER'),
('ru-004', 'user-owner-001', 'rest-004', 'OWNER'),
('ru-005', 'user-owner-002', 'rest-005', 'OWNER'),
-- Staff assignments
('ru-006', 'user-staff-001', 'rest-001', 'STAFF'),
('ru-007', 'user-staff-002', 'rest-002', 'STAFF'),
('ru-008', 'user-staff-003', 'rest-003', 'STAFF'),
('ru-009', 'user-staff-001', 'rest-004', 'STAFF'),
('ru-010', 'user-staff-002', 'rest-005', 'STAFF');

-- ─── 5. Opening Hours (Mon-Sun, 12:00-16:00 + 19:00-23:00 for each) ─────────

INSERT INTO opening_hours (id, "restaurantId", "dayOfWeek", "openTime", "closeTime") VALUES
-- rest-001
('oh-001-0a', 'rest-001', 0, '12:00', '16:00'), ('oh-001-0b', 'rest-001', 0, '19:00', '23:00'),
('oh-001-1a', 'rest-001', 1, '12:00', '16:00'), ('oh-001-1b', 'rest-001', 1, '19:00', '23:00'),
('oh-001-2a', 'rest-001', 2, '12:00', '16:00'), ('oh-001-2b', 'rest-001', 2, '19:00', '23:00'),
('oh-001-3a', 'rest-001', 3, '12:00', '16:00'), ('oh-001-3b', 'rest-001', 3, '19:00', '23:00'),
('oh-001-4a', 'rest-001', 4, '12:00', '16:00'), ('oh-001-4b', 'rest-001', 4, '19:00', '23:00'),
('oh-001-5a', 'rest-001', 5, '12:00', '16:00'), ('oh-001-5b', 'rest-001', 5, '19:00', '23:00'),
('oh-001-6a', 'rest-001', 6, '12:00', '16:00'), ('oh-001-6b', 'rest-001', 6, '19:00', '23:00'),
-- rest-002
('oh-002-0a', 'rest-002', 0, '12:00', '16:00'), ('oh-002-0b', 'rest-002', 0, '19:00', '23:00'),
('oh-002-1a', 'rest-002', 1, '12:00', '16:00'), ('oh-002-1b', 'rest-002', 1, '19:00', '23:00'),
('oh-002-2a', 'rest-002', 2, '12:00', '16:00'), ('oh-002-2b', 'rest-002', 2, '19:00', '23:00'),
('oh-002-3a', 'rest-002', 3, '12:00', '16:00'), ('oh-002-3b', 'rest-002', 3, '19:00', '23:00'),
('oh-002-4a', 'rest-002', 4, '12:00', '16:00'), ('oh-002-4b', 'rest-002', 4, '19:00', '23:00'),
('oh-002-5a', 'rest-002', 5, '12:00', '16:00'), ('oh-002-5b', 'rest-002', 5, '19:00', '23:00'),
('oh-002-6a', 'rest-002', 6, '12:00', '16:00'), ('oh-002-6b', 'rest-002', 6, '19:00', '23:00'),
-- rest-003
('oh-003-0a', 'rest-003', 0, '12:00', '16:00'), ('oh-003-0b', 'rest-003', 0, '19:00', '23:00'),
('oh-003-1a', 'rest-003', 1, '12:00', '16:00'), ('oh-003-1b', 'rest-003', 1, '19:00', '23:00'),
('oh-003-2a', 'rest-003', 2, '12:00', '16:00'), ('oh-003-2b', 'rest-003', 2, '19:00', '23:00'),
('oh-003-3a', 'rest-003', 3, '12:00', '16:00'), ('oh-003-3b', 'rest-003', 3, '19:00', '23:00'),
('oh-003-4a', 'rest-003', 4, '12:00', '16:00'), ('oh-003-4b', 'rest-003', 4, '19:00', '23:00'),
('oh-003-5a', 'rest-003', 5, '12:00', '16:00'), ('oh-003-5b', 'rest-003', 5, '19:00', '23:00'),
('oh-003-6a', 'rest-003', 6, '12:00', '16:00'), ('oh-003-6b', 'rest-003', 6, '19:00', '23:00'),
-- rest-004
('oh-004-0a', 'rest-004', 0, '12:00', '16:00'), ('oh-004-0b', 'rest-004', 0, '19:00', '23:00'),
('oh-004-1a', 'rest-004', 1, '12:00', '16:00'), ('oh-004-1b', 'rest-004', 1, '19:00', '23:00'),
('oh-004-2a', 'rest-004', 2, '12:00', '16:00'), ('oh-004-2b', 'rest-004', 2, '19:00', '23:00'),
('oh-004-3a', 'rest-004', 3, '12:00', '16:00'), ('oh-004-3b', 'rest-004', 3, '19:00', '23:00'),
('oh-004-4a', 'rest-004', 4, '12:00', '16:00'), ('oh-004-4b', 'rest-004', 4, '19:00', '23:00'),
('oh-004-5a', 'rest-004', 5, '12:00', '16:00'), ('oh-004-5b', 'rest-004', 5, '19:00', '23:00'),
('oh-004-6a', 'rest-004', 6, '12:00', '16:00'), ('oh-004-6b', 'rest-004', 6, '19:00', '23:00'),
-- rest-005
('oh-005-0a', 'rest-005', 0, '12:00', '16:00'), ('oh-005-0b', 'rest-005', 0, '19:00', '23:00'),
('oh-005-1a', 'rest-005', 1, '12:00', '16:00'), ('oh-005-1b', 'rest-005', 1, '19:00', '23:00'),
('oh-005-2a', 'rest-005', 2, '12:00', '16:00'), ('oh-005-2b', 'rest-005', 2, '19:00', '23:00'),
('oh-005-3a', 'rest-005', 3, '12:00', '16:00'), ('oh-005-3b', 'rest-005', 3, '19:00', '23:00'),
('oh-005-4a', 'rest-005', 4, '12:00', '16:00'), ('oh-005-4b', 'rest-005', 4, '19:00', '23:00'),
('oh-005-5a', 'rest-005', 5, '12:00', '16:00'), ('oh-005-5b', 'rest-005', 5, '19:00', '23:00'),
('oh-005-6a', 'rest-005', 6, '12:00', '16:00'), ('oh-005-6b', 'rest-005', 6, '19:00', '23:00');

-- ─── 6. Delivery Zones ──────────────────────────────────────────────────────

INSERT INTO delivery_zones (id, "restaurantId", "radiusKm", lat, lng) VALUES
('dz-001', 'rest-001', 5.0, 37.3886, -5.9823),
('dz-002', 'rest-002', 4.0, 36.7213, -4.4214),
('dz-003', 'rest-003', 6.0, 36.8381, -4.7794),
('dz-004', 'rest-004', 3.5, 36.5298, -6.2926),
('dz-005', 'rest-005', 5.0, 37.1773, -3.5986);

-- ─── 7. Categories (4 per restaurant = 20 total) ────────────────────────────

INSERT INTO categories (id, "restaurantId", name, "sortOrder", "createdAt") VALUES
-- rest-001
('cat-rest-001-0', 'rest-001', 'Entrantes',    0, now()),
('cat-rest-001-1', 'rest-001', 'Principales',  1, now()),
('cat-rest-001-2', 'rest-001', 'Bebidas',      2, now()),
('cat-rest-001-3', 'rest-001', 'Postres',      3, now()),
-- rest-002
('cat-rest-002-0', 'rest-002', 'Entrantes',    0, now()),
('cat-rest-002-1', 'rest-002', 'Principales',  1, now()),
('cat-rest-002-2', 'rest-002', 'Bebidas',      2, now()),
('cat-rest-002-3', 'rest-002', 'Postres',      3, now()),
-- rest-003
('cat-rest-003-0', 'rest-003', 'Entrantes',    0, now()),
('cat-rest-003-1', 'rest-003', 'Principales',  1, now()),
('cat-rest-003-2', 'rest-003', 'Bebidas',      2, now()),
('cat-rest-003-3', 'rest-003', 'Postres',      3, now()),
-- rest-004
('cat-rest-004-0', 'rest-004', 'Entrantes',    0, now()),
('cat-rest-004-1', 'rest-004', 'Principales',  1, now()),
('cat-rest-004-2', 'rest-004', 'Bebidas',      2, now()),
('cat-rest-004-3', 'rest-004', 'Postres',      3, now()),
-- rest-005
('cat-rest-005-0', 'rest-005', 'Entrantes',    0, now()),
('cat-rest-005-1', 'rest-005', 'Principales',  1, now()),
('cat-rest-005-2', 'rest-005', 'Bebidas',      2, now()),
('cat-rest-005-3', 'rest-005', 'Postres',      3, now());

-- ─── 8. Products (52 total) ──────────────────────────────────────────────────

INSERT INTO products (id, "categoryId", name, description, "priceEur", "imageUrl", "isAvailable", "createdAt", "updatedAt") VALUES
-- Restaurant 1: Hamburguesería Sa Plaça (10 products)
('prod-rest-001-00', 'cat-rest-001-0', 'Nachos con queso',      'Nachos crujientes con queso cheddar fundido',                5.50, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-001-01', 'cat-rest-001-0', 'Aros de cebolla',       'Aros de cebolla rebozados y crujientes',                     4.50, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-001-02', 'cat-rest-001-1', 'Burger Clásica',        'Hamburguesa de ternera con lechuga, tomate y cebolla',        8.50, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-001-03', 'cat-rest-001-1', 'Burger BBQ',            'Hamburguesa con bacon, queso cheddar y salsa BBQ',           10.00, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-001-04', 'cat-rest-001-1', 'Burger Vegana',         'Hamburguesa de garbanzos con aguacate',                       9.00, 'https://images.unsplash.com/photo-1520072959219-c595e6cdc07e?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-001-05', 'cat-rest-001-1', 'Patatas fritas',        'Patatas fritas caseras con sal',                              3.50, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-001-06', 'cat-rest-001-2', 'Coca-Cola',             'Coca-Cola 33cl',                                              2.00, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-001-07', 'cat-rest-001-2', 'Agua mineral',          'Agua mineral 50cl',                                           1.50, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-001-08', 'cat-rest-001-2', 'Cerveza artesana',      'Cerveza artesana local 33cl',                                 3.00, 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-001-09', 'cat-rest-001-3', 'Brownie de chocolate',  'Brownie casero con nueces',                                   4.00, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&h=300&fit=crop', true, now(), now()),
-- Restaurant 2: Casa Tradición (10 products)
('prod-rest-002-00', 'cat-rest-002-0', 'Salmorejo cordobés',    'Salmorejo tradicional con jamón y huevo',                     6.00, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-002-01', 'cat-rest-002-0', 'Ensalada mixta',        'Ensalada fresca con tomate, lechuga y aceitunas',             5.50, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-002-02', 'cat-rest-002-1', 'Paella mixta',          'Paella de mariscos y pollo para 2 personas',                 12.00, 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-002-03', 'cat-rest-002-1', 'Rabo de toro',          'Rabo de toro estofado con verduras',                         14.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-002-04', 'cat-rest-002-1', 'Flamenquín cordobés',   'Flamenquín de jamón y queso',                                 9.50, 'https://images.unsplash.com/photo-1585325701165-351af55e4e58?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-002-05', 'cat-rest-002-1', 'Pescaíto frito',        'Variado de pescado frito al estilo andaluz',                 11.00, 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-002-06', 'cat-rest-002-2', 'Tinto de verano',       'Tinto de verano con limón',                                   2.50, 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-002-07', 'cat-rest-002-2', 'Zumo de naranja',       'Zumo de naranja natural',                                     3.00, 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-002-08', 'cat-rest-002-3', 'Torrijas',              'Torrijas caseras con miel',                                    4.50, 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-002-09', 'cat-rest-002-3', 'Flan de huevo',         'Flan casero con caramelo',                                    3.50, 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=400&h=300&fit=crop', true, now(), now()),
-- Restaurant 3: Pizzería Forn Nou (11 products)
('prod-rest-003-00', 'cat-rest-003-0', 'Bruschetta',            'Pan tostado con tomate, albahaca y aceite',                   5.00, 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-003-01', 'cat-rest-003-0', 'Ensalada César',        'Ensalada con pollo, parmesano y croutons',                    7.00, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-003-02', 'cat-rest-003-1', 'Pizza Margarita',       'Tomate, mozzarella y albahaca',                               9.00, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-003-03', 'cat-rest-003-1', 'Pizza Pepperoni',       'Tomate, mozzarella y pepperoni',                             10.50, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-003-04', 'cat-rest-003-1', 'Pizza 4 Quesos',        'Mozzarella, gorgonzola, parmesano y emmental',               11.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-003-05', 'cat-rest-003-1', 'Pizza Vegetal',         'Tomate, mozzarella, pimientos, champiñones y aceitunas',       9.50, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-003-06', 'cat-rest-003-1', 'Calzone',              'Masa rellena de jamón, queso y champiñones',                  10.00, 'https://images.unsplash.com/photo-1536964549204-cce9eab227bd?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-003-07', 'cat-rest-003-2', 'Refresco',             'Refresco a elegir 33cl',                                      2.00, 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-003-08', 'cat-rest-003-2', 'Cerveza italiana',     'Peroni Nastro Azzurro 33cl',                                  3.50, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-003-09', 'cat-rest-003-3', 'Tiramisú',             'Tiramisú casero con mascarpone',                              5.00, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-003-10', 'cat-rest-003-3', 'Panna cotta',          'Panna cotta con frutos rojos',                                4.50, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop', true, now(), now()),
-- Restaurant 4: Pollos El Rincón (10 products)
('prod-rest-004-00', 'cat-rest-004-0', 'Alitas de pollo',       'Alitas de pollo crujientes con salsa',                        5.00, 'https://images.unsplash.com/photo-1527477396000-e27163b4bbed?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-004-01', 'cat-rest-004-0', 'Croquetas de pollo',    'Croquetas caseras de pollo',                                  4.50, 'https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-004-02', 'cat-rest-004-1', 'Pollo asado entero',    'Pollo asado al horno con patatas',                           12.00, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-004-03', 'cat-rest-004-1', 'Medio pollo asado',     'Medio pollo asado con ensalada',                              7.00, 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-004-04', 'cat-rest-004-1', 'Pollo al limón',        'Pechuga de pollo al limón con arroz',                         8.50, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-004-05', 'cat-rest-004-1', 'Nuggets de pollo',      '12 nuggets de pollo con patatas',                             6.50, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-004-06', 'cat-rest-004-2', 'Coca-Cola',             'Coca-Cola 33cl',                                              1.80, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-004-07', 'cat-rest-004-2', 'Agua',                  'Agua mineral 50cl',                                           1.20, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-004-08', 'cat-rest-004-3', 'Helado de vainilla',    'Tarrina de helado de vainilla',                               3.00, 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-004-09', 'cat-rest-004-3', 'Natillas',              'Natillas caseras',                                            2.50, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop', true, now(), now()),
-- Restaurant 5: Kebab Alhambra (11 products)
('prod-rest-005-00', 'cat-rest-005-0', 'Hummus',                'Hummus casero con pan de pita',                               4.50, 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-005-01', 'cat-rest-005-0', 'Falafel (6 uds)',       'Falafel de garbanzos con salsa tahini',                       5.00, 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-005-02', 'cat-rest-005-1', 'Kebab de pollo',        'Kebab de pollo con verduras y salsa yogur',                   6.50, 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-005-03', 'cat-rest-005-1', 'Kebab mixto',           'Kebab de pollo y ternera con ensalada',                       7.50, 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-005-04', 'cat-rest-005-1', 'Durum de falafel',      'Wrap de falafel con verduras y tahini',                       6.00, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-005-05', 'cat-rest-005-1', 'Plato kebab',           'Plato de kebab con arroz, ensalada y salsas',                 9.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-005-06', 'cat-rest-005-1', 'Shawarma de ternera',   'Shawarma de ternera con patatas',                             8.00, 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-005-07', 'cat-rest-005-2', 'Ayran',                 'Bebida de yogur tradicional',                                 2.00, 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-005-08', 'cat-rest-005-2', 'Té moruno',             'Té verde con hierbabuena',                                    2.50, 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-005-09', 'cat-rest-005-3', 'Baklava',               'Pastel de hojaldre con pistachos y miel',                     3.50, 'https://images.unsplash.com/photo-1519676867240-f03562e64571?w=400&h=300&fit=crop', true, now(), now()),
('prod-rest-005-10', 'cat-rest-005-3', 'Kunafa',                'Postre de queso con fideos kataifi',                          4.00, 'https://images.unsplash.com/photo-1579888944880-d98341245702?w=400&h=300&fit=crop', true, now(), now());

-- ─── 9. Product Allergens ────────────────────────────────────────────────────

INSERT INTO product_allergens (id, "productId", "allergenId") VALUES
-- Rest 1: Hamburguesería Sa Plaça
('pa-001-00-1',  'prod-rest-001-00', 1),  ('pa-001-00-7',  'prod-rest-001-00', 7),
('pa-001-01-1',  'prod-rest-001-01', 1),  ('pa-001-01-3',  'prod-rest-001-01', 3),
('pa-001-02-1',  'prod-rest-001-02', 1),  ('pa-001-02-3',  'prod-rest-001-02', 3),  ('pa-001-02-7',  'prod-rest-001-02', 7),  ('pa-001-02-10', 'prod-rest-001-02', 10), ('pa-001-02-11', 'prod-rest-001-02', 11),
('pa-001-03-1',  'prod-rest-001-03', 1),  ('pa-001-03-3',  'prod-rest-001-03', 3),  ('pa-001-03-7',  'prod-rest-001-03', 7),  ('pa-001-03-10', 'prod-rest-001-03', 10), ('pa-001-03-12', 'prod-rest-001-03', 12),
('pa-001-04-1',  'prod-rest-001-04', 1),  ('pa-001-04-6',  'prod-rest-001-04', 6),
('pa-001-08-1',  'prod-rest-001-08', 1),
('pa-001-09-1',  'prod-rest-001-09', 1),  ('pa-001-09-3',  'prod-rest-001-09', 3),  ('pa-001-09-7',  'prod-rest-001-09', 7),  ('pa-001-09-8',  'prod-rest-001-09', 8),
-- Rest 2: Casa Tradición
('pa-002-00-1',  'prod-rest-002-00', 1),  ('pa-002-00-3',  'prod-rest-002-00', 3),
('pa-002-01-12', 'prod-rest-002-01', 12),
('pa-002-02-2',  'prod-rest-002-02', 2),  ('pa-002-02-4',  'prod-rest-002-02', 4),  ('pa-002-02-14', 'prod-rest-002-02', 14),
('pa-002-03-9',  'prod-rest-002-03', 9),  ('pa-002-03-12', 'prod-rest-002-03', 12),
('pa-002-04-1',  'prod-rest-002-04', 1),  ('pa-002-04-3',  'prod-rest-002-04', 3),  ('pa-002-04-7',  'prod-rest-002-04', 7),
('pa-002-05-1',  'prod-rest-002-05', 1),  ('pa-002-05-4',  'prod-rest-002-05', 4),
('pa-002-06-12', 'prod-rest-002-06', 12),
('pa-002-08-1',  'prod-rest-002-08', 1),  ('pa-002-08-3',  'prod-rest-002-08', 3),  ('pa-002-08-7',  'prod-rest-002-08', 7),
('pa-002-09-3',  'prod-rest-002-09', 3),  ('pa-002-09-7',  'prod-rest-002-09', 7),
-- Rest 3: Pizzería Forn Nou
('pa-003-00-1',  'prod-rest-003-00', 1),
('pa-003-01-1',  'prod-rest-003-01', 1),  ('pa-003-01-3',  'prod-rest-003-01', 3),  ('pa-003-01-4',  'prod-rest-003-01', 4),  ('pa-003-01-7',  'prod-rest-003-01', 7),
('pa-003-02-1',  'prod-rest-003-02', 1),  ('pa-003-02-7',  'prod-rest-003-02', 7),
('pa-003-03-1',  'prod-rest-003-03', 1),  ('pa-003-03-7',  'prod-rest-003-03', 7),
('pa-003-04-1',  'prod-rest-003-04', 1),  ('pa-003-04-7',  'prod-rest-003-04', 7),
('pa-003-05-1',  'prod-rest-003-05', 1),  ('pa-003-05-7',  'prod-rest-003-05', 7),
('pa-003-06-1',  'prod-rest-003-06', 1),  ('pa-003-06-3',  'prod-rest-003-06', 3),  ('pa-003-06-7',  'prod-rest-003-06', 7),
('pa-003-08-1',  'prod-rest-003-08', 1),
('pa-003-09-1',  'prod-rest-003-09', 1),  ('pa-003-09-3',  'prod-rest-003-09', 3),  ('pa-003-09-7',  'prod-rest-003-09', 7),
('pa-003-10-7',  'prod-rest-003-10', 7),
-- Rest 4: Pollos El Rincón
('pa-004-00-1',  'prod-rest-004-00', 1),  ('pa-004-00-3',  'prod-rest-004-00', 3),
('pa-004-01-1',  'prod-rest-004-01', 1),  ('pa-004-01-3',  'prod-rest-004-01', 3),  ('pa-004-01-7',  'prod-rest-004-01', 7),
('pa-004-05-1',  'prod-rest-004-05', 1),  ('pa-004-05-3',  'prod-rest-004-05', 3),
('pa-004-08-3',  'prod-rest-004-08', 3),  ('pa-004-08-7',  'prod-rest-004-08', 7),
('pa-004-09-3',  'prod-rest-004-09', 3),  ('pa-004-09-7',  'prod-rest-004-09', 7),
-- Rest 5: Kebab Alhambra
('pa-005-00-11', 'prod-rest-005-00', 11),
('pa-005-01-1',  'prod-rest-005-01', 1),  ('pa-005-01-11', 'prod-rest-005-01', 11),
('pa-005-02-1',  'prod-rest-005-02', 1),  ('pa-005-02-7',  'prod-rest-005-02', 7),
('pa-005-03-1',  'prod-rest-005-03', 1),  ('pa-005-03-7',  'prod-rest-005-03', 7),
('pa-005-04-1',  'prod-rest-005-04', 1),  ('pa-005-04-11', 'prod-rest-005-04', 11),
('pa-005-05-1',  'prod-rest-005-05', 1),  ('pa-005-05-7',  'prod-rest-005-05', 7),
('pa-005-06-1',  'prod-rest-005-06', 1),  ('pa-005-06-7',  'prod-rest-005-06', 7),
('pa-005-07-7',  'prod-rest-005-07', 7),
('pa-005-09-1',  'prod-rest-005-09', 1),  ('pa-005-09-8',  'prod-rest-005-09', 8),
('pa-005-10-1',  'prod-rest-005-10', 1),  ('pa-005-10-7',  'prod-rest-005-10', 7),  ('pa-005-10-8',  'prod-rest-005-10', 8);

-- ─── 10. Addresses (10 in Andalucía) ────────────────────────────────────────

INSERT INTO addresses (id, "userId", label, street, municipality, city, "postalCode", "floorDoor", lat, lng, "createdAt") VALUES
('addr-001', 'user-cust-001', 'Casa',        'C/ Sierpes 12',                'Sevilla',  'Sevilla',  '41004', '3ºB',  37.3891, -5.9945, now()),
('addr-002', 'user-cust-001', 'Trabajo',     'Av. de la Constitución 5',     'Sevilla',  'Sevilla',  '41001', NULL,   37.3862, -5.9927, now()),
('addr-003', 'user-cust-002', 'Casa',        'C/ Larios 8',                  'Málaga',   'Málaga',   '29015', '2ºA',  36.7196, -4.4200, now()),
('addr-004', 'user-cust-002', NULL,           'Paseo del Parque 3',           'Málaga',   'Málaga',   '29015', NULL,   36.7178, -4.4163, now()),
('addr-005', 'user-cust-003', 'Casa',        'C/ Gondomar 1',                'Córdoba',  'Córdoba',  '14003', '1ºC',  36.8400, -4.7790, now()),
('addr-006', 'user-cust-003', NULL,           'Av. Gran Capitán 15',          'Córdoba',  'Córdoba',  '14008', NULL,   36.8395, -4.7830, now()),
('addr-007', 'user-cust-004', 'Casa',        'C/ Ancha 22',                  'Cádiz',    'Cádiz',    '11001', 'Bajo', 36.5310, -6.2930, now()),
('addr-008', 'user-cust-004', NULL,           'Plaza de San Juan de Dios 4',  'Cádiz',    'Cádiz',    '11005', NULL,   36.5290, -6.2920, now()),
('addr-009', 'user-cust-005', 'Casa',        'C/ Reyes Católicos 10',        'Granada',  'Granada',  '18009', '4ºD',  37.1760, -3.5990, now()),
('addr-010', 'user-cust-005', 'Universidad', 'Av. del Hospicio 1',           'Granada',  'Granada',  '18010', NULL,   37.1780, -3.5970, now());

-- ─── 11. Orders (12 total: 6 ASAP + 6 SCHEDULED) ────────────────────────────
-- Note: orderNumber is SERIAL (autoincrement), so we omit it and let Postgres assign.
-- We use now() - interval for createdAt to simulate orders placed at different times.

INSERT INTO orders (id, "userId", "restaurantId", "addressId", phone, "fulfillmentType", "scheduledFor", "subtotalEur", "deliveryFeeEur", "totalEur", "currentStatus", "idempotencyKey", "createdAt", "updatedAt") VALUES
-- ASAP orders
('order-001', 'user-cust-001', 'rest-001', 'addr-001', '+34612345001', 'ASAP', NULL,                          20.50, 2.00, 22.50, 'DELIVERED',        'idem-001', now() - interval '36 hours', now() - interval '36 hours'),
('order-002', 'user-cust-002', 'rest-002', 'addr-003', '+34612345002', 'ASAP', NULL,                          18.50, 1.50, 20.00, 'REJECTED',         'idem-002', now() - interval '30 hours', now() - interval '30 hours'),
('order-003', 'user-cust-003', 'rest-003', 'addr-005', '+34612345003', 'ASAP', NULL,                          19.50, 2.50, 22.00, 'PREPARING',        'idem-003', now() - interval '1 hour',   now() - interval '1 hour'),
('order-004', 'user-cust-001', 'rest-004', 'addr-002', '+34612345001', 'ASAP', NULL,                          12.00, 1.00, 13.00, 'OUT_FOR_DELIVERY', 'idem-004', now() - interval '45 minutes', now() - interval '45 minutes'),
('order-005', 'user-cust-004', 'rest-005', 'addr-007', '+34612345004', 'ASAP', NULL,                          13.00, 1.50, 14.50, 'CANCELLED',        'idem-005', now() - interval '24 hours', now() - interval '24 hours'),
('order-006', 'user-cust-005', 'rest-001', 'addr-009', '+34612345005', 'ASAP', NULL,                          17.00, 2.00, 19.00, 'DELIVERED',        'idem-006', now() - interval '12 hours', now() - interval '12 hours'),
-- SCHEDULED orders
('order-007', 'user-cust-001', 'rest-002', 'addr-001', '+34612345001', 'SCHEDULED', now() + interval '3 hours', 23.50, 1.50, 25.00, 'ACCEPTED', 'idem-007', now() - interval '2 hours',  now() - interval '2 hours'),
('order-008', 'user-cust-002', 'rest-003', 'addr-004', '+34612345002', 'SCHEDULED', now() + interval '1 hour',  20.50, 2.50, 23.00, 'PREPARING', 'idem-008', now() - interval '3 hours',  now() - interval '3 hours'),
('order-009', 'user-cust-003', 'rest-001', 'addr-006', '+34612345003', 'SCHEDULED', now() + interval '5 hours', 14.00, 2.00, 16.00, 'PLACED',    'idem-009', now() - interval '30 minutes', now() - interval '30 minutes'),
('order-010', 'user-cust-004', 'rest-004', 'addr-008', '+34612345004', 'SCHEDULED', now() - interval '1 hour',  19.00, 1.00, 20.00, 'DELIVERED', 'idem-010', now() - interval '6 hours',  now() - interval '6 hours'),
('order-011', 'user-cust-005', 'rest-005', 'addr-010', '+34612345005', 'SCHEDULED', now() + interval '2 hours', 15.50, 1.50, 17.00, 'ACCEPTED',  'idem-011', now() - interval '1 hour',   now() - interval '1 hour'),
('order-012', 'user-cust-002', 'rest-001', 'addr-003', '+34612345002', 'SCHEDULED', now() + interval '4 hours', 13.50, 2.00, 15.50, 'PLACED',    'idem-012', now() - interval '15 minutes', now() - interval '15 minutes');

-- ─── 12. Order Items ─────────────────────────────────────────────────────────

INSERT INTO order_items (id, "orderId", "productId", "productName", "productPriceEur", quantity, "createdAt") VALUES
-- Order 1 (Delivered)
('oi-001-1', 'order-001', 'prod-rest-001-02', 'Burger Clásica',     8.50, 2, now() - interval '36 hours'),
('oi-001-2', 'order-001', 'prod-rest-001-05', 'Patatas fritas',     3.50, 1, now() - interval '36 hours'),
-- Order 2 (Rejected)
('oi-002-1', 'order-002', 'prod-rest-002-02', 'Paella mixta',      12.00, 1, now() - interval '30 hours'),
('oi-002-2', 'order-002', 'prod-rest-002-01', 'Ensalada mixta',     5.50, 1, now() - interval '30 hours'),
-- Order 3 (Preparing)
('oi-003-1', 'order-003', 'prod-rest-003-02', 'Pizza Margarita',    9.00, 1, now() - interval '1 hour'),
('oi-003-2', 'order-003', 'prod-rest-003-03', 'Pizza Pepperoni',   10.50, 1, now() - interval '1 hour'),
-- Order 4 (Out for delivery)
('oi-004-1', 'order-004', 'prod-rest-004-02', 'Pollo asado entero',12.00, 1, now() - interval '45 minutes'),
-- Order 5 (Cancelled)
('oi-005-1', 'order-005', 'prod-rest-005-02', 'Kebab de pollo',     6.50, 2, now() - interval '24 hours'),
-- Order 6 (Delivered)
('oi-006-1', 'order-006', 'prod-rest-001-03', 'Burger BBQ',        10.00, 1, now() - interval '12 hours'),
('oi-006-2', 'order-006', 'prod-rest-001-04', 'Burger Vegana',      9.00, 1, now() - interval '12 hours'),
-- Order 7 (Accepted, scheduled)
('oi-007-1', 'order-007', 'prod-rest-002-03', 'Rabo de toro',      14.00, 1, now() - interval '2 hours'),
('oi-007-2', 'order-007', 'prod-rest-002-04', 'Flamenquín cordobés', 9.50, 1, now() - interval '2 hours'),
-- Order 8 (Preparing, scheduled)
('oi-008-1', 'order-008', 'prod-rest-003-04', 'Pizza 4 Quesos',    11.00, 1, now() - interval '3 hours'),
('oi-008-2', 'order-008', 'prod-rest-003-05', 'Pizza Vegetal',      9.50, 1, now() - interval '3 hours'),
-- Order 9 (Placed, scheduled)
('oi-009-1', 'order-009', 'prod-rest-001-00', 'Nachos con queso',   5.50, 1, now() - interval '30 minutes'),
('oi-009-2', 'order-009', 'prod-rest-001-02', 'Burger Clásica',     8.50, 1, now() - interval '30 minutes'),
-- Order 10 (Delivered, scheduled)
('oi-010-1', 'order-010', 'prod-rest-004-02', 'Pollo asado entero',12.00, 1, now() - interval '6 hours'),
('oi-010-2', 'order-010', 'prod-rest-004-03', 'Medio pollo asado',  7.00, 1, now() - interval '6 hours'),
-- Order 11 (Accepted, scheduled)
('oi-011-1', 'order-011', 'prod-rest-005-03', 'Kebab mixto',        7.50, 1, now() - interval '1 hour'),
('oi-011-2', 'order-011', 'prod-rest-005-05', 'Plato kebab',        9.00, 1, now() - interval '1 hour'),
-- Order 12 (Placed, scheduled)
('oi-012-1', 'order-012', 'prod-rest-001-01', 'Aros de cebolla',    4.50, 1, now() - interval '15 minutes'),
('oi-012-2', 'order-012', 'prod-rest-001-04', 'Burger Vegana',      9.00, 1, now() - interval '15 minutes');

-- ─── 13. Order Status History ────────────────────────────────────────────────

INSERT INTO order_status_history (id, "orderId", "fromStatus", "toStatus", "changedByUserId", reason, "createdAt") VALUES
-- Order 1: PLACED → ACCEPTED → PREPARING → READY_FOR_PICKUP → OUT_FOR_DELIVERY → DELIVERED
('osh-001-1', 'order-001', NULL,                'PLACED',           'user-cust-001',  NULL, now() - interval '36 hours'),
('osh-001-2', 'order-001', 'PLACED',            'ACCEPTED',         'user-owner-001', NULL, now() - interval '36 hours' + interval '2 minutes'),
('osh-001-3', 'order-001', 'ACCEPTED',          'PREPARING',        'user-owner-001', NULL, now() - interval '36 hours' + interval '5 minutes'),
('osh-001-4', 'order-001', 'PREPARING',         'READY_FOR_PICKUP', 'user-staff-001', NULL, now() - interval '36 hours' + interval '25 minutes'),
('osh-001-5', 'order-001', 'READY_FOR_PICKUP',  'OUT_FOR_DELIVERY', 'user-staff-001', NULL, now() - interval '36 hours' + interval '28 minutes'),
('osh-001-6', 'order-001', 'OUT_FOR_DELIVERY',  'DELIVERED',        'user-staff-001', NULL, now() - interval '36 hours' + interval '38 minutes'),
-- Order 2: PLACED → REJECTED
('osh-002-1', 'order-002', NULL,                'PLACED',           'user-cust-002',  NULL, now() - interval '30 hours'),
('osh-002-2', 'order-002', 'PLACED',            'REJECTED',         'user-owner-002', NULL, now() - interval '30 hours' + interval '5 minutes'),
-- Order 3: PLACED → ACCEPTED → PREPARING
('osh-003-1', 'order-003', NULL,                'PLACED',           'user-cust-003',  NULL, now() - interval '1 hour'),
('osh-003-2', 'order-003', 'PLACED',            'ACCEPTED',         'user-owner-003', NULL, now() - interval '1 hour' + interval '3 minutes'),
('osh-003-3', 'order-003', 'ACCEPTED',          'PREPARING',        'user-owner-003', NULL, now() - interval '1 hour' + interval '5 minutes'),
-- Order 4: PLACED → ACCEPTED → PREPARING → READY_FOR_PICKUP → OUT_FOR_DELIVERY
('osh-004-1', 'order-004', NULL,                'PLACED',           'user-cust-001',  NULL, now() - interval '45 minutes'),
('osh-004-2', 'order-004', 'PLACED',            'ACCEPTED',         'user-owner-001', NULL, now() - interval '45 minutes' + interval '1 minute'),
('osh-004-3', 'order-004', 'ACCEPTED',          'PREPARING',        'user-owner-001', NULL, now() - interval '45 minutes' + interval '3 minutes'),
('osh-004-4', 'order-004', 'PREPARING',         'READY_FOR_PICKUP', 'user-staff-001', NULL, now() - interval '45 minutes' + interval '20 minutes'),
('osh-004-5', 'order-004', 'READY_FOR_PICKUP',  'OUT_FOR_DELIVERY', 'user-staff-001', NULL, now() - interval '45 minutes' + interval '22 minutes'),
-- Order 5: PLACED → CANCELLED
('osh-005-1', 'order-005', NULL,                'PLACED',           'user-cust-004',  NULL, now() - interval '24 hours'),
('osh-005-2', 'order-005', 'PLACED',            'CANCELLED',        'user-cust-004',  NULL, now() - interval '24 hours' + interval '2 minutes'),
-- Order 6: PLACED → ACCEPTED → PREPARING → READY_FOR_PICKUP → OUT_FOR_DELIVERY → DELIVERED
('osh-006-1', 'order-006', NULL,                'PLACED',           'user-cust-005',  NULL, now() - interval '12 hours'),
('osh-006-2', 'order-006', 'PLACED',            'ACCEPTED',         'user-owner-001', NULL, now() - interval '12 hours' + interval '1 minute'),
('osh-006-3', 'order-006', 'ACCEPTED',          'PREPARING',        'user-owner-001', NULL, now() - interval '12 hours' + interval '3 minutes'),
('osh-006-4', 'order-006', 'PREPARING',         'READY_FOR_PICKUP', 'user-staff-001', NULL, now() - interval '12 hours' + interval '22 minutes'),
('osh-006-5', 'order-006', 'READY_FOR_PICKUP',  'OUT_FOR_DELIVERY', 'user-staff-001', NULL, now() - interval '12 hours' + interval '25 minutes'),
('osh-006-6', 'order-006', 'OUT_FOR_DELIVERY',  'DELIVERED',        'user-staff-001', NULL, now() - interval '12 hours' + interval '35 minutes'),
-- Order 7: PLACED → ACCEPTED
('osh-007-1', 'order-007', NULL,                'PLACED',           'user-cust-001',  NULL, now() - interval '2 hours'),
('osh-007-2', 'order-007', 'PLACED',            'ACCEPTED',         'user-owner-002', NULL, now() - interval '2 hours' + interval '10 minutes'),
-- Order 8: PLACED → ACCEPTED → PREPARING
('osh-008-1', 'order-008', NULL,                'PLACED',           'user-cust-002',  NULL, now() - interval '3 hours'),
('osh-008-2', 'order-008', 'PLACED',            'ACCEPTED',         'user-owner-003', NULL, now() - interval '3 hours' + interval '5 minutes'),
('osh-008-3', 'order-008', 'ACCEPTED',          'PREPARING',        'user-owner-003', NULL, now() - interval '3 hours' + interval '15 minutes'),
-- Order 9: PLACED
('osh-009-1', 'order-009', NULL,                'PLACED',           'user-cust-003',  NULL, now() - interval '30 minutes'),
-- Order 10: PLACED → ACCEPTED → PREPARING → READY_FOR_PICKUP → OUT_FOR_DELIVERY → DELIVERED
('osh-010-1', 'order-010', NULL,                'PLACED',           'user-cust-004',  NULL, now() - interval '6 hours'),
('osh-010-2', 'order-010', 'PLACED',            'ACCEPTED',         'user-owner-001', NULL, now() - interval '6 hours' + interval '5 minutes'),
('osh-010-3', 'order-010', 'ACCEPTED',          'PREPARING',        'user-owner-001', NULL, now() - interval '6 hours' + interval '30 minutes'),
('osh-010-4', 'order-010', 'PREPARING',         'READY_FOR_PICKUP', 'user-staff-001', NULL, now() - interval '6 hours' + interval '50 minutes'),
('osh-010-5', 'order-010', 'READY_FOR_PICKUP',  'OUT_FOR_DELIVERY', 'user-staff-001', NULL, now() - interval '6 hours' + interval '55 minutes'),
('osh-010-6', 'order-010', 'OUT_FOR_DELIVERY',  'DELIVERED',        'user-staff-001', NULL, now() - interval '6 hours' + interval '65 minutes'),
-- Order 11: PLACED → ACCEPTED
('osh-011-1', 'order-011', NULL,                'PLACED',           'user-cust-005',  NULL, now() - interval '1 hour'),
('osh-011-2', 'order-011', 'PLACED',            'ACCEPTED',         'user-owner-002', NULL, now() - interval '1 hour' + interval '8 minutes'),
-- Order 12: PLACED
('osh-012-1', 'order-012', NULL,                'PLACED',           'user-cust-002',  NULL, now() - interval '15 minutes');

-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed complete!
-- ═══════════════════════════════════════════════════════════════════════════════
