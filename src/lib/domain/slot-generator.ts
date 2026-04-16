// src/lib/domain/slot-generator.ts

interface OpeningHour {
  dayOfWeek: number;  // 0=lunes, 6=domingo
  openTime: string;   // "HH:mm"
  closeTime: string;  // "HH:mm"
}

interface SlotGeneratorInput {
  openingHours: OpeningHour[];
  date: string;                    // "YYYY-MM-DD"
  now?: Date;
  slotIntervalMinutes?: number;    // default 10
  scheduleLeadTimeMin?: number;    // default 30
  maxScheduleDays?: number;        // default 2
}

// Constantes MVP
const SLOT_INTERVAL_MINUTES = 10;
const SCHEDULE_LEAD_TIME_MIN = 30;
const MAX_SCHEDULE_DAYS = 2;

/**
 * Genera los slots disponibles para un restaurante en una fecha dada.
 * Función pura.
 *
 * Cada slot cumple:
 * (a) Está dentro del horario de apertura del restaurante
 * (b) Es >= NOW + schedule_lead_time_min
 * (c) Es <= NOW + max_schedule_days
 */
function getAvailableSlots(input: SlotGeneratorInput): string[] {
  const {
    openingHours,
    date,
    now = new Date(),
    slotIntervalMinutes = SLOT_INTERVAL_MINUTES,
    scheduleLeadTimeMin = SCHEDULE_LEAD_TIME_MIN,
    maxScheduleDays = MAX_SCHEDULE_DAYS,
  } = input;

  const targetDate = new Date(date + 'T00:00:00');
  // dayOfWeek: 0=lunes en nuestro sistema. JS getDay(): 0=domingo
  const jsDay = targetDate.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // Convertir a 0=lunes

  const minTime = new Date(now.getTime() + scheduleLeadTimeMin * 60000);
  const maxTime = new Date(now.getTime() + maxScheduleDays * 24 * 60 * 60000);

  // Filtrar horarios del día solicitado
  const todayHours = openingHours.filter(h => h.dayOfWeek === dayOfWeek);
  if (todayHours.length === 0) return [];

  const slots: string[] = [];

  for (const hours of todayHours) {
    const [openH, openM] = hours.openTime.split(':').map(Number);
    const [closeH, closeM] = hours.closeTime.split(':').map(Number);

    const slotStart = new Date(targetDate);
    slotStart.setHours(openH, openM, 0, 0);

    const slotEnd = new Date(targetDate);
    slotEnd.setHours(closeH, closeM, 0, 0);

    let current = new Date(slotStart);
    while (current < slotEnd) {
      if (current >= minTime && current <= maxTime) {
        const hh = String(current.getHours()).padStart(2, '0');
        const mm = String(current.getMinutes()).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }
      current = new Date(current.getTime() + slotIntervalMinutes * 60000);
    }
  }

  return slots;
}

export { getAvailableSlots, SLOT_INTERVAL_MINUTES, SCHEDULE_LEAD_TIME_MIN, MAX_SCHEDULE_DAYS };
export type { OpeningHour, SlotGeneratorInput };
