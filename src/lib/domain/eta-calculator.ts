// src/lib/domain/eta-calculator.ts

interface ETAInput {
  fulfillmentType: 'ASAP' | 'SCHEDULED';
  itemCount: number;
  distanceKm: number;
  activeOrderCount: number;
  scheduledFor?: Date | null;
  now?: Date;
}

interface ETAResult {
  eta: Date;
  /** Para SCHEDULED: fin de la ventana de entrega (scheduled_for + 10 min) */
  etaWindowEnd?: Date;
  /** Desglose en minutos */
  breakdown: {
    prepTime: number;
    queueFactor: number;
    travelTime: number;
    buffer: number;
    totalMinutes: number;
  };
}

// Constantes MVP (fijas, configurables en Fase 2)
const PREP_TIME_BASE = 20;        // minutos
const PREP_TIME_PER_ITEM = 2;     // minutos por ítem
const QUEUE_THRESHOLD = 3;        // pedidos activos antes de añadir cola
const QUEUE_FACTOR_PER_ORDER = 3; // minutos extra por pedido sobre umbral
const TRAVEL_TIME_PER_KM = 4;     // minutos por km
const BUFFER_MINUTES = 8;         // buffer fijo
const SCHEDULED_WINDOW = 10;      // minutos de ventana para SCHEDULED

/**
 * Calcula la ETA de un pedido. Función pura.
 */
function computeEta(input: ETAInput): ETAResult {
  const { fulfillmentType, itemCount, distanceKm, activeOrderCount, scheduledFor, now = new Date() } = input;

  if (fulfillmentType === 'SCHEDULED' && scheduledFor) {
    return {
      eta: scheduledFor,
      etaWindowEnd: new Date(scheduledFor.getTime() + SCHEDULED_WINDOW * 60000),
      breakdown: { prepTime: 0, queueFactor: 0, travelTime: 0, buffer: 0, totalMinutes: 0 },
    };
  }

  // ASAP
  const prepTime = PREP_TIME_BASE + (itemCount * PREP_TIME_PER_ITEM);
  const queueFactor = Math.max(0, (activeOrderCount - QUEUE_THRESHOLD) * QUEUE_FACTOR_PER_ORDER);
  const travelTime = Math.ceil(distanceKm * TRAVEL_TIME_PER_KM);
  const buffer = BUFFER_MINUTES;
  const totalMinutes = prepTime + queueFactor + travelTime + buffer;

  return {
    eta: new Date(now.getTime() + totalMinutes * 60000),
    breakdown: { prepTime, queueFactor, travelTime, buffer, totalMinutes },
  };
}

export { computeEta, PREP_TIME_BASE, PREP_TIME_PER_ITEM, QUEUE_THRESHOLD, QUEUE_FACTOR_PER_ORDER, TRAVEL_TIME_PER_KM, BUFFER_MINUTES, SCHEDULED_WINDOW };
export type { ETAInput, ETAResult };
