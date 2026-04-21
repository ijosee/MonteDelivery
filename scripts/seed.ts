// scripts/seed.ts — Pueblo Delivery Marketplace seed data (Supabase)
// Requisitos: 13.1, 13.2, 13.3, 13.4

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ─── 14 EU Allergens (Reglamento UE 1169/2011) ──────────────

const EU_ALLERGENS = [
  { id: 1,  code: 'GLUTEN',       nameEs: 'Gluten',                      icon: 'gluten.svg' },
  { id: 2,  code: 'CRUSTACEANS',  nameEs: 'Crustáceos',                  icon: 'crustaceans.svg' },
  { id: 3,  code: 'EGGS',         nameEs: 'Huevos',                      icon: 'eggs.svg' },
  { id: 4,  code: 'FISH',         nameEs: 'Pescado',                     icon: 'fish.svg' },
  { id: 5,  code: 'PEANUTS',      nameEs: 'Cacahuetes',                  icon: 'peanuts.svg' },
  { id: 6,  code: 'SOY',          nameEs: 'Soja',                        icon: 'soy.svg' },
  { id: 7,  code: 'DAIRY',        nameEs: 'Lácteos',                     icon: 'dairy.svg' },
  { id: 8,  code: 'TREE_NUTS',    nameEs: 'Frutos de cáscara',           icon: 'tree-nuts.svg' },
  { id: 9,  code: 'CELERY',       nameEs: 'Apio',                        icon: 'celery.svg' },
  { id: 10, code: 'MUSTARD',      nameEs: 'Mostaza',                     icon: 'mustard.svg' },
  { id: 11, code: 'SESAME',       nameEs: 'Sésamo',                      icon: 'sesame.svg' },
  { id: 12, code: 'SULPHITES',    nameEs: 'Dióxido de azufre/Sulfitos',  icon: 'sulphites.svg' },
  { id: 13, code: 'LUPIN',        nameEs: 'Altramuces',                  icon: 'lupin.svg' },
  { id: 14, code: 'MOLLUSCS',     nameEs: 'Moluscos',                    icon: 'molluscs.svg' },
];

// ─── 12 Users ────────────────────────────────────────────────

const USERS = [
  // 1 Admin
  { name: 'Admin Pueblo',       email: 'admin@pueblodelivery.es',     role: 'ADMIN' as const },
  // 3 Restaurant Owners
  { name: 'María García',       email: 'maria@saplaca.es',             role: 'RESTAURANT_OWNER' as const },
  { name: 'Antonio López',      email: 'antonio@casatradicion.es',    role: 'RESTAURANT_OWNER' as const },
  { name: 'Carmen Ruiz',        email: 'carmen@pizzeriaforn.es',      role: 'RESTAURANT_OWNER' as const },
  // 3 Restaurant Staff
  { name: 'Pedro Martínez',     email: 'pedro@saplaca.es',            role: 'RESTAURANT_STAFF' as const },
  { name: 'Laura Fernández',    email: 'laura@casatradicion.es',      role: 'RESTAURANT_STAFF' as const },
  { name: 'Javier Sánchez',     email: 'javier@pizzeriaforn.es',      role: 'RESTAURANT_STAFF' as const },
  // 5 Customers
  { name: 'Ana Moreno',         email: 'ana@ejemplo.es',              role: 'CUSTOMER' as const },
  { name: 'Carlos Díaz',        email: 'carlos@ejemplo.es',           role: 'CUSTOMER' as const },
  { name: 'Elena Torres',       email: 'elena@ejemplo.es',            role: 'CUSTOMER' as const },
  { name: 'Miguel Romero',      email: 'miguel@ejemplo.es',           role: 'CUSTOMER' as const },
  { name: 'Sofía Navarro',      email: 'sofia@ejemplo.es',            role: 'CUSTOMER' as const },
];

// ─── 5 Restaurants (Andalucía) ───────────────────────────────

const RESTAURANTS = [
  {
    name: 'Hamburguesería Sa Plaça',
    slug: 'hamburgueseria-sa-placa',
    description: 'Las mejores hamburguesas artesanales del pueblo.',
    imageUrl: '/placeholder-restaurant-1.jpg',
    cuisineType: 'hamburguesas',
    deliveryFeeEur: 2.00,
    minOrderEur: 10.00,
    deliveryRadiusKm: 5.0,
    lat: 37.3886,
    lng: -5.9823,
    ownerIdx: 1, // index into createdUserIds
    staffIdx: 4,
  },
  {
    name: 'Casa Tradición',
    slug: 'casa-tradicion',
    description: 'Cocina tradicional andaluza con productos de la tierra.',
    imageUrl: '/placeholder-restaurant-2.jpg',
    cuisineType: 'tradicional',
    deliveryFeeEur: 1.50,
    minOrderEur: 12.00,
    deliveryRadiusKm: 4.0,
    lat: 36.7213,
    lng: -4.4214,
    ownerIdx: 2,
    staffIdx: 5,
  },
  {
    name: 'Pizzería Forn Nou',
    slug: 'pizzeria-forn-nou',
    description: 'Pizza artesanal al horno de leña.',
    imageUrl: '/placeholder-restaurant-3.jpg',
    cuisineType: 'pizza',
    deliveryFeeEur: 2.50,
    minOrderEur: 8.00,
    deliveryRadiusKm: 6.0,
    lat: 36.8381,
    lng: -4.7794,
    ownerIdx: 3,
    staffIdx: 6,
  },
  {
    name: 'Pollos El Rincón',
    slug: 'pollos-el-rincon',
    description: 'Pollo asado y platos de pollo para toda la familia.',
    imageUrl: '/placeholder-restaurant-4.jpg',
    cuisineType: 'pollos',
    deliveryFeeEur: 1.00,
    minOrderEur: 8.00,
    deliveryRadiusKm: 3.5,
    lat: 36.5298,
    lng: -6.2926,
    ownerIdx: 1,
    staffIdx: 4,
  },
  {
    name: 'Kebab Alhambra',
    slug: 'kebab-alhambra',
    description: 'Kebabs, falafel y cocina mediterránea.',
    imageUrl: '/placeholder-restaurant-5.jpg',
    cuisineType: 'fast_food',
    deliveryFeeEur: 1.50,
    minOrderEur: 6.00,
    deliveryRadiusKm: 5.0,
    lat: 37.1773,
    lng: -3.5986,
    ownerIdx: 2,
    staffIdx: 5,
  },
];

// Opening hours: Mon-Sun 12:00-16:00, 19:00-23:00
const STANDARD_HOURS = [0, 1, 2, 3, 4, 5, 6].flatMap((day) => [
  { dayOfWeek: day, openTime: '12:00', closeTime: '16:00' },
  { dayOfWeek: day, openTime: '19:00', closeTime: '23:00' },
]);


// ─── Products (50+ total, 10-12 per restaurant) ─────────────

interface ProductDef {
  categoryName: string;
  name: string;
  description: string;
  priceEur: number;
  imageUrl: string;
  allergenIds: number[];
}

const PRODUCTS_BY_RESTAURANT: Record<number, ProductDef[]> = {
  0: [ // Hamburguesería Sa Plaça
    { categoryName: 'Entrantes', name: 'Nachos con queso', description: 'Nachos crujientes con queso cheddar fundido', priceEur: 5.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
    { categoryName: 'Entrantes', name: 'Aros de cebolla', description: 'Aros de cebolla rebozados y crujientes', priceEur: 4.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3] },
    { categoryName: 'Principales', name: 'Burger Clásica', description: 'Hamburguesa de ternera con lechuga, tomate y cebolla', priceEur: 8.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7, 10, 11] },
    { categoryName: 'Principales', name: 'Burger BBQ', description: 'Hamburguesa con bacon, queso cheddar y salsa BBQ', priceEur: 10.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7, 10, 12] },
    { categoryName: 'Principales', name: 'Burger Vegana', description: 'Hamburguesa de garbanzos con aguacate', priceEur: 9.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 6] },
    { categoryName: 'Principales', name: 'Patatas fritas', description: 'Patatas fritas caseras con sal', priceEur: 3.50, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
    { categoryName: 'Bebidas', name: 'Coca-Cola', description: 'Coca-Cola 33cl', priceEur: 2.00, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
    { categoryName: 'Bebidas', name: 'Agua mineral', description: 'Agua mineral 50cl', priceEur: 1.50, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
    { categoryName: 'Bebidas', name: 'Cerveza artesana', description: 'Cerveza artesana local 33cl', priceEur: 3.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1] },
    { categoryName: 'Postres', name: 'Brownie de chocolate', description: 'Brownie casero con nueces', priceEur: 4.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7, 8] },
  ],
  1: [ // Casa Tradición
    { categoryName: 'Entrantes', name: 'Salmorejo cordobés', description: 'Salmorejo tradicional con jamón y huevo', priceEur: 6.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3] },
    { categoryName: 'Entrantes', name: 'Ensalada mixta', description: 'Ensalada fresca con tomate, lechuga y aceitunas', priceEur: 5.50, imageUrl: '/placeholder-product.jpg', allergenIds: [12] },
    { categoryName: 'Principales', name: 'Paella mixta', description: 'Paella de mariscos y pollo para 2 personas', priceEur: 12.00, imageUrl: '/placeholder-product.jpg', allergenIds: [2, 4, 14] },
    { categoryName: 'Principales', name: 'Rabo de toro', description: 'Rabo de toro estofado con verduras', priceEur: 14.00, imageUrl: '/placeholder-product.jpg', allergenIds: [9, 12] },
    { categoryName: 'Principales', name: 'Flamenquín cordobés', description: 'Flamenquín de jamón y queso', priceEur: 9.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7] },
    { categoryName: 'Principales', name: 'Pescaíto frito', description: 'Variado de pescado frito al estilo andaluz', priceEur: 11.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 4] },
    { categoryName: 'Bebidas', name: 'Tinto de verano', description: 'Tinto de verano con limón', priceEur: 2.50, imageUrl: '/placeholder-product.jpg', allergenIds: [12] },
    { categoryName: 'Bebidas', name: 'Zumo de naranja', description: 'Zumo de naranja natural', priceEur: 3.00, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
    { categoryName: 'Postres', name: 'Torrijas', description: 'Torrijas caseras con miel', priceEur: 4.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7] },
    { categoryName: 'Postres', name: 'Flan de huevo', description: 'Flan casero con caramelo', priceEur: 3.50, imageUrl: '/placeholder-product.jpg', allergenIds: [3, 7] },
  ],
  2: [ // Pizzería Forn Nou
    { categoryName: 'Entrantes', name: 'Bruschetta', description: 'Pan tostado con tomate, albahaca y aceite', priceEur: 5.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1] },
    { categoryName: 'Entrantes', name: 'Ensalada César', description: 'Ensalada con pollo, parmesano y croutons', priceEur: 7.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 4, 7] },
    { categoryName: 'Principales', name: 'Pizza Margarita', description: 'Tomate, mozzarella y albahaca', priceEur: 9.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
    { categoryName: 'Principales', name: 'Pizza Pepperoni', description: 'Tomate, mozzarella y pepperoni', priceEur: 10.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
    { categoryName: 'Principales', name: 'Pizza 4 Quesos', description: 'Mozzarella, gorgonzola, parmesano y emmental', priceEur: 11.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
    { categoryName: 'Principales', name: 'Pizza Vegetal', description: 'Tomate, mozzarella, pimientos, champiñones y aceitunas', priceEur: 9.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
    { categoryName: 'Principales', name: 'Calzone', description: 'Masa rellena de jamón, queso y champiñones', priceEur: 10.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7] },
    { categoryName: 'Bebidas', name: 'Refresco', description: 'Refresco a elegir 33cl', priceEur: 2.00, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
    { categoryName: 'Bebidas', name: 'Cerveza italiana', description: 'Peroni Nastro Azzurro 33cl', priceEur: 3.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1] },
    { categoryName: 'Postres', name: 'Tiramisú', description: 'Tiramisú casero con mascarpone', priceEur: 5.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7] },
    { categoryName: 'Postres', name: 'Panna cotta', description: 'Panna cotta con frutos rojos', priceEur: 4.50, imageUrl: '/placeholder-product.jpg', allergenIds: [7] },
  ],
  3: [ // Pollos El Rincón
    { categoryName: 'Entrantes', name: 'Alitas de pollo', description: 'Alitas de pollo crujientes con salsa', priceEur: 5.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3] },
    { categoryName: 'Entrantes', name: 'Croquetas de pollo', description: 'Croquetas caseras de pollo', priceEur: 4.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3, 7] },
    { categoryName: 'Principales', name: 'Pollo asado entero', description: 'Pollo asado al horno con patatas', priceEur: 12.00, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
    { categoryName: 'Principales', name: 'Medio pollo asado', description: 'Medio pollo asado con ensalada', priceEur: 7.00, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
    { categoryName: 'Principales', name: 'Pollo al limón', description: 'Pechuga de pollo al limón con arroz', priceEur: 8.50, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
    { categoryName: 'Principales', name: 'Nuggets de pollo', description: '12 nuggets de pollo con patatas', priceEur: 6.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 3] },
    { categoryName: 'Bebidas', name: 'Coca-Cola', description: 'Coca-Cola 33cl', priceEur: 1.80, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
    { categoryName: 'Bebidas', name: 'Agua', description: 'Agua mineral 50cl', priceEur: 1.20, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
    { categoryName: 'Postres', name: 'Helado de vainilla', description: 'Tarrina de helado de vainilla', priceEur: 3.00, imageUrl: '/placeholder-product.jpg', allergenIds: [3, 7] },
    { categoryName: 'Postres', name: 'Natillas', description: 'Natillas caseras', priceEur: 2.50, imageUrl: '/placeholder-product.jpg', allergenIds: [3, 7] },
  ],
  4: [ // Kebab Alhambra
    { categoryName: 'Entrantes', name: 'Hummus', description: 'Hummus casero con pan de pita', priceEur: 4.50, imageUrl: '/placeholder-product.jpg', allergenIds: [11] },
    { categoryName: 'Entrantes', name: 'Falafel (6 uds)', description: 'Falafel de garbanzos con salsa tahini', priceEur: 5.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 11] },
    { categoryName: 'Principales', name: 'Kebab de pollo', description: 'Kebab de pollo con verduras y salsa yogur', priceEur: 6.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
    { categoryName: 'Principales', name: 'Kebab mixto', description: 'Kebab de pollo y ternera con ensalada', priceEur: 7.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
    { categoryName: 'Principales', name: 'Durum de falafel', description: 'Wrap de falafel con verduras y tahini', priceEur: 6.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 11] },
    { categoryName: 'Principales', name: 'Plato kebab', description: 'Plato de kebab con arroz, ensalada y salsas', priceEur: 9.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
    { categoryName: 'Principales', name: 'Shawarma de ternera', description: 'Shawarma de ternera con patatas', priceEur: 8.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7] },
    { categoryName: 'Bebidas', name: 'Ayran', description: 'Bebida de yogur tradicional', priceEur: 2.00, imageUrl: '/placeholder-product.jpg', allergenIds: [7] },
    { categoryName: 'Bebidas', name: 'Té moruno', description: 'Té verde con hierbabuena', priceEur: 2.50, imageUrl: '/placeholder-product.jpg', allergenIds: [] },
    { categoryName: 'Postres', name: 'Baklava', description: 'Pastel de hojaldre con pistachos y miel', priceEur: 3.50, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 8] },
    { categoryName: 'Postres', name: 'Kunafa', description: 'Postre de queso con fideos kataifi', priceEur: 4.00, imageUrl: '/placeholder-product.jpg', allergenIds: [1, 7, 8] },
  ],
};

// ─── 10 Addresses (Andalucía lat/lng) ────────────────────────

const ADDRESSES_TEMPLATE = [
  { userIdx: 7, label: 'Casa', street: 'C/ Sierpes 12', municipality: 'Sevilla', city: 'Sevilla', postalCode: '41004', floorDoor: '3ºB', lat: 37.3891, lng: -5.9945 },
  { userIdx: 7, label: 'Trabajo', street: 'Av. de la Constitución 5', municipality: 'Sevilla', city: 'Sevilla', postalCode: '41001', floorDoor: null, lat: 37.3862, lng: -5.9927 },
  { userIdx: 8, label: 'Casa', street: 'C/ Larios 8', municipality: 'Málaga', city: 'Málaga', postalCode: '29015', floorDoor: '2ºA', lat: 36.7196, lng: -4.4200 },
  { userIdx: 8, label: null, street: 'Paseo del Parque 3', municipality: 'Málaga', city: 'Málaga', postalCode: '29015', floorDoor: null, lat: 36.7178, lng: -4.4163 },
  { userIdx: 9, label: 'Casa', street: 'C/ Gondomar 1', municipality: 'Córdoba', city: 'Córdoba', postalCode: '14003', floorDoor: '1ºC', lat: 36.8400, lng: -4.7790 },
  { userIdx: 9, label: null, street: 'Av. Gran Capitán 15', municipality: 'Córdoba', city: 'Córdoba', postalCode: '14008', floorDoor: null, lat: 36.8395, lng: -4.7830 },
  { userIdx: 10, label: 'Casa', street: 'C/ Ancha 22', municipality: 'Cádiz', city: 'Cádiz', postalCode: '11001', floorDoor: 'Bajo', lat: 36.5310, lng: -6.2930 },
  { userIdx: 10, label: null, street: 'Plaza de San Juan de Dios 4', municipality: 'Cádiz', city: 'Cádiz', postalCode: '11005', floorDoor: null, lat: 36.5290, lng: -6.2920 },
  { userIdx: 11, label: 'Casa', street: 'C/ Reyes Católicos 10', municipality: 'Granada', city: 'Granada', postalCode: '18009', floorDoor: '4ºD', lat: 37.1760, lng: -3.5990 },
  { userIdx: 11, label: 'Universidad', street: 'Av. del Hospicio 1', municipality: 'Granada', city: 'Granada', postalCode: '18010', floorDoor: null, lat: 37.1780, lng: -3.5970 },
];


// ─── Orders ──────────────────────────────────────────────────

type OrderStatusType = 'PLACED' | 'ACCEPTED' | 'REJECTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

interface OrderTemplate {
  userIdx: number;
  restaurantIdx: number;
  addressIdx: number;
  phone: string;
  fulfillmentType: 'ASAP' | 'SCHEDULED';
  scheduledForHours: number | null; // hours from now (positive = future, negative = past)
  subtotalEur: number;
  deliveryFeeEur: number;
  totalEur: number;
  currentStatus: OrderStatusType;
  items: { productName: string; productPriceEur: number; quantity: number; restIdx: number; prodIdx: number }[];
  statusHistory: { fromStatus: OrderStatusType | null; toStatus: OrderStatusType; changedByUserIdx: number; minutesAfterCreation: number }[];
}

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);

const ORDERS_TEMPLATE: OrderTemplate[] = [
  {
    userIdx: 7, restaurantIdx: 0, addressIdx: 0, phone: '+34612345001',
    fulfillmentType: 'ASAP', scheduledForHours: null,
    subtotalEur: 20.50, deliveryFeeEur: 2.00, totalEur: 22.50, currentStatus: 'DELIVERED',
    items: [
      { productName: 'Burger Clásica', productPriceEur: 8.50, quantity: 2, restIdx: 0, prodIdx: 2 },
      { productName: 'Patatas fritas', productPriceEur: 3.50, quantity: 1, restIdx: 0, prodIdx: 5 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserIdx: 7, minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserIdx: 1, minutesAfterCreation: 2 },
      { fromStatus: 'ACCEPTED', toStatus: 'PREPARING', changedByUserIdx: 1, minutesAfterCreation: 5 },
      { fromStatus: 'PREPARING', toStatus: 'READY_FOR_PICKUP', changedByUserIdx: 4, minutesAfterCreation: 25 },
      { fromStatus: 'READY_FOR_PICKUP', toStatus: 'OUT_FOR_DELIVERY', changedByUserIdx: 4, minutesAfterCreation: 28 },
      { fromStatus: 'OUT_FOR_DELIVERY', toStatus: 'DELIVERED', changedByUserIdx: 4, minutesAfterCreation: 38 },
    ],
  },
  {
    userIdx: 8, restaurantIdx: 1, addressIdx: 2, phone: '+34612345002',
    fulfillmentType: 'ASAP', scheduledForHours: null,
    subtotalEur: 18.50, deliveryFeeEur: 1.50, totalEur: 20.00, currentStatus: 'REJECTED',
    items: [
      { productName: 'Paella mixta', productPriceEur: 12.00, quantity: 1, restIdx: 1, prodIdx: 2 },
      { productName: 'Ensalada mixta', productPriceEur: 5.50, quantity: 1, restIdx: 1, prodIdx: 1 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserIdx: 8, minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'REJECTED', changedByUserIdx: 2, minutesAfterCreation: 5 },
    ],
  },
  {
    userIdx: 9, restaurantIdx: 2, addressIdx: 4, phone: '+34612345003',
    fulfillmentType: 'ASAP', scheduledForHours: null,
    subtotalEur: 19.50, deliveryFeeEur: 2.50, totalEur: 22.00, currentStatus: 'PREPARING',
    items: [
      { productName: 'Pizza Margarita', productPriceEur: 9.00, quantity: 1, restIdx: 2, prodIdx: 2 },
      { productName: 'Pizza Pepperoni', productPriceEur: 10.50, quantity: 1, restIdx: 2, prodIdx: 3 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserIdx: 9, minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserIdx: 3, minutesAfterCreation: 3 },
      { fromStatus: 'ACCEPTED', toStatus: 'PREPARING', changedByUserIdx: 3, minutesAfterCreation: 5 },
    ],
  },
  {
    userIdx: 7, restaurantIdx: 3, addressIdx: 1, phone: '+34612345001',
    fulfillmentType: 'ASAP', scheduledForHours: null,
    subtotalEur: 12.00, deliveryFeeEur: 1.00, totalEur: 13.00, currentStatus: 'OUT_FOR_DELIVERY',
    items: [
      { productName: 'Pollo asado entero', productPriceEur: 12.00, quantity: 1, restIdx: 3, prodIdx: 2 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserIdx: 7, minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserIdx: 1, minutesAfterCreation: 1 },
      { fromStatus: 'ACCEPTED', toStatus: 'PREPARING', changedByUserIdx: 1, minutesAfterCreation: 3 },
      { fromStatus: 'PREPARING', toStatus: 'READY_FOR_PICKUP', changedByUserIdx: 4, minutesAfterCreation: 20 },
      { fromStatus: 'READY_FOR_PICKUP', toStatus: 'OUT_FOR_DELIVERY', changedByUserIdx: 4, minutesAfterCreation: 22 },
    ],
  },
  {
    userIdx: 10, restaurantIdx: 4, addressIdx: 6, phone: '+34612345004',
    fulfillmentType: 'ASAP', scheduledForHours: null,
    subtotalEur: 13.00, deliveryFeeEur: 1.50, totalEur: 14.50, currentStatus: 'CANCELLED',
    items: [
      { productName: 'Kebab de pollo', productPriceEur: 6.50, quantity: 2, restIdx: 4, prodIdx: 2 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserIdx: 10, minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'CANCELLED', changedByUserIdx: 10, minutesAfterCreation: 2 },
    ],
  },
  {
    userIdx: 11, restaurantIdx: 0, addressIdx: 8, phone: '+34612345005',
    fulfillmentType: 'ASAP', scheduledForHours: null,
    subtotalEur: 17.00, deliveryFeeEur: 2.00, totalEur: 19.00, currentStatus: 'DELIVERED',
    items: [
      { productName: 'Burger BBQ', productPriceEur: 10.00, quantity: 1, restIdx: 0, prodIdx: 3 },
      { productName: 'Burger Vegana', productPriceEur: 9.00, quantity: 1, restIdx: 0, prodIdx: 4 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserIdx: 11, minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserIdx: 1, minutesAfterCreation: 1 },
      { fromStatus: 'ACCEPTED', toStatus: 'PREPARING', changedByUserIdx: 1, minutesAfterCreation: 3 },
      { fromStatus: 'PREPARING', toStatus: 'READY_FOR_PICKUP', changedByUserIdx: 4, minutesAfterCreation: 22 },
      { fromStatus: 'READY_FOR_PICKUP', toStatus: 'OUT_FOR_DELIVERY', changedByUserIdx: 4, minutesAfterCreation: 25 },
      { fromStatus: 'OUT_FOR_DELIVERY', toStatus: 'DELIVERED', changedByUserIdx: 4, minutesAfterCreation: 35 },
    ],
  },
  // SCHEDULED orders
  {
    userIdx: 7, restaurantIdx: 1, addressIdx: 0, phone: '+34612345001',
    fulfillmentType: 'SCHEDULED', scheduledForHours: 3,
    subtotalEur: 23.50, deliveryFeeEur: 1.50, totalEur: 25.00, currentStatus: 'ACCEPTED',
    items: [
      { productName: 'Rabo de toro', productPriceEur: 14.00, quantity: 1, restIdx: 1, prodIdx: 3 },
      { productName: 'Flamenquín cordobés', productPriceEur: 9.50, quantity: 1, restIdx: 1, prodIdx: 4 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserIdx: 7, minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserIdx: 2, minutesAfterCreation: 10 },
    ],
  },
  {
    userIdx: 8, restaurantIdx: 2, addressIdx: 3, phone: '+34612345002',
    fulfillmentType: 'SCHEDULED', scheduledForHours: 1,
    subtotalEur: 20.50, deliveryFeeEur: 2.50, totalEur: 23.00, currentStatus: 'PREPARING',
    items: [
      { productName: 'Pizza 4 Quesos', productPriceEur: 11.00, quantity: 1, restIdx: 2, prodIdx: 4 },
      { productName: 'Pizza Vegetal', productPriceEur: 9.50, quantity: 1, restIdx: 2, prodIdx: 5 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserIdx: 8, minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserIdx: 3, minutesAfterCreation: 5 },
      { fromStatus: 'ACCEPTED', toStatus: 'PREPARING', changedByUserIdx: 3, minutesAfterCreation: 15 },
    ],
  },
  {
    userIdx: 9, restaurantIdx: 0, addressIdx: 5, phone: '+34612345003',
    fulfillmentType: 'SCHEDULED', scheduledForHours: 5,
    subtotalEur: 14.00, deliveryFeeEur: 2.00, totalEur: 16.00, currentStatus: 'PLACED',
    items: [
      { productName: 'Nachos con queso', productPriceEur: 5.50, quantity: 1, restIdx: 0, prodIdx: 0 },
      { productName: 'Burger Clásica', productPriceEur: 8.50, quantity: 1, restIdx: 0, prodIdx: 2 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserIdx: 9, minutesAfterCreation: 0 },
    ],
  },
  {
    userIdx: 10, restaurantIdx: 3, addressIdx: 7, phone: '+34612345004',
    fulfillmentType: 'SCHEDULED', scheduledForHours: -1,
    subtotalEur: 19.00, deliveryFeeEur: 1.00, totalEur: 20.00, currentStatus: 'DELIVERED',
    items: [
      { productName: 'Pollo asado entero', productPriceEur: 12.00, quantity: 1, restIdx: 3, prodIdx: 2 },
      { productName: 'Medio pollo asado', productPriceEur: 7.00, quantity: 1, restIdx: 3, prodIdx: 3 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserIdx: 10, minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserIdx: 1, minutesAfterCreation: 5 },
      { fromStatus: 'ACCEPTED', toStatus: 'PREPARING', changedByUserIdx: 1, minutesAfterCreation: 30 },
      { fromStatus: 'PREPARING', toStatus: 'READY_FOR_PICKUP', changedByUserIdx: 4, minutesAfterCreation: 50 },
      { fromStatus: 'READY_FOR_PICKUP', toStatus: 'OUT_FOR_DELIVERY', changedByUserIdx: 4, minutesAfterCreation: 55 },
      { fromStatus: 'OUT_FOR_DELIVERY', toStatus: 'DELIVERED', changedByUserIdx: 4, minutesAfterCreation: 65 },
    ],
  },
  {
    userIdx: 11, restaurantIdx: 4, addressIdx: 9, phone: '+34612345005',
    fulfillmentType: 'SCHEDULED', scheduledForHours: 2,
    subtotalEur: 15.50, deliveryFeeEur: 1.50, totalEur: 17.00, currentStatus: 'ACCEPTED',
    items: [
      { productName: 'Kebab mixto', productPriceEur: 7.50, quantity: 1, restIdx: 4, prodIdx: 3 },
      { productName: 'Plato kebab', productPriceEur: 9.00, quantity: 1, restIdx: 4, prodIdx: 5 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserIdx: 11, minutesAfterCreation: 0 },
      { fromStatus: 'PLACED', toStatus: 'ACCEPTED', changedByUserIdx: 2, minutesAfterCreation: 8 },
    ],
  },
  {
    userIdx: 8, restaurantIdx: 0, addressIdx: 2, phone: '+34612345002',
    fulfillmentType: 'SCHEDULED', scheduledForHours: 4,
    subtotalEur: 13.50, deliveryFeeEur: 2.00, totalEur: 15.50, currentStatus: 'PLACED',
    items: [
      { productName: 'Aros de cebolla', productPriceEur: 4.50, quantity: 1, restIdx: 0, prodIdx: 1 },
      { productName: 'Burger Vegana', productPriceEur: 9.00, quantity: 1, restIdx: 0, prodIdx: 4 },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', changedByUserIdx: 8, minutesAfterCreation: 0 },
    ],
  },
];


// ─── Main seed function ──────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create users in Supabase Auth + users table
  console.log('  → Seeding 12 users via Supabase Auth...');
  const createdUserIds: string[] = [];

  for (const user of USERS) {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'Password123!',
      email_confirm: true,
      user_metadata: { name: user.name },
    });

    if (authError) {
      // If user already exists, try to find them
      if (authError.message?.includes('already been registered') || authError.status === 422) {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find((u) => u.email === user.email);
        if (existing) {
          createdUserIds.push(existing.id);
          console.log(`    ⚠ User ${user.email} already exists (${existing.id})`);
          // Ensure user row exists
          await supabase.from('users').upsert({
            id: existing.id,
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, { onConflict: 'id' });
          continue;
        }
      }
      console.error(`    ✗ Failed to create user ${user.email}:`, authError.message);
      createdUserIds.push(''); // placeholder
      continue;
    }

    const userId = authData.user!.id;
    createdUserIds.push(userId);

    // Insert into users table
    const { error: insertError } = await supabase.from('users').upsert({
      id: userId,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (insertError) {
      console.error(`    ✗ Failed to insert user row for ${user.email}:`, insertError.message);
    } else {
      console.log(`    ✓ ${user.email} (${userId})`);
    }
  }

  // 2. Allergens
  console.log('  → Seeding 14 EU allergens...');
  const { error: allergenError } = await supabase.from('allergens').upsert(EU_ALLERGENS, { onConflict: 'id' });
  if (allergenError) console.error('    ✗ Allergens error:', allergenError.message);

  // 3. Restaurants
  console.log('  → Seeding 5 restaurants...');
  const restaurantIds: string[] = [];

  for (let i = 0; i < RESTAURANTS.length; i++) {
    const rest = RESTAURANTS[i];
    const { data: restData, error: restError } = await supabase
      .from('restaurants')
      .insert({
        id: crypto.randomUUID(),
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
        updatedAt: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (restError || !restData) {
      console.error(`    ✗ Restaurant ${rest.name}:`, restError?.message);
      restaurantIds.push('');
      continue;
    }

    restaurantIds.push(restData.id);
    console.log(`    ✓ ${rest.name} (${restData.id})`);

    // Opening hours
    const { data: existingHours } = await supabase
      .from('opening_hours')
      .select('id')
      .eq('restaurantId', restData.id)
      .limit(1);

    if (!existingHours?.length) {
      await supabase.from('opening_hours').insert(
        STANDARD_HOURS.map((h) => ({
          id: crypto.randomUUID(),
          restaurantId: restData.id,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
        }))
      );
    }

    // Delivery zone
    const { data: existingZones } = await supabase
      .from('delivery_zones')
      .select('id')
      .eq('restaurantId', restData.id)
      .limit(1);

    if (!existingZones?.length) {
      await supabase.from('delivery_zones').insert({
        id: crypto.randomUUID(),
        restaurantId: restData.id,
        radiusKm: rest.deliveryRadiusKm,
        lat: rest.lat,
        lng: rest.lng,
      });
    }

    // Restaurant users (owner + staff)
    const ownerId = createdUserIds[rest.ownerIdx];
    const staffId = createdUserIds[rest.staffIdx];

    if (ownerId) {
      await supabase.from('restaurant_users').insert({
        id: crypto.randomUUID(),
        userId: ownerId,
        restaurantId: restData.id,
        role: 'OWNER' as const,
      }).select();
    }
    if (staffId) {
      await supabase.from('restaurant_users').insert({
        id: crypto.randomUUID(),
        userId: staffId,
        restaurantId: restData.id,
        role: 'STAFF' as const,
      }).select();
    }
  }

  // 4. Categories
  console.log('  → Seeding categories...');
  const categoryNames = ['Entrantes', 'Principales', 'Bebidas', 'Postres'];
  // Map: restaurantIdx -> { categoryName -> categoryId }
  const categoryMap: Record<number, Record<string, string>> = {};

  for (let rIdx = 0; rIdx < restaurantIds.length; rIdx++) {
    const restaurantId = restaurantIds[rIdx];
    if (!restaurantId) continue;
    categoryMap[rIdx] = {};

    for (let cIdx = 0; cIdx < categoryNames.length; cIdx++) {
      const catName = categoryNames[cIdx];
      const { data: catData } = await supabase
        .from('categories')
        .insert({
          id: crypto.randomUUID(),
          restaurantId,
          name: catName,
          sortOrder: cIdx,
        })
        .select('id')
        .single();

      if (catData) {
        categoryMap[rIdx][catName] = catData.id;
      }
    }
  }

  // 5. Products + allergens
  const totalProducts = Object.values(PRODUCTS_BY_RESTAURANT).flat().length;
  console.log(`  → Seeding ${totalProducts} products...`);
  // Map: restIdx -> prodIdx -> productId
  const productMap: Record<number, Record<number, string>> = {};

  for (const [restIdxStr, products] of Object.entries(PRODUCTS_BY_RESTAURANT)) {
    const restIdx = Number(restIdxStr);
    const restaurantId = restaurantIds[restIdx];
    if (!restaurantId) continue;
    productMap[restIdx] = {};

    for (let pIdx = 0; pIdx < products.length; pIdx++) {
      const prod = products[pIdx];
      const categoryId = categoryMap[restIdx]?.[prod.categoryName];
      if (!categoryId) continue;

      const { data: prodData } = await supabase
        .from('products')
        .insert({
          id: crypto.randomUUID(),
          categoryId,
          name: prod.name,
          description: prod.description,
          priceEur: prod.priceEur,
          imageUrl: prod.imageUrl,
          isAvailable: true,
          updatedAt: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (prodData) {
        productMap[restIdx][pIdx] = prodData.id;

        // Product allergens
        if (prod.allergenIds.length > 0) {
          const allergenRows = prod.allergenIds.map((allergenId) => ({
            id: crypto.randomUUID(),
            productId: prodData.id,
            allergenId,
          }));
          await supabase.from('product_allergens').insert(allergenRows);
        }
      }
    }
  }

  // 6. Addresses
  console.log('  → Seeding 10 addresses...');
  const addressIds: string[] = [];

  for (const addr of ADDRESSES_TEMPLATE) {
    const userId = createdUserIds[addr.userIdx];
    if (!userId) {
      addressIds.push('');
      continue;
    }

    const { data: addrData } = await supabase
      .from('addresses')
      .insert({
        id: crypto.randomUUID(),
        userId,
        label: addr.label,
        street: addr.street,
        municipality: addr.municipality,
        city: addr.city,
        postalCode: addr.postalCode,
        floorDoor: addr.floorDoor,
        lat: addr.lat,
        lng: addr.lng,
      })
      .select('id')
      .single();

    addressIds.push(addrData?.id ?? '');
  }

  // 7. Orders
  console.log('  → Seeding 12 orders...');
  for (let oIdx = 0; oIdx < ORDERS_TEMPLATE.length; oIdx++) {
    const order = ORDERS_TEMPLATE[oIdx];
    const userId = createdUserIds[order.userIdx];
    const restaurantId = restaurantIds[order.restaurantIdx];
    const addressId = addressIds[order.addressIdx];

    if (!userId || !restaurantId || !addressId) {
      console.log(`    ⚠ Skipping order ${oIdx + 1} (missing references)`);
      continue;
    }

    const createdAt = hoursAgo(Math.floor(Math.random() * 48) + 1);
    const scheduledFor = order.scheduledForHours !== null
      ? (order.scheduledForHours >= 0 ? hoursFromNow(order.scheduledForHours) : hoursAgo(Math.abs(order.scheduledForHours)))
      : null;

    const idempotencyKey = `idem-seed-${oIdx + 1}-${Date.now()}`;

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: crypto.randomUUID(),
        userId,
        restaurantId,
        addressId,
        phone: order.phone,
        fulfillmentType: order.fulfillmentType,
        scheduledFor: scheduledFor?.toISOString() ?? null,
        subtotalEur: order.subtotalEur,
        deliveryFeeEur: order.deliveryFeeEur,
        totalEur: order.totalEur,
        currentStatus: order.currentStatus,
        idempotencyKey,
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
      })
      .select('id')
      .single();

    if (orderError || !orderData) {
      console.error(`    ✗ Order ${oIdx + 1}:`, orderError?.message);
      continue;
    }

    // Order items
    const orderItems = order.items.map((item) => ({
      id: crypto.randomUUID(),
      orderId: orderData.id,
      productId: productMap[item.restIdx]?.[item.prodIdx] ?? '',
      productName: item.productName,
      productPriceEur: item.productPriceEur,
      quantity: item.quantity,
    })).filter((item) => item.productId);

    if (orderItems.length > 0) {
      await supabase.from('order_items').insert(orderItems);
    }

    // Status history
    for (const sh of order.statusHistory) {
      const changedByUserId = createdUserIds[sh.changedByUserIdx];
      if (!changedByUserId) continue;

      await supabase.from('order_status_history').insert({
        id: crypto.randomUUID(),
        orderId: orderData.id,
        fromStatus: sh.fromStatus,
        toStatus: sh.toStatus,
        changedByUserId,
        createdAt: new Date(createdAt.getTime() + sh.minutesAfterCreation * 60 * 1000).toISOString(),
      });
    }
  }

  console.log('✅ Seed completed successfully!');
  console.log(`   - ${EU_ALLERGENS.length} allergens`);
  console.log(`   - ${USERS.length} users`);
  console.log(`   - ${RESTAURANTS.length} restaurants`);
  console.log(`   - ${categoryNames.length * RESTAURANTS.length} categories`);
  console.log(`   - ${totalProducts} products`);
  console.log(`   - ${ADDRESSES_TEMPLATE.length} addresses`);
  console.log(`   - ${ORDERS_TEMPLATE.length} orders`);
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
