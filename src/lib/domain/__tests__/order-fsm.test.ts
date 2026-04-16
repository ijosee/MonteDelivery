import { describe, it, expect } from 'vitest';
import {
  validateTransition,
  isTerminalStatus,
  TRANSITIONS,
  TRANSITION_PERMISSIONS,
} from '../order-fsm';
import type { OrderStatus, TransitionContext } from '../order-fsm';

describe('order-fsm', () => {
  // Helper to build a TransitionContext with sensible defaults
  function ctx(overrides: Partial<TransitionContext>): TransitionContext {
    return {
      currentStatus: 'PLACED',
      targetStatus: 'ACCEPTED',
      userRole: 'RESTAURANT_OWNER',
      fulfillmentType: 'ASAP',
      now: new Date('2024-06-15T12:00:00Z'),
      ...overrides,
    };
  }

  describe('TRANSITIONS map', () => {
    it('PLACED can transition to ACCEPTED, REJECTED, CANCELLED', () => {
      expect(TRANSITIONS.PLACED).toEqual(['ACCEPTED', 'REJECTED', 'CANCELLED']);
    });

    it('ACCEPTED can transition to PREPARING, CANCELLED', () => {
      expect(TRANSITIONS.ACCEPTED).toEqual(['PREPARING', 'CANCELLED']);
    });

    it('PREPARING can transition to READY_FOR_PICKUP', () => {
      expect(TRANSITIONS.PREPARING).toEqual(['READY_FOR_PICKUP']);
    });

    it('READY_FOR_PICKUP can transition to OUT_FOR_DELIVERY', () => {
      expect(TRANSITIONS.READY_FOR_PICKUP).toEqual(['OUT_FOR_DELIVERY']);
    });

    it('OUT_FOR_DELIVERY can transition to DELIVERED', () => {
      expect(TRANSITIONS.OUT_FOR_DELIVERY).toEqual(['DELIVERED']);
    });

    it('terminal states have no outgoing transitions', () => {
      expect(TRANSITIONS.DELIVERED).toEqual([]);
      expect(TRANSITIONS.REJECTED).toEqual([]);
      expect(TRANSITIONS.CANCELLED).toEqual([]);
    });
  });

  describe('TRANSITION_PERMISSIONS map', () => {
    it('has correct permissions for all transitions', () => {
      expect(TRANSITION_PERMISSIONS['PLACED→ACCEPTED']).toEqual(['RESTAURANT_OWNER', 'RESTAURANT_STAFF']);
      expect(TRANSITION_PERMISSIONS['PLACED→REJECTED']).toEqual(['RESTAURANT_OWNER', 'RESTAURANT_STAFF']);
      expect(TRANSITION_PERMISSIONS['PLACED→CANCELLED']).toEqual(['CUSTOMER']);
      expect(TRANSITION_PERMISSIONS['ACCEPTED→PREPARING']).toEqual(['RESTAURANT_OWNER', 'RESTAURANT_STAFF']);
      expect(TRANSITION_PERMISSIONS['ACCEPTED→CANCELLED']).toEqual(['CUSTOMER']);
      expect(TRANSITION_PERMISSIONS['PREPARING→READY_FOR_PICKUP']).toEqual(['RESTAURANT_OWNER', 'RESTAURANT_STAFF']);
      expect(TRANSITION_PERMISSIONS['READY_FOR_PICKUP→OUT_FOR_DELIVERY']).toEqual(['RESTAURANT_OWNER', 'RESTAURANT_STAFF']);
      expect(TRANSITION_PERMISSIONS['OUT_FOR_DELIVERY→DELIVERED']).toEqual(['RESTAURANT_OWNER', 'RESTAURANT_STAFF']);
    });
  });

  describe('idempotency', () => {
    it('returns success when currentStatus === targetStatus', () => {
      const allStatuses: OrderStatus[] = [
        'PLACED', 'ACCEPTED', 'REJECTED', 'PREPARING',
        'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
      ];

      for (const status of allStatuses) {
        const result = validateTransition(ctx({
          currentStatus: status,
          targetStatus: status,
        }));
        expect(result).toEqual({ success: true });
      }
    });
  });

  describe('valid transitions', () => {
    it('PLACED→ACCEPTED by RESTAURANT_OWNER succeeds', () => {
      const result = validateTransition(ctx({
        currentStatus: 'PLACED',
        targetStatus: 'ACCEPTED',
        userRole: 'RESTAURANT_OWNER',
      }));
      expect(result).toEqual({ success: true });
    });

    it('PLACED→ACCEPTED by RESTAURANT_STAFF succeeds', () => {
      const result = validateTransition(ctx({
        currentStatus: 'PLACED',
        targetStatus: 'ACCEPTED',
        userRole: 'RESTAURANT_STAFF',
      }));
      expect(result).toEqual({ success: true });
    });

    it('PLACED→REJECTED by RESTAURANT_OWNER succeeds', () => {
      const result = validateTransition(ctx({
        currentStatus: 'PLACED',
        targetStatus: 'REJECTED',
        userRole: 'RESTAURANT_OWNER',
      }));
      expect(result).toEqual({ success: true });
    });

    it('PLACED→CANCELLED by CUSTOMER (ASAP) succeeds', () => {
      const result = validateTransition(ctx({
        currentStatus: 'PLACED',
        targetStatus: 'CANCELLED',
        userRole: 'CUSTOMER',
        fulfillmentType: 'ASAP',
      }));
      expect(result).toEqual({ success: true });
    });

    it('ACCEPTED→PREPARING by RESTAURANT_STAFF succeeds', () => {
      const result = validateTransition(ctx({
        currentStatus: 'ACCEPTED',
        targetStatus: 'PREPARING',
        userRole: 'RESTAURANT_STAFF',
      }));
      expect(result).toEqual({ success: true });
    });

    it('PREPARING→READY_FOR_PICKUP succeeds', () => {
      const result = validateTransition(ctx({
        currentStatus: 'PREPARING',
        targetStatus: 'READY_FOR_PICKUP',
        userRole: 'RESTAURANT_OWNER',
      }));
      expect(result).toEqual({ success: true });
    });

    it('READY_FOR_PICKUP→OUT_FOR_DELIVERY succeeds', () => {
      const result = validateTransition(ctx({
        currentStatus: 'READY_FOR_PICKUP',
        targetStatus: 'OUT_FOR_DELIVERY',
        userRole: 'RESTAURANT_OWNER',
      }));
      expect(result).toEqual({ success: true });
    });

    it('OUT_FOR_DELIVERY→DELIVERED succeeds', () => {
      const result = validateTransition(ctx({
        currentStatus: 'OUT_FOR_DELIVERY',
        targetStatus: 'DELIVERED',
        userRole: 'RESTAURANT_STAFF',
      }));
      expect(result).toEqual({ success: true });
    });
  });

  describe('invalid transitions', () => {
    it('PLACED→PREPARING is not allowed', () => {
      const result = validateTransition(ctx({
        currentStatus: 'PLACED',
        targetStatus: 'PREPARING',
      }));
      expect(result).toEqual({
        success: false,
        error: 'Transición de estado no válida: no se puede pasar de PLACED a PREPARING.',
      });
    });

    it('PLACED→DELIVERED is not allowed', () => {
      const result = validateTransition(ctx({
        currentStatus: 'PLACED',
        targetStatus: 'DELIVERED',
      }));
      expect(result).toEqual({
        success: false,
        error: 'Transición de estado no válida: no se puede pasar de PLACED a DELIVERED.',
      });
    });

    it('PREPARING→CANCELLED is not allowed', () => {
      const result = validateTransition(ctx({
        currentStatus: 'PREPARING',
        targetStatus: 'CANCELLED',
        userRole: 'CUSTOMER',
      }));
      expect(result).toEqual({
        success: false,
        error: 'Transición de estado no válida: no se puede pasar de PREPARING a CANCELLED.',
      });
    });

    it('DELIVERED→PLACED is not allowed (terminal state)', () => {
      const result = validateTransition(ctx({
        currentStatus: 'DELIVERED',
        targetStatus: 'PLACED',
      }));
      expect(result).toEqual({
        success: false,
        error: 'Transición de estado no válida: no se puede pasar de DELIVERED a PLACED.',
      });
    });

    it('CANCELLED→PLACED is not allowed (terminal state)', () => {
      const result = validateTransition(ctx({
        currentStatus: 'CANCELLED',
        targetStatus: 'PLACED',
      }));
      expect(result).toEqual({
        success: false,
        error: 'Transición de estado no válida: no se puede pasar de CANCELLED a PLACED.',
      });
    });

    it('REJECTED→ACCEPTED is not allowed (terminal state)', () => {
      const result = validateTransition(ctx({
        currentStatus: 'REJECTED',
        targetStatus: 'ACCEPTED',
      }));
      expect(result).toEqual({
        success: false,
        error: 'Transición de estado no válida: no se puede pasar de REJECTED a ACCEPTED.',
      });
    });
  });

  describe('permission checks', () => {
    it('CUSTOMER cannot accept orders (PLACED→ACCEPTED)', () => {
      const result = validateTransition(ctx({
        currentStatus: 'PLACED',
        targetStatus: 'ACCEPTED',
        userRole: 'CUSTOMER',
      }));
      expect(result).toEqual({
        success: false,
        error: 'No tienes permisos para realizar esta acción.',
      });
    });

    it('CUSTOMER cannot reject orders (PLACED→REJECTED)', () => {
      const result = validateTransition(ctx({
        currentStatus: 'PLACED',
        targetStatus: 'REJECTED',
        userRole: 'CUSTOMER',
      }));
      expect(result).toEqual({
        success: false,
        error: 'No tienes permisos para realizar esta acción.',
      });
    });

    it('RESTAURANT_STAFF cannot cancel orders (PLACED→CANCELLED)', () => {
      const result = validateTransition(ctx({
        currentStatus: 'PLACED',
        targetStatus: 'CANCELLED',
        userRole: 'RESTAURANT_STAFF',
        fulfillmentType: 'ASAP',
      }));
      expect(result).toEqual({
        success: false,
        error: 'No tienes permisos para realizar esta acción.',
      });
    });

    it('RESTAURANT_OWNER cannot cancel orders (PLACED→CANCELLED)', () => {
      const result = validateTransition(ctx({
        currentStatus: 'PLACED',
        targetStatus: 'CANCELLED',
        userRole: 'RESTAURANT_OWNER',
        fulfillmentType: 'ASAP',
      }));
      expect(result).toEqual({
        success: false,
        error: 'No tienes permisos para realizar esta acción.',
      });
    });

    it('ADMIN cannot change order status (ACCEPTED→PREPARING)', () => {
      const result = validateTransition(ctx({
        currentStatus: 'ACCEPTED',
        targetStatus: 'PREPARING',
        userRole: 'ADMIN',
      }));
      expect(result).toEqual({
        success: false,
        error: 'No tienes permisos para realizar esta acción.',
      });
    });
  });

  describe('ASAP cancellation rules', () => {
    it('ASAP: cancellation allowed in PLACED', () => {
      const result = validateTransition(ctx({
        currentStatus: 'PLACED',
        targetStatus: 'CANCELLED',
        userRole: 'CUSTOMER',
        fulfillmentType: 'ASAP',
      }));
      expect(result).toEqual({ success: true });
    });

    it('ASAP: cancellation denied in ACCEPTED', () => {
      const result = validateTransition(ctx({
        currentStatus: 'ACCEPTED',
        targetStatus: 'CANCELLED',
        userRole: 'CUSTOMER',
        fulfillmentType: 'ASAP',
      }));
      expect(result).toEqual({
        success: false,
        error: 'Este pedido ya no se puede cancelar porque está siendo preparado.',
      });
    });
  });

  describe('SCHEDULED cancellation rules', () => {
    it('SCHEDULED: cancellation always allowed in PLACED', () => {
      const result = validateTransition(ctx({
        currentStatus: 'PLACED',
        targetStatus: 'CANCELLED',
        userRole: 'CUSTOMER',
        fulfillmentType: 'SCHEDULED',
      }));
      expect(result).toEqual({ success: true });
    });

    it('SCHEDULED ACCEPTED: cancellation allowed with >60 min before scheduledFor', () => {
      const now = new Date('2024-06-15T12:00:00Z');
      const scheduledFor = new Date('2024-06-15T14:00:00Z'); // 120 min away

      const result = validateTransition(ctx({
        currentStatus: 'ACCEPTED',
        targetStatus: 'CANCELLED',
        userRole: 'CUSTOMER',
        fulfillmentType: 'SCHEDULED',
        scheduledFor,
        now,
      }));
      expect(result).toEqual({ success: true });
    });

    it('SCHEDULED ACCEPTED: cancellation denied with exactly 60 min before scheduledFor', () => {
      const now = new Date('2024-06-15T13:00:00Z');
      const scheduledFor = new Date('2024-06-15T14:00:00Z'); // exactly 60 min

      const result = validateTransition(ctx({
        currentStatus: 'ACCEPTED',
        targetStatus: 'CANCELLED',
        userRole: 'CUSTOMER',
        fulfillmentType: 'SCHEDULED',
        scheduledFor,
        now,
      }));
      expect(result).toEqual({
        success: false,
        error: 'No puedes cancelar este pedido porque falta menos de 1 hora para la entrega programada.',
      });
    });

    it('SCHEDULED ACCEPTED: cancellation denied with <60 min before scheduledFor', () => {
      const now = new Date('2024-06-15T13:15:00Z');
      const scheduledFor = new Date('2024-06-15T14:00:00Z'); // 45 min away

      const result = validateTransition(ctx({
        currentStatus: 'ACCEPTED',
        targetStatus: 'CANCELLED',
        userRole: 'CUSTOMER',
        fulfillmentType: 'SCHEDULED',
        scheduledFor,
        now,
      }));
      expect(result).toEqual({
        success: false,
        error: 'No puedes cancelar este pedido porque falta menos de 1 hora para la entrega programada.',
      });
    });

    it('SCHEDULED ACCEPTED: cancellation allowed with 61 min before scheduledFor', () => {
      const now = new Date('2024-06-15T12:59:00Z');
      const scheduledFor = new Date('2024-06-15T14:00:00Z'); // 61 min away

      const result = validateTransition(ctx({
        currentStatus: 'ACCEPTED',
        targetStatus: 'CANCELLED',
        userRole: 'CUSTOMER',
        fulfillmentType: 'SCHEDULED',
        scheduledFor,
        now,
      }));
      expect(result).toEqual({ success: true });
    });
  });

  describe('terminal states', () => {
    const terminalStatuses: OrderStatus[] = ['DELIVERED', 'REJECTED', 'CANCELLED'];
    const nonTerminalStatuses: OrderStatus[] = [
      'PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY',
    ];

    for (const status of terminalStatuses) {
      it(`${status} has no outgoing transitions`, () => {
        expect(TRANSITIONS[status]).toEqual([]);
      });

      it(`any transition from ${status} fails`, () => {
        for (const target of nonTerminalStatuses) {
          const result = validateTransition(ctx({
            currentStatus: status,
            targetStatus: target,
          }));
          expect(result.success).toBe(false);
          expect(result.error).toBe(
            `Transición de estado no válida: no se puede pasar de ${status} a ${target}.`
          );
        }
      });
    }
  });

  describe('isTerminalStatus', () => {
    it('returns true for DELIVERED', () => {
      expect(isTerminalStatus('DELIVERED')).toBe(true);
    });

    it('returns true for REJECTED', () => {
      expect(isTerminalStatus('REJECTED')).toBe(true);
    });

    it('returns true for CANCELLED', () => {
      expect(isTerminalStatus('CANCELLED')).toBe(true);
    });

    it('returns false for PLACED', () => {
      expect(isTerminalStatus('PLACED')).toBe(false);
    });

    it('returns false for ACCEPTED', () => {
      expect(isTerminalStatus('ACCEPTED')).toBe(false);
    });

    it('returns false for PREPARING', () => {
      expect(isTerminalStatus('PREPARING')).toBe(false);
    });

    it('returns false for READY_FOR_PICKUP', () => {
      expect(isTerminalStatus('READY_FOR_PICKUP')).toBe(false);
    });

    it('returns false for OUT_FOR_DELIVERY', () => {
      expect(isTerminalStatus('OUT_FOR_DELIVERY')).toBe(false);
    });
  });
});
