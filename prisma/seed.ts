// prisma/seed.ts — Pueblo Delivery Marketplace seed data
// Requisitos: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashSync } from 'bcryptjs';

// Use adapter for all connections (works with both local Supabase and direct connections)
function createSeedClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? '';
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

const prisma = createSeedClient();

// ─── 14 EU Allergens (Reglamento UE 1169/2011) ──────────────

const EU_ALLERGENS = [
  { id: 1,  code: 'GLUTEN',       nameEs: 'Gluten',                      icon: 'gluten.svg' },
  { id: 2,  code: 'CRUSTACEANS',   nameEs: 'Crustáceos',                  icon: 'crustaceans.svg' },
  { id: 3,  code: 'EGGS',          nameEs: 'Huevos',                      icon: 'eggs.svg' },
  { id: 4,  code: 'FISH',          nameEs: 'Pescado',                     icon: 'fish.svg' },
  { id: 5,  code: 'PEANUTS',       nameEs: 'Cacahuetes',                  icon: 'peanuts.svg' },
  { id: 6,  code: 'SOY',           nameEs: 'Soja',                        icon: 'soy.svg' },
  { id: 7,  code: 'DAIRY',         nameEs: 'Lácteos',                     icon: 'dairy.svg' },
  { id: 8,  code: 'TREE_NUTS',     nameEs: 'Frutos de cáscara',           icon: 'tree-nuts.svg' },
  { id: 9,  code: 'CELERY',        nameEs: 'Apio',                        icon: 'celery.svg' },
  { id: 10, code: 'MUSTARD',       nameEs: 'Mostaza',                     icon: 'mustard.svg' },
  { id: 11, code: 'SESAME',        nameEs: 'Sésamo',                      icon: 'sesame.svg' },
  { id: 12, code: 'SULPHITES',     nameEs: 'Dióxido de azufre/Sulfitos',  icon: 'sulphites.svg' },
  { id: 13, code: 'LUPIN',         nameEs: 'Altramuces',                  icon: 'lupin.svg' },
  { id: 14, code: 'MOLLUSCS',      nameEs: 'Moluscos',                    icon: 'molluscs.svg' },
];

// ─── 12 Users ────────────────────────────────────────────────

const PASSWORD_HASH = hashSync('Password123!', 10);

const USERS = [
  // 1 Admin
  { id: 'user-admin-001',   name: 'Admin Pueblo',       email: 'admin@pueblodelivery.es',     role: 'ADMIN' as const },
  // 3 Restaurant Owners
  { id: 'user-owner-001',   name: 'María García',       email: 'maria@saplaça.es',            role: 'RESTAURANT_OWNER' as const },
  { id: 'user-owner-002',   name: 'Antonio López',      email: 'antonio@casatradicion.es',    role: 'RESTAURANT_OWNER' as const },
  { id: 'user-owner-003',   name: 'Carmen Ruiz',        email: 'carmen@pizzeriaforn.es',       role: 'RESTAURANT_OWNER' as const },
  // 3 Restaurant Staff
  { id: 'user-staff-001',   name: 'Pedro Martínez',     email: 'pedro@saplaça.es',            role: 'RESTAURANT_STAFF' as const },
  { id: 'user-staff-002',   name: 'Laura Fernández',    email: 'laura@casatradicion.es',      role: 'RESTAURANT_STAFF' as const },
  { id: 'user-staff-003',   name: 'Javier Sánchez',     email: 'javier@pizzeriaforn.es',       role: 'RESTAURANT_STAFF' as const },
  // 5 Customers
  { id: 'user-cust-001',    name: 'Ana Moreno',         email: 'ana@ejemplo.es',              role: 'CUSTOMER' as const },
  { id: 'user-cust-002',    name: 'Carlos Díaz',        email: 'carlos@ejemplo.es',           role: 'CUSTOMER' as const },
  { id: 'user-cust-003',    name: 'Elena Torres',       email: 'elena@ejemplo.es',            role: 'CUSTOMER' as const },
  { id: 'user-cust-004',    name: 'Miguel Romero',      email: 'miguel@ejemplo.es',           role: 'CUSTOMER' as const },
  { id: 'user-cust-005',    name: 'Sofía Navarro',      email: 'sofia@ejemplo.es',            role: 'CUSTOMER' as const },
];

// ─── 5 Restaurants (Andalucía) ───────────────────────────────

const RESTAURANTS = [
  {
    id: 'rest-001',
    name: 'Hamburguesería Sa Plaça',
    slug: 'hamburgueseria-sa-placa',
    description: 'Las mejores hamburguesas artesanales del pueblo.',
    imageUrl: '/placeholder-restaurant-1.jpg',
    cuisineType: 'hamburguesas',
    deliveryFeeEur: 2.00,
    minOrderEur: 10.00,
    deliveryRadiusKm: 5.0,
    lat: 37.3886,   // Sevilla
    lng: -5.9823,
    ownerId: 'user-owner-001',
    staffId: 'user-staff-001',
  },
  {
    id: 'rest-002',
    name: 'Casa Tradición',
    slug: 'casa-tradicion',
    description: 'Cocina tradicional andaluza con productos de la tierra.',
    imageUrl: '/placeholder-restaurant-2.jpg',
    cuisineType: 'tradicional',
    deliveryFeeEur: 1.50,
    minOrderEur: 12.00,
    deliveryRadiusKm: 4.0,
    lat: 36.7213,   // Málaga
    lng: -4.4214,
    ownerId: 'user-owner-002',
    staffId: 'user-staff-002',
  },
  {
    id: 'rest-003',
    name: 'Pizzería Forn Nou',
    slug: 'pizzeria-forn-nou',
    description: 'Pizza artesanal al horno de leña.',
    imageUrl: '/placeholder-restaurant-3.jpg',
    cuisineType: 'pizza',
    deliveryFeeEur: 2.50,
    minOrderEur: 8.00,
    deliveryRadiusKm: 6.0,
    lat: 36.8381,   // Córdoba
    lng: -4.7794,
    ownerId: 'user-owner-003',
    staffId: 'user-staff-003',
  },
  {
    id: 'rest-004',
    name: 'Pollos El Rincón',
    slug: 'pollos-el-rincon',
    description: 'Pollo asado y platos de pollo para toda la familia.',
    imageUrl: '/placeholder-restaurant-4.jpg',
    cuisineType: 'pollos',
    deliveryFeeEur: 1.00,
    minOrderEur: 8.00,
    deliveryRadiusKm: 3.5,
    lat: 36.5298,   // Cádiz
    lng: -6.2926,
    ownerId: 'user-owner-001',
    staffId: 'user-staff-001',
  },
  {
    id: 'rest-005',
    name: 'Kebab Alhambra',
    slug: 'kebab-alhambra',
    description: 'Kebabs, falafel y cocina mediterránea.',
    imageUrl: '/placeholder-restaurant-5.jpg',
    cuisineType: 'fast_food',
    deliveryFeeEur: 1.50,
    minOrderEur: 6.00,
    deliveryRadiusKm: 5.0,
    lat: 37.1773,   // Granada
    lng: -3.5986,
    ownerId: 'user-owner-002',
    staffId: 'user-staff-002',
  },
];

// Opening hours: Mon-Sun 12:00-16:00, 19:00-23:00
const STANDARD_HOURS = [0, 1, 2, 3, 4, 5, 6].flatMap((day) => [
  { dayOfWeek: day, openTime: '12:00', closeTime: '16:00' },
  { dayOfWeek: day, openTime: '19:00', closeTime: '23:00' },
]);


// ─── Categories per restaurant ───────────────────────────────

interface CategoryDef {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
}

const CATEGORIES: CategoryDef[] = [];
const CAT_MAP: Record<string, string[]> = {};

for (const rest of RESTAURANTS) {
  const cats = ['Entrantes', 'Principales', 'Bebidas', 'Postres'];
  const catIds: string[] = [];
  cats.forEach((name, i) => {
    const catId = `cat-${rest.id}-${i}`;
    catIds.push(catId);
    CATEGORIES.push({ id: catId, restaurantId: rest.id, name, sortOrder: i });
  });
  CAT_MAP[rest.id] = catIds;
}

// ─── Products (50+ total, 10-12 per restaurant) ─────────────

interface ProductDef {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceEur: number;
  imageUrl: string;
  allergenIds: number[];
}

const PRODUCTS: ProductDef[] = [];

function addProducts(restId: string, items: Omit<ProductDef, 'id'>[]) {
  items.forEach((item, i) => {
    PRODUCTS.push({ ...item, id: `prod-${restId}-${String(i).padStart(2, '0')}` });
  });
}

// Restaurant 1: Hamburguesería Sa Plaça
addProducts('rest-001', [
  { categoryId: CAT_MAP['rest-001'][0], name: 'Nachos con queso', description: 'Nachos crujientes con queso cheddar fundido', priceEur: 5.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
  { categoryId: CAT_MAP['rest-001'][0], name: 'Aros de cebolla', description: 'Aros de cebolla rebozados y crujientes', priceEur: 4.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3] },
  { categoryId: CAT_MAP['rest-001'][1], name: 'Burger Clásica', description: 'Hamburguesa de ternera con lechuga, tomate y cebolla', priceEur: 8.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7, 10, 11] },
  { categoryId: CAT_MAP['rest-001'][1], name: 'Burger BBQ', description: 'Hamburguesa con bacon, queso cheddar y salsa BBQ', priceEur: 10.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7, 10, 12] },
  { categoryId: CAT_MAP['rest-001'][1], name: 'Burger Vegana', description: 'Hamburguesa de garbanzos con aguacate', priceEur: 9.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 6] },
  { categoryId: CAT_MAP['rest-001'][1], name: 'Patatas fritas', description: 'Patatas fritas caseras con sal', priceEur: 3.50, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
  { categoryId: CAT_MAP['rest-001'][2], name: 'Coca-Cola', description: 'Coca-Cola 33cl', priceEur: 2.00, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
  { categoryId: CAT_MAP['rest-001'][2], name: 'Agua mineral', description: 'Agua mineral 50cl', priceEur: 1.50, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
  { categoryId: CAT_MAP['rest-001'][2], name: 'Cerveza artesana', description: 'Cerveza artesana local 33cl', priceEur: 3.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1] },
  { categoryId: CAT_MAP['rest-001'][3], name: 'Brownie de chocolate', description: 'Brownie casero con nueces', priceEur: 4.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7, 8] },
]);

// Restaurant 2: Casa Tradición
addProducts('rest-002', [
  { categoryId: CAT_MAP['rest-002'][0], name: 'Salmorejo cordobés', description: 'Salmorejo tradicional con jamón y huevo', priceEur: 6.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3] },
  { categoryId: CAT_MAP['rest-002'][0], name: 'Ensalada mixta', description: 'Ensalada fresca con tomate, lechuga y aceitunas', priceEur: 5.50, imageUrl: '/placeholder-product.jpg', allergenIds: [12] },
  { categoryId: CAT_MAP['rest-002'][1], name: 'Paella mixta', description: 'Paella de mariscos y pollo para 2 personas', priceEur: 12.00, imageUrl: '/placeholder-product.jpg', allergenIds: [2, 4, 14] },
  { categoryId: CAT_MAP['rest-002'][1], name: 'Rabo de toro', description: 'Rabo de toro estofado con verduras', priceEur: 14.00, imageUrl: '/placeholder-product.jpg', allergenIds: [9, 12] },
  { categoryId: CAT_MAP['rest-002'][1], name: 'Flamenquín cordobés', description: 'Flamenquín de jamón y queso', priceEur: 9.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7] },
  { categoryId: CAT_MAP['rest-002'][1], name: 'Pescaíto frito', description: 'Variado de pescado frito al estilo andaluz', priceEur: 11.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 4] },
  { categoryId: CAT_MAP['rest-002'][2], name: 'Tinto de verano', description: 'Tinto de verano con limón', priceEur: 2.50, imageUrl: '/placeholder-product.jpg', allergenIds: [12] },
  { categoryId: CAT_MAP['rest-002'][2], name: 'Zumo de naranja', description: 'Zumo de naranja natural', priceEur: 3.00, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
  { categoryId: CAT_MAP['rest-002'][3], name: 'Torrijas', description: 'Torrijas caseras con miel', priceEur: 4.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7] },
  { categoryId: CAT_MAP['rest-002'][3], name: 'Flan de huevo', description: 'Flan casero con caramelo', priceEur: 3.50, imageUrl: '/placeholder-product.jpg', allergenIds: [3, 7] },
]);

// Restaurant 3: Pizzería Forn Nou
addProducts('rest-003', [
  { categoryId: CAT_MAP['rest-003'][0], name: 'Bruschetta', description: 'Pan tostado con tomate, albahaca y aceite', priceEur: 5.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1] },
  { categoryId: CAT_MAP['rest-003'][0], name: 'Ensalada César', description: 'Ensalada con pollo, parmesano y croutons', priceEur: 7.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 4, 7] },
  { categoryId: CAT_MAP['rest-003'][1], name: 'Pizza Margarita', description: 'Tomate, mozzarella y albahaca', priceEur: 9.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
  { categoryId: CAT_MAP['rest-003'][1], name: 'Pizza Pepperoni', description: 'Tomate, mozzarella y pepperoni', priceEur: 10.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
  { categoryId: CAT_MAP['rest-003'][1], name: 'Pizza 4 Quesos', description: 'Mozzarella, gorgonzola, parmesano y emmental', priceEur: 11.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
  { categoryId: CAT_MAP['rest-003'][1], name: 'Pizza Vegetal', description: 'Tomate, mozzarella, pimientos, champiñones y aceitunas', priceEur: 9.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
  { categoryId: CAT_MAP['rest-003'][1], name: 'Calzone', description: 'Masa rellena de jamón, queso y champiñones', priceEur: 10.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7] },
  { categoryId: CAT_MAP['rest-003'][2], name: 'Refresco', description: 'Refresco a elegir 33cl', priceEur: 2.00, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
  { categoryId: CAT_MAP['rest-003'][2], name: 'Cerveza italiana', description: 'Peroni Nastro Azzurro 33cl', priceEur: 3.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1] },
  { categoryId: CAT_MAP['rest-003'][3], name: 'Tiramisú', description: 'Tiramisú casero con mascarpone', priceEur: 5.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7] },
  { categoryId: CAT_MAP['rest-003'][3], name: 'Panna cotta', description: 'Panna cotta con frutos rojos', priceEur: 4.50, imageUrl: '/placeholder-product.jpg', allergenIds: [7] },
]);

// Restaurant 4: Pollos El Rincón
addProducts('rest-004', [
  { categoryId: CAT_MAP['rest-004'][0], name: 'Alitas de pollo', description: 'Alitas de pollo crujientes con salsa', priceEur: 5.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3] },
  { categoryId: CAT_MAP['rest-004'][0], name: 'Croquetas de pollo', description: 'Croquetas caseras de pollo', priceEur: 4.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7] },
  { categoryId: CAT_MAP['rest-004'][1], name: 'Pollo asado entero', description: 'Pollo asado al horno con patatas', priceEur: 12.00, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
  { categoryId: CAT_MAP['rest-004'][1], name: 'Medio pollo asado', description: 'Medio pollo asado con ensalada', priceEur: 7.00, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
  { categoryId: CAT_MAP['rest-004'][1], name: 'Pollo al limón', description: 'Pechuga de pollo al limón con arroz', priceEur: 8.50, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
  { categoryId: CAT_MAP['rest-004'][1], name: 'Nuggets de pollo', description: '12 nuggets de pollo con patatas', priceEur: 6.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3] },
  { categoryId: CAT_MAP['rest-004'][2], name: 'Coca-Cola', description: 'Coca-Cola 33cl', priceEur: 1.80, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
  { categoryId: CAT_MAP['rest-004'][2], name: 'Agua', description: 'Agua mineral 50cl', priceEur: 1.20, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
  { categoryId: CAT_MAP['rest-004'][3], name: 'Helado de vainilla', description: 'Tarrina de helado de vainilla', priceEur: 3.00, imageUrl: '/placeholder-product.jpg', allergenIds: [3, 7] },
  { categoryId: CAT_MAP['rest-004'][3], name: 'Natillas', description: 'Natillas caseras', priceEur: 2.50, imageUrl: '/placeholder-product.jpg', allergenIds: [3, 7] },
]);

// Restaurant 5: Kebab Alhambra
addProducts('rest-005', [
  { categoryId: CAT_MAP['rest-005'][0], name: 'Hummus', description: 'Hummus casero con pan de pita', priceEur: 4.50, imageUrl: '/placeholder-product.jpg', allergenIds: [11] },
  { categoryId: CAT_MAP['rest-005'][0], name: 'Falafel (6 uds)', description: 'Falafel de garbanzos con salsa tahini', priceEur: 5.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 11] },
  { categoryId: CAT_MAP['rest-005'][1], name: 'Kebab de pollo', description: 'Kebab de pollo con verduras y salsa yogur', priceEur: 6.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
  { categoryId: CAT_MAP['rest-005'][1], name: 'Kebab mixto', description: 'Kebab de pollo y ternera con ensalada', priceEur: 7.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
  { categoryId: CAT_MAP['rest-005'][1], name: 'Durum de falafel', description: 'Wrap de falafel con verduras y tahini', priceEur: 6.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 11] },
  { categoryId: CAT_MAP['rest-005'][1], name: 'Plato kebab', description: 'Plato de kebab con arroz, ensalada y salsas', priceEur: 9.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
  { categoryId: CAT_MAP['rest-005'][1], name: 'Shawarma de ternera', description: 'Shawarma de ternera con patatas', priceEur: 8.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
  { categoryId: CAT_MAP['rest-005'][2], name: 'Ayran', description: 'Bebida de yogur tradicional', priceEur: 2.00, imageUrl: '/placeholder-product.jpg', allergenIds: [7] },
  { categoryId: CAT_MAP['rest-005'][2], name: 'Té moruno', description: 'Té verde con hierbabuena', priceEur: 2.50, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
  { categoryId: CAT_MAP['rest-005'][3], name: 'Baklava', description: 'Pastel de hojaldre con pistachos y miel', priceEur: 3.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 8] },
  { categoryId: CAT_MAP['rest-005'][3], name: 'Kunafa', description: 'Postre de queso con fideos kataifi', priceEur: 4.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7, 8] },
]);


// ─── 10 Addresses (Andalucía lat/lng) ────────────────────────

const ADDRESSES = [
  { id: 'addr-001', userId: 'user-cust-001', label: 'Casa', street: 'C/ Sierpes 12', municipality: 'Sevilla', city: 'Sevilla', postalCode: '41004', floorDoor: '3ºB', lat: 37.3891, lng: -5.9945 },
  { id: 'addr-002', userId: 'user-cust-001', label: 'Trabajo', street: 'Av. de la Constitución 5', municipality: 'Sevilla', city: 'Sevilla', postalCode: '41001', floorDoor: null, lat: 37.3862, lng: -5.9927 },
  { id: 'addr-003', userId: 'user-cust-002', label: 'Casa', street: 'C/ Larios 8', municipality: 'Málaga', city: 'Málaga', postalCode: '29015', floorDoor: '2ºA', lat: 36.7196, lng: -4.4200 },
  { id: 'addr-004', userId: 'user-cust-002', label: null, street: 'Paseo del Parque 3', municipality: 'Málaga', city: 'Málaga', postalCode: '29015', floorDoor: null, lat: 36.7178, lng: -4.4163 },
  { id: 'addr-005', userId: 'user-cust-003', label: 'Casa', street: 'C/ Gondomar 1', municipality: 'Córdoba', city: 'Córdoba', postalCode: '14003', floorDoor: '1ºC', lat: 36.8400, lng: -4.7790 },
  { id: 'addr-006', userId: 'user-cust-003', label: null, street: 'Av. Gran Capitán 15', municipality: 'Córdoba', city: 'Córdoba', postalCode: '14008', floorDoor: null, lat: 36.8395, lng: -4.7830 },
  { id: 'addr-007', userId: 'user-cust-004', label: 'Casa', street: 'C/ Ancha 22', municipality: 'Cádiz', city: 'Cádiz', postalCode: '11001', floorDoor: 'Bajo', lat: 36.5310, lng: -6.2930 },
  { id: 'addr-008', userId: 'user-cust-004', label: null, street: 'Plaza de San Juan de Dios 4', municipality: 'Cádiz', city: 'Cádiz', postalCode: '11005', floorDoor: null, lat: 36.5290, lng: -6.2920 },
  { id: 'addr-009', userId: 'user-cust-005', label: 'Casa', street: 'C/ Reyes Católicos 10', municipality: 'Granada', city: 'Granada', postalCode: '18009', floorDoor: '4ºD', lat: 37.1760, lng: -3.5990 },
  { id: 'addr-010', userId: 'user-cust-005', label: 'Universidad', street: 'Av. del Hospicio 1', municipality: 'Granada', city: 'Granada', postalCode: '18010', floorDoor: null, lat: 37.1780, lng: -3.5970 },
];

// ─── 12 Orders (6 ASAP + 6 SCHEDULED) ───────────────────────

type OrderStatusType = 'PLACED' | 'ACCEPTED' | 'REJECTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

interface OrderDef {
  id: string;
  userId: string;
  restaurantId: string;
  addressId: string;
  phone: string;
  fulfillmentType: 'ASAP' | 'SCHEDULED';
  scheduledFor: Date | null;
  subtotalEur: number;
  deliveryFeeEur: number;
  totalEur: number;
  currentStatus: OrderStatusType;
  idempotencyKey: string;
  items: { productId: string; productName: string; productPriceEur: number; quantity: number }[];
  statusHistory: { fromStatus: OrderStatusType | null; toStatus: OrderStatusType; changedByUserId: string; minutesAfterCreation: number }[];
}

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);

const ORDERS: OrderDef[] = [
  // ASAP orders
  {
    id: 'order-001', userId: 'user-cust-001', restaurantId: 'rest-001', addressId: 'addr-001',
    phone: '+34612345001', fulfillmentType: 'ASAP', scheduledFor: null,
    subtotalEur: 20.50, deliveryFeeEur: 2.00, totalEur: 22.50, currentStatus: 'DELIVERED',
    idempotencyKey: 'idem-001',
    items: [
      { productId: 'prod-rest-001-02', productName: 'Burger Clásica', productPriceEur: 8.50, quantity: 2 },
      { productId: 'prod-rest-001-05', productName: 'Patatas fritas', productPriceEur: 3.50, quantity: 1 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserId: 'user-cust-001', minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserId: 'user-owner-001', minutesAfterCreation: 2 },
      { fromStatus: 'ACCEPTED', toStatus: 'PREPARING', changedByUserId: 'user-owner-001', minutesAfterCreation: 5 },
      { fromStatus: 'PREPARING', toStatus: 'READY_FOR_PICKUP', changedByUserId: 'user-staff-001', minutesAfterCreation: 25 },
      { fromStatus: 'READY_FOR_PICKUP', toStatus: 'OUT_FOR_DELIVERY', changedByUserId: 'user-staff-001', minutesAfterCreation: 28 },
      { fromStatus: 'OUT_FOR_DELIVERY', toStatus: 'DELIVERED', changedByUserId: 'user-staff-001', minutesAfterCreation: 38 },
    ],
  },
  {
    id: 'order-002', userId: 'user-cust-002', restaurantId: 'rest-002', addressId: 'addr-003',
    phone: '+34612345002', fulfillmentType: 'ASAP', scheduledFor: null,
    subtotalEur: 18.50, deliveryFeeEur: 1.50, totalEur: 20.00, currentStatus: 'REJECTED',
    idempotencyKey: 'idem-002',
    items: [
      { productId: 'prod-rest-002-02', productName: 'Paella mixta', productPriceEur: 12.00, quantity: 1 },
      { productId: 'prod-rest-002-01', productName: 'Ensalada mixta', productPriceEur: 5.50, quantity: 1 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserId: 'user-cust-002', minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'REJECTED', changedByUserId: 'user-owner-002', minutesAfterCreation: 5 },
    ],
  },
  {
    id: 'order-003', userId: 'user-cust-003', restaurantId: 'rest-003', addressId: 'addr-005',
    phone: '+34612345003', fulfillmentType: 'ASAP', scheduledFor: null,
    subtotalEur: 19.50, deliveryFeeEur: 2.50, totalEur: 22.00, currentStatus: 'PREPARING',
    idempotencyKey: 'idem-003',
    items: [
      { productId: 'prod-rest-003-02', productName: 'Pizza Margarita', productPriceEur: 9.00, quantity: 1 },
      { productId: 'prod-rest-003-03', productName: 'Pizza Pepperoni', productPriceEur: 10.50, quantity: 1 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserId: 'user-cust-003', minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserId: 'user-owner-003', minutesAfterCreation: 3 },
      { fromStatus: 'ACCEPTED', toStatus: 'PREPARING', changedByUserId: 'user-owner-003', minutesAfterCreation: 5 },
    ],
  },
  {
    id: 'order-004', userId: 'user-cust-001', restaurantId: 'rest-004', addressId: 'addr-002',
    phone: '+34612345001', fulfillmentType: 'ASAP', scheduledFor: null,
    subtotalEur: 12.00, deliveryFeeEur: 1.00, totalEur: 13.00, currentStatus: 'OUT_FOR_DELIVERY',
    idempotencyKey: 'idem-004',
    items: [
      { productId: 'prod-rest-004-02', productName: 'Pollo asado entero', productPriceEur: 12.00, quantity: 1 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserId: 'user-cust-001', minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserId: 'user-owner-001', minutesAfterCreation: 1 },
      { fromStatus: 'ACCEPTED', toStatus: 'PREPARING', changedByUserId: 'user-owner-001', minutesAfterCreation: 3 },
      { fromStatus: 'PREPARING', toStatus: 'READY_FOR_PICKUP', changedByUserId: 'user-staff-001', minutesAfterCreation: 20 },
      { fromStatus: 'READY_FOR_PICKUP', toStatus: 'OUT_FOR_DELIVERY', changedByUserId: 'user-staff-001', minutesAfterCreation: 22 },
    ],
  },
  {
    id: 'order-005', userId: 'user-cust-004', restaurantId: 'rest-005', addressId: 'addr-007',
    phone: '+34612345004', fulfillmentType: 'ASAP', scheduledFor: null,
    subtotalEur: 13.00, deliveryFeeEur: 1.50, totalEur: 14.50, currentStatus: 'CANCELLED',
    idempotencyKey: 'idem-005',
    items: [
      { productId: 'prod-rest-005-02', productName: 'Kebab de pollo', productPriceEur: 6.50, quantity: 2 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserId: 'user-cust-004', minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'CANCELLED', changedByUserId: 'user-cust-004', minutesAfterCreation: 2 },
    ],
  },
  {
    id: 'order-006', userId: 'user-cust-005', restaurantId: 'rest-001', addressId: 'addr-009',
    phone: '+34612345005', fulfillmentType: 'ASAP', scheduledFor: null,
    subtotalEur: 17.00, deliveryFeeEur: 2.00, totalEur: 19.00, currentStatus: 'DELIVERED',
    idempotencyKey: 'idem-006',
    items: [
      { productId: 'prod-rest-001-03', productName: 'Burger BBQ', productPriceEur: 10.00, quantity: 1 },
      { productId: 'prod-rest-001-04', productName: 'Burger Vegana', productPriceEur: 9.00, quantity: 1 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserId: 'user-cust-005', minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserId: 'user-owner-001', minutesAfterCreation: 1 },
      { fromStatus: 'ACCEPTED', toStatus: 'PREPARING', changedByUserId: 'user-owner-001', minutesAfterCreation: 3 },
      { fromStatus: 'PREPARING', toStatus: 'READY_FOR_PICKUP', changedByUserId: 'user-staff-001', minutesAfterCreation: 22 },
      { fromStatus: 'READY_FOR_PICKUP', toStatus: 'OUT_FOR_DELIVERY', changedByUserId: 'user-staff-001', minutesAfterCreation: 25 },
      { fromStatus: 'OUT_FOR_DELIVERY', toStatus: 'DELIVERED', changedByUserId: 'user-staff-001', minutesAfterCreation: 35 },
    ],
  },
  // SCHEDULED orders
  {
    id: 'order-007', userId: 'user-cust-001', restaurantId: 'rest-002', addressId: 'addr-001',
    phone: '+34612345001', fulfillmentType: 'SCHEDULED', scheduledFor: hoursFromNow(3),
    subtotalEur: 23.50, deliveryFeeEur: 1.50, totalEur: 25.00, currentStatus: 'ACCEPTED',
    idempotencyKey: 'idem-007',
    items: [
      { productId: 'prod-rest-002-03', productName: 'Rabo de toro', productPriceEur: 14.00, quantity: 1 },
      { productId: 'prod-rest-002-04', productName: 'Flamenquín cordobés', productPriceEur: 9.50, quantity: 1 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserId: 'user-cust-001', minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserId: 'user-owner-002', minutesAfterCreation: 10 },
    ],
  },
  {
    id: 'order-008', userId: 'user-cust-002', restaurantId: 'rest-003', addressId: 'addr-004',
    phone: '+34612345002', fulfillmentType: 'SCHEDULED', scheduledFor: hoursFromNow(1),
    subtotalEur: 20.50, deliveryFeeEur: 2.50, totalEur: 23.00, currentStatus: 'PREPARING',
    idempotencyKey: 'idem-008',
    items: [
      { productId: 'prod-rest-003-04', productName: 'Pizza 4 Quesos', productPriceEur: 11.00, quantity: 1 },
      { productId: 'prod-rest-003-05', productName: 'Pizza Vegetal', productPriceEur: 9.50, quantity: 1 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserId: 'user-cust-002', minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserId: 'user-owner-003', minutesAfterCreation: 5 },
      { fromStatus: 'ACCEPTED', toStatus: 'PREPARING', changedByUserId: 'user-owner-003', minutesAfterCreation: 15 },
    ],
  },
  {
    id: 'order-009', userId: 'user-cust-003', restaurantId: 'rest-001', addressId: 'addr-006',
    phone: '+34612345003', fulfillmentType: 'SCHEDULED', scheduledFor: hoursFromNow(5),
    subtotalEur: 14.00, deliveryFeeEur: 2.00, totalEur: 16.00, currentStatus: 'PLACED',
    idempotencyKey: 'idem-009',
    items: [
      { productId: 'prod-rest-001-00', productName: 'Nachos con queso', productPriceEur: 5.50, quantity: 1 },
      { productId: 'prod-rest-001-02', productName: 'Burger Clásica', productPriceEur: 8.50, quantity: 1 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserId: 'user-cust-003', minutesAfterCreation: 0 },
    ],
  },
  {
    id: 'order-010', userId: 'user-cust-004', restaurantId: 'rest-004', addressId: 'addr-008',
    phone: '+34612345004', fulfillmentType: 'SCHEDULED', scheduledFor: hoursAgo(1),
    subtotalEur: 19.00, deliveryFeeEur: 1.00, totalEur: 20.00, currentStatus: 'DELIVERED',
    idempotencyKey: 'idem-010',
    items: [
      { productId: 'prod-rest-004-02', productName: 'Pollo asado entero', productPriceEur: 12.00, quantity: 1 },
      { productId: 'prod-rest-004-03', productName: 'Medio pollo asado', productPriceEur: 7.00, quantity: 1 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserId: 'user-cust-004', minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserId: 'user-owner-001', minutesAfterCreation: 5 },
      { fromStatus: 'ACCEPTED', toStatus: 'PREPARING', changedByUserId: 'user-owner-001', minutesAfterCreation: 30 },
      { fromStatus: 'PREPARING', toStatus: 'READY_FOR_PICKUP', changedByUserId: 'user-staff-001', minutesAfterCreation: 50 },
      { fromStatus: 'READY_FOR_PICKUP', toStatus: 'OUT_FOR_DELIVERY', changedByUserId: 'user-staff-001', minutesAfterCreation: 55 },
      { fromStatus: 'OUT_FOR_DELIVERY', toStatus: 'DELIVERED', changedByUserId: 'user-staff-001', minutesAfterCreation: 65 },
    ],
  },
  {
    id: 'order-011', userId: 'user-cust-005', restaurantId: 'rest-005', addressId: 'addr-010',
    phone: '+34612345005', fulfillmentType: 'SCHEDULED', scheduledFor: hoursFromNow(2),
    subtotalEur: 15.50, deliveryFeeEur: 1.50, totalEur: 17.00, currentStatus: 'ACCEPTED',
    idempotencyKey: 'idem-011',
    items: [
      { productId: 'prod-rest-005-03', productName: 'Kebab mixto', productPriceEur: 7.50, quantity: 1 },
      { productId: 'prod-rest-005-05', productName: 'Plato kebab', productPriceEur: 9.00, quantity: 1 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserId: 'user-cust-005', minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserId: 'user-owner-002', minutesAfterCreation: 8 },
    ],
  },
  {
    id: 'order-012', userId: 'user-cust-002', restaurantId: 'rest-001', addressId: 'addr-003',
    phone: '+34612345002', fulfillmentType: 'SCHEDULED', scheduledFor: hoursFromNow(4),
    subtotalEur: 13.50, deliveryFeeEur: 2.00, totalEur: 15.50, currentStatus: 'PLACED',
    idempotencyKey: 'idem-012',
    items: [
      { productId: 'prod-rest-001-01', productName: 'Aros de cebolla', productPriceEur: 4.50, quantity: 1 },
      { productId: 'prod-rest-001-04', productName: 'Burger Vegana', productPriceEur: 9.00, quantity: 1 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserId: 'user-cust-002', minutesAfterCreation: 0 },
    ],
  },
];


// ─── Main seed function ──────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Allergens
  console.log('  → Seeding 14 EU allergens...');
  for (const allergen of EU_ALLERGENS) {
    await prisma.allergen.upsert({
      where: { id: allergen.id },
      update: allergen,
      create: allergen,
    });
  }

  // 2. Users
  console.log('  → Seeding 12 users...');
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: PASSWORD_HASH,
        role: user.role,
        emailVerified: new Date(),
      },
    });
  }

  // 3. Restaurants
  console.log('  → Seeding 5 restaurants...');
  for (const rest of RESTAURANTS) {
    await prisma.restaurant.upsert({
      where: { id: rest.id },
      update: {},
      create: {
        id: rest.id,
        name: rest.name,
        slug: rest.slug,
        description: rest.description,
        imageUrl: rest.imageUrl,
        cuisineType: rest.cuisineType,
        deliveryFeeEur: rest.deliveryFeeEur,
        minOrderEur: rest.minOrderEur,
        deliveryRadiusKm: rest.deliveryRadiusKm,
        lat: rest.lat,
        lng: rest.lng,
        isActive: true,
      },
    });

    // Opening hours
    const existingHours = await prisma.openingHour.count({ where: { restaurantId: rest.id } });
    if (existingHours === 0) {
      await prisma.openingHour.createMany({
        data: STANDARD_HOURS.map((h) => ({
          restaurantId: rest.id,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
        })),
      });
    }

    // Delivery zone
    const existingZones = await prisma.deliveryZone.count({ where: { restaurantId: rest.id } });
    if (existingZones === 0) {
      await prisma.deliveryZone.create({
        data: {
          restaurantId: rest.id,
          radiusKm: rest.deliveryRadiusKm,
          lat: rest.lat,
          lng: rest.lng,
        },
      });
    }

    // Restaurant users (owner + staff)
    await prisma.restaurantUser.upsert({
      where: { userId_restaurantId: { userId: rest.ownerId, restaurantId: rest.id } },
      update: {},
      create: { userId: rest.ownerId, restaurantId: rest.id, role: 'OWNER' },
    });
    await prisma.restaurantUser.upsert({
      where: { userId_restaurantId: { userId: rest.staffId, restaurantId: rest.id } },
      update: {},
      create: { userId: rest.staffId, restaurantId: rest.id, role: 'STAFF' },
    });
  }

  // 4. Categories
  console.log('  → Seeding categories...');
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: cat,
    });
  }

  // 5. Products + allergens
  console.log(`  → Seeding ${PRODUCTS.length} products...`);
  for (const prod of PRODUCTS) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: {},
      create: {
        id: prod.id,
        categoryId: prod.categoryId,
        name: prod.name,
        description: prod.description,
        priceEur: prod.priceEur,
        imageUrl: prod.imageUrl,
        isAvailable: true,
      },
    });

    // Product allergens
    for (const allergenId of prod.allergenIds) {
      const existing = await prisma.productAllergen.findFirst({
        where: { productId: prod.id, allergenId },
      });
      if (!existing) {
        await prisma.productAllergen.create({
          data: { productId: prod.id, allergenId },
        });
      }
    }
  }

  // 6. Addresses
  console.log('  → Seeding 10 addresses...');
  for (const addr of ADDRESSES) {
    await prisma.address.upsert({
      where: { id: addr.id },
      update: {},
      create: addr,
    });
  }

  // 7. Orders
  console.log('  → Seeding 12 orders...');
  for (const order of ORDERS) {
    const createdAt = hoursAgo(Math.floor(Math.random() * 48) + 1);

    const existingOrder = await prisma.order.findUnique({ where: { id: order.id } });
    if (existingOrder) continue;

    await prisma.order.create({
      data: {
        id: order.id,
        userId: order.userId,
        restaurantId: order.restaurantId,
        addressId: order.addressId,
        phone: order.phone,
        fulfillmentType: order.fulfillmentType,
        scheduledFor: order.scheduledFor,
        subtotalEur: order.subtotalEur,
        deliveryFeeEur: order.deliveryFeeEur,
        totalEur: order.totalEur,
        currentStatus: order.currentStatus,
        idempotencyKey: order.idempotencyKey,
        createdAt,
      },
    });

    // Order items
    for (const item of order.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          productPriceEur: item.productPriceEur,
          quantity: item.quantity,
        },
      });
    }

    // Status history
    for (const sh of order.statusHistory) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: sh.fromStatus,
          toStatus: sh.toStatus,
          changedByUserId: sh.changedByUserId,
          createdAt: new Date(createdAt.getTime() + sh.minutesAfterCreation * 60 * 1000),
        },
      });
    }
  }

  console.log('✅ Seed completed successfully!');
  console.log(`   - ${EU_ALLERGENS.length} allergens`);
  console.log(`   - ${USERS.length} users`);
  console.log(`   - ${RESTAURANTS.length} restaurants`);
  console.log(`   - ${CATEGORIES.length} categories`);
  console.log(`   - ${PRODUCTS.length} products`);
  console.log(`   - ${ADDRESSES.length} addresses`);
  console.log(`   - ${ORDERS.length} orders`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
