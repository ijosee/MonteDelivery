// Tipos compartidos — Pueblo Delivery Marketplace

/** Wrapper genérico para respuestas de API */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/** DTO de restaurante para listados y fichas */
export interface RestaurantDTO {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  cuisineType: string | null;
  isOpen: boolean;
  deliveryFeeEur: number;
  minOrderEur: number;
  deliveryRadiusKm: number;
}

/** DTO de producto para catálogo */
export interface ProductDTO {
  id: string;
  name: string;
  description: string | null;
  priceEur: number;
  imageUrl: string;
  allergens: { id: number; code: string; nameEs: string }[];
  isAvailable: boolean;
}

/** DTO de pedido para historial y tracking */
export interface OrderDTO {
  id: string;
  orderNumber: number;
  restaurantName: string;
  status: string;
  fulfillmentType: 'ASAP' | 'SCHEDULED';
  totalEur: number;
  eta: string | null;
  createdAt: string;
}

/** DTO de carrito */
export interface CartDTO {
  id: string;
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItemDTO[];
  subtotalEur: number;
}

/** DTO de ítem del carrito */
export interface CartItemDTO {
  id: string;
  productId: string;
  productName: string;
  priceEur: number;
  quantity: number;
  notes: string | null;
}

/** Tipo de permiso para RBAC */
export type Permission =
  | 'restaurants:list'
  | 'restaurants:read'
  | 'restaurants:create'
  | 'restaurants:edit'
  | 'restaurants:toggle'
  | 'categories:crud'
  | 'products:crud'
  | 'products:read'
  | 'cart:crud'
  | 'orders:create'
  | 'orders:read_own'
  | 'orders:read_restaurant'
  | 'orders:accept_reject'
  | 'orders:change_status'
  | 'orders:cancel'
  | 'staff:manage'
  | 'users:manage'
  | 'audit:read'
  | 'metrics:read_own'
  | 'metrics:read_all';
