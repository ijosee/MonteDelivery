import { describe, it, expect } from 'vitest';
import { hasPermission, requirePermission, ROLE_PERMISSIONS } from '../rbac';
import type { Permission } from '../rbac';

describe('RBAC', () => {
  describe('hasPermission', () => {
    it('returns true when CUSTOMER has restaurants:list', () => {
      expect(hasPermission('CUSTOMER', 'restaurants:list')).toBe(true);
    });

    it('returns true when CUSTOMER has cart:crud', () => {
      expect(hasPermission('CUSTOMER', 'cart:crud')).toBe(true);
    });

    it('returns false when CUSTOMER tries restaurants:create', () => {
      expect(hasPermission('CUSTOMER', 'restaurants:create')).toBe(false);
    });

    it('returns false when CUSTOMER tries staff:manage', () => {
      expect(hasPermission('CUSTOMER', 'staff:manage')).toBe(false);
    });

    it('returns true when RESTAURANT_OWNER has categories:crud', () => {
      expect(hasPermission('RESTAURANT_OWNER', 'categories:crud')).toBe(true);
    });

    it('returns true when RESTAURANT_OWNER has staff:manage', () => {
      expect(hasPermission('RESTAURANT_OWNER', 'staff:manage')).toBe(true);
    });

    it('returns false when RESTAURANT_OWNER tries users:manage', () => {
      expect(hasPermission('RESTAURANT_OWNER', 'users:manage')).toBe(false);
    });

    it('returns true when RESTAURANT_STAFF has orders:accept_reject', () => {
      expect(hasPermission('RESTAURANT_STAFF', 'orders:accept_reject')).toBe(true);
    });

    it('returns false when RESTAURANT_STAFF tries categories:crud', () => {
      expect(hasPermission('RESTAURANT_STAFF', 'categories:crud')).toBe(false);
    });

    it('returns false when RESTAURANT_STAFF tries staff:manage', () => {
      expect(hasPermission('RESTAURANT_STAFF', 'staff:manage')).toBe(false);
    });

    it('returns true when ADMIN has users:manage', () => {
      expect(hasPermission('ADMIN', 'users:manage')).toBe(true);
    });

    it('returns true when ADMIN has restaurants:toggle', () => {
      expect(hasPermission('ADMIN', 'restaurants:toggle')).toBe(true);
    });

    it('returns true when ADMIN has metrics:read_all', () => {
      expect(hasPermission('ADMIN', 'metrics:read_all')).toBe(true);
    });

    it('returns false when ADMIN tries cart:crud', () => {
      expect(hasPermission('ADMIN', 'cart:crud')).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('does not throw when role has the permission', () => {
      expect(() => requirePermission('CUSTOMER', 'orders:create')).not.toThrow();
    });

    it('throws with exact Spanish message when role lacks permission', () => {
      expect(() => requirePermission('CUSTOMER', 'users:manage')).toThrow(
        'No tienes permisos para realizar esta acción.'
      );
    });

    it('throws for RESTAURANT_STAFF trying to manage staff', () => {
      expect(() => requirePermission('RESTAURANT_STAFF', 'staff:manage')).toThrow(
        'No tienes permisos para realizar esta acción.'
      );
    });
  });

  describe('ROLE_PERMISSIONS completeness', () => {
    it('defines permissions for all four roles', () => {
      expect(Object.keys(ROLE_PERMISSIONS)).toEqual(
        expect.arrayContaining(['CUSTOMER', 'RESTAURANT_OWNER', 'RESTAURANT_STAFF', 'ADMIN'])
      );
      expect(Object.keys(ROLE_PERMISSIONS)).toHaveLength(4);
    });

    it('CUSTOMER has exactly 7 permissions', () => {
      expect(ROLE_PERMISSIONS.CUSTOMER).toHaveLength(7);
    });

    it('RESTAURANT_OWNER has exactly 11 permissions', () => {
      expect(ROLE_PERMISSIONS.RESTAURANT_OWNER).toHaveLength(11);
    });

    it('RESTAURANT_STAFF has exactly 6 permissions', () => {
      expect(ROLE_PERMISSIONS.RESTAURANT_STAFF).toHaveLength(6);
    });

    it('ADMIN has exactly 12 permissions', () => {
      expect(ROLE_PERMISSIONS.ADMIN).toHaveLength(12);
    });

    it('all roles share restaurants:list and restaurants:read', () => {
      const roles = ['CUSTOMER', 'RESTAURANT_OWNER', 'RESTAURANT_STAFF', 'ADMIN'] as const;
      for (const role of roles) {
        expect(ROLE_PERMISSIONS[role]).toContain('restaurants:list');
        expect(ROLE_PERMISSIONS[role]).toContain('restaurants:read');
      }
    });
  });
});
