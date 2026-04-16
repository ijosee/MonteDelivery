// src/lib/domain/order-fsm.ts

type OrderStatus = 'PLACED' | 'ACCEPTED' | 'REJECTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
type UserRole = 'CUSTOMER' | 'RESTAURANT_OWNER' | 'RESTAURANT_STAFF' | 'ADMIN';
type FulfillmentType = 'ASAP' | 'SCHEDULED';

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED:             ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED:           ['PREPARING', 'CANCELLED'],
  PREPARING:          ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP:   ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY:   ['DELIVERED'],
  DELIVERED:          [],
  REJECTED:           [],
  CANCELLED:          [],
};

const TRANSITION_PERMISSIONS: Record<string, UserRole[]> = {
  'PLACED→ACCEPTED':              ['RESTAURANT_OWNER', 'RESTAURANT_STAFF'],
  'PLACED→REJECTED':              ['RESTAURANT_OWNER', 'RESTAURANT_STAFF'],
  'PLACED→CANCELLED':             ['CUSTOMER'],
  'ACCEPTED→PREPARING':           ['RESTAURANT_OWNER', 'RESTAURANT_STAFF'],
  'ACCEPTED→CANCELLED':           ['CUSTOMER'],
  'PREPARING→READY_FOR_PICKUP':   ['RESTAURANT_OWNER', 'RESTAURANT_STAFF'],
  'READY_FOR_PICKUP→OUT_FOR_DELIVERY': ['RESTAURANT_OWNER', 'RESTAURANT_STAFF'],
  'OUT_FOR_DELIVERY→DELIVERED':   ['RESTAURANT_OWNER', 'RESTAURANT_STAFF'],
};

interface TransitionContext {
  currentStatus: OrderStatus;
  targetStatus: OrderStatus;
  userRole: UserRole;
  fulfillmentType: FulfillmentType;
  scheduledFor?: Date | null;
  now?: Date;
}

interface TransitionResult {
  success: boolean;
  error?: string;
}

function validateTransition(ctx: TransitionContext): TransitionResult {
  const { currentStatus, targetStatus, userRole, fulfillmentType, scheduledFor, now = new Date() } = ctx;

  // Idempotencia
  if (currentStatus === targetStatus) {
    return { success: true };
  }

  // Verificar transición válida
  const allowed = TRANSITIONS[currentStatus];
  if (!allowed?.includes(targetStatus)) {
    return {
      success: false,
      error: `Transición de estado no válida: no se puede pasar de ${currentStatus} a ${targetStatus}.`,
    };
  }

  // Verificar permisos
  const key = `${currentStatus}→${targetStatus}`;
  const allowedRoles = TRANSITION_PERMISSIONS[key];
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return { success: false, error: 'No tienes permisos para realizar esta acción.' };
  }

  // Regla: cancelación SCHEDULED aceptado requiere >60 min
  if (currentStatus === 'ACCEPTED' && targetStatus === 'CANCELLED') {
    if (fulfillmentType !== 'SCHEDULED') {
      return {
        success: false,
        error: 'Este pedido ya no se puede cancelar porque está siendo preparado.',
      };
    }
    if (scheduledFor) {
      const minutesUntilScheduled = (scheduledFor.getTime() - now.getTime()) / 60000;
      if (minutesUntilScheduled <= 60) {
        return {
          success: false,
          error: 'No puedes cancelar este pedido porque falta menos de 1 hora para la entrega programada.',
        };
      }
    }
  }

  // Regla: ASAP solo cancelable en PLACED
  if (targetStatus === 'CANCELLED' && fulfillmentType === 'ASAP' && currentStatus !== 'PLACED') {
    return {
      success: false,
      error: 'Este pedido ya no se puede cancelar porque está siendo preparado.',
    };
  }

  return { success: true };
}

function isTerminalStatus(status: OrderStatus): boolean {
  return ['DELIVERED', 'REJECTED', 'CANCELLED'].includes(status);
}

export { validateTransition, isTerminalStatus, TRANSITIONS, TRANSITION_PERMISSIONS };
export type { TransitionContext, TransitionResult, OrderStatus, UserRole, FulfillmentType };
