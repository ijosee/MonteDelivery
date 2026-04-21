// src/lib/auth/rbac.ts
import type { UserRole } from '@/types/database';

type Permission =
  | 'restaurants:list' | 'restaurants:read' | 'restaurants:create' | 'restaurants:edit' | 'restaurants:toggle'
  | 'categories:crud' | 'products:crud' | 'products:read'
  | 'cart:crud'
  | 'orders:create' | 'orders:read_own' | 'orders:read_restaurant' | 'orders:accept_reject'
  | 'orders:change_status' | 'orders:cancel'
  | 'staff:manage'
  | 'users:manage' | 'audit:read' | 'metrics:read_own' | 'metrics:read_all';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  CUSTOMER: [
    'restaurants:list', 'restaurants:read', 'products:read',
    'cart:crud', 'orders:create', 'orders:read_own', 'orders:cancel',
  ],
  RESTAURANT_OWNER: [
    'restaurants:list', 'restaurants:read', 'restaurants:edit',
    'categories:crud', 'products:crud', 'products:read',
    'orders:read_restaurant', 'orders:accept_reject', 'orders:change_status',
    'staff:manage', 'metrics:read_own',
  ],
  RESTAURANT_STAFF: [
    'restaurants:list', 'restaurants:read', 'products:read',
    'orders:read_restaurant', 'orders:accept_reject', 'orders:change_status',
  ],
  ADMIN: [
    'restaurants:list', 'restaurants:read', 'restaurants:create', 'restaurants:edit', 'restaurants:toggle',
    'categories:crud', 'products:crud', 'products:read',
    'orders:read_own', 'users:manage', 'audit:read', 'metrics:read_all',
  ],
};

function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

function requirePermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error('No tienes permisos para realizar esta acción.');
  }
}

export { hasPermission, requirePermission, ROLE_PERMISSIONS };
export type { Permission };
