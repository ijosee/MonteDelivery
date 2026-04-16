import { describe, it, expect } from 'vitest';
import {
  getAvailableSlots,
  SLOT_INTERVAL_MINUTES,
  SCHEDULE_LEAD_TIME_MIN,
  MAX_SCHEDULE_DAYS,
} from '../slot-generator';
import type { OpeningHour } from '../slot-generator';

describe('slot-generator', () => {
  describe('constants', () => {
    it('should have correct MVP constants', () => {
      expect(SLOT_INTERVAL_MINUTES).toBe(10);
      expect(SCHEDULE_LEAD_TIME_MIN).toBe(30);
      expect(MAX_SCHEDULE_DAYS).toBe(2);
    });
  });

  describe('getAvailableSlots', () => {
    // Use a fixed "now" for deterministic tests.
    // 2024-06-17 is a Monday (JS getDay()=1 → system dayOfWeek=0)
    const monday = '2024-06-17';
    // 2024-06-16 is a Sunday (JS getDay()=0 → system dayOfWeek=6)
    const sunday = '2024-06-16';

    it('returns slots within opening hours only', () => {
      // Restaurant open 13:00-14:00 on Monday (dayOfWeek=0)
      // now = Monday 10:00 → minTime = 10:30, maxTime = Wednesday 10:00
      // All slots 13:00-13:50 should be within opening hours
      const now = new Date('2024-06-17T10:00:00');
      const openingHours: OpeningHour[] = [
        { dayOfWeek: 0, openTime: '13:00', closeTime: '14:00' },
      ];

      const slots = getAvailableSlots({ openingHours, date: monday, now });

      expect(slots).toEqual(['13:00', '13:10', '13:20', '13:30', '13:40', '13:50']);
      // No slot at 14:00 (closeTime is exclusive)
      expect(slots).not.toContain('14:00');
    });

    it('respects lead time (>= now + 30 min)', () => {
      // Restaurant open 13:00-16:00 on Monday
      // now = Monday 13:00 → minTime = 13:30
      // Slots before 13:30 should be excluded
      const now = new Date('2024-06-17T13:00:00');
      const openingHours: OpeningHour[] = [
        { dayOfWeek: 0, openTime: '13:00', closeTime: '14:00' },
      ];

      const slots = getAvailableSlots({ openingHours, date: monday, now });

      expect(slots[0]).toBe('13:30');
      expect(slots).not.toContain('13:00');
      expect(slots).not.toContain('13:10');
      expect(slots).not.toContain('13:20');
      expect(slots).toEqual(['13:30', '13:40', '13:50']);
    });

    it('respects max days (<= now + 2 days)', () => {
      // now = Monday 10:00 → maxTime = Wednesday 10:00
      // Requesting slots for Wednesday (2024-06-19, dayOfWeek=2)
      // Restaurant open 09:00-12:00 on Wednesday
      // Only slots <= Wednesday 10:00 should be included
      const now = new Date('2024-06-17T10:00:00');
      const wednesday = '2024-06-19';
      const openingHours: OpeningHour[] = [
        { dayOfWeek: 2, openTime: '09:00', closeTime: '12:00' },
      ];

      const slots = getAvailableSlots({ openingHours, date: wednesday, now });

      // Slots from 09:00 to 10:00 (maxTime is Wed 10:00)
      expect(slots).toContain('09:00');
      expect(slots).toContain('10:00');
      expect(slots).not.toContain('10:10');
      expect(slots).not.toContain('11:00');
    });

    it('slots are 10 min apart', () => {
      const now = new Date('2024-06-17T08:00:00');
      const openingHours: OpeningHour[] = [
        { dayOfWeek: 0, openTime: '09:00', closeTime: '10:00' },
      ];

      const slots = getAvailableSlots({ openingHours, date: monday, now });

      for (let i = 1; i < slots.length; i++) {
        const [prevH, prevM] = slots[i - 1].split(':').map(Number);
        const [currH, currM] = slots[i].split(':').map(Number);
        const prevMinutes = prevH * 60 + prevM;
        const currMinutes = currH * 60 + currM;
        expect(currMinutes - prevMinutes).toBe(10);
      }
    });

    it('day of week conversion: JS Sunday (0) → system (6)', () => {
      // 2024-06-16 is a Sunday → JS getDay()=0 → system dayOfWeek=6
      const now = new Date('2024-06-16T08:00:00');
      const openingHours: OpeningHour[] = [
        { dayOfWeek: 6, openTime: '10:00', closeTime: '11:00' },
      ];

      const slots = getAvailableSlots({ openingHours, date: sunday, now });

      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toBe('10:00');
    });

    it('day of week conversion: JS Monday (1) → system (0)', () => {
      // 2024-06-17 is a Monday → JS getDay()=1 → system dayOfWeek=0
      const now = new Date('2024-06-17T08:00:00');
      const openingHours: OpeningHour[] = [
        { dayOfWeek: 0, openTime: '10:00', closeTime: '11:00' },
      ];

      const slots = getAvailableSlots({ openingHours, date: monday, now });

      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toBe('10:00');
    });

    it('returns empty when no opening hours for the day', () => {
      // Monday (dayOfWeek=0) but only hours for Tuesday (dayOfWeek=1)
      const now = new Date('2024-06-17T08:00:00');
      const openingHours: OpeningHour[] = [
        { dayOfWeek: 1, openTime: '10:00', closeTime: '14:00' },
      ];

      const slots = getAvailableSlots({ openingHours, date: monday, now });

      expect(slots).toEqual([]);
    });

    it('handles multiple opening hour windows (lunch + dinner)', () => {
      // Restaurant open 12:00-15:00 and 19:00-23:00 on Monday
      const now = new Date('2024-06-17T08:00:00');
      const openingHours: OpeningHour[] = [
        { dayOfWeek: 0, openTime: '12:00', closeTime: '15:00' },
        { dayOfWeek: 0, openTime: '19:00', closeTime: '23:00' },
      ];

      const slots = getAvailableSlots({ openingHours, date: monday, now });

      // Should have slots from both windows
      expect(slots).toContain('12:00');
      expect(slots).toContain('14:50');
      expect(slots).not.toContain('15:00'); // closeTime exclusive
      expect(slots).toContain('19:00');
      expect(slots).toContain('22:50');
      expect(slots).not.toContain('23:00'); // closeTime exclusive

      // Gap between windows should have no slots
      expect(slots).not.toContain('16:00');
      expect(slots).not.toContain('18:00');
    });

    it('example from requirements: now=11:00, restaurant opens 13:00-16:00, slots start at 13:00', () => {
      // Req 7 Example 1: now=11:00, restaurant "Casa Tradición" open 13:00-16:00
      // minTime = 11:30, maxTime = 2 days later
      // Slots should start at 13:00 (first slot >= 11:30 within opening hours)
      const now = new Date('2024-06-17T11:00:00');
      const openingHours: OpeningHour[] = [
        { dayOfWeek: 0, openTime: '13:00', closeTime: '16:00' },
      ];

      const slots = getAvailableSlots({ openingHours, date: monday, now });

      expect(slots[0]).toBe('13:00');
      expect(slots).toContain('13:30'); // The slot the customer picks in the example
      expect(slots.at(-1)).toBe('15:50');
      // 13:00 to 15:50 = 18 slots (every 10 min)
      expect(slots.length).toBe(18);
    });

    it('returns empty when all slots are before lead time', () => {
      // Restaurant open 10:00-10:30 on Monday
      // now = Monday 10:10 → minTime = 10:40
      // All slots (10:00, 10:10, 10:20) are before minTime
      const now = new Date('2024-06-17T10:10:00');
      const openingHours: OpeningHour[] = [
        { dayOfWeek: 0, openTime: '10:00', closeTime: '10:30' },
      ];

      const slots = getAvailableSlots({ openingHours, date: monday, now });

      expect(slots).toEqual([]);
    });

    it('returns empty when target date is beyond max days', () => {
      // now = Monday 10:00 → maxTime = Wednesday 10:00
      // Requesting slots for Thursday (2024-06-20, dayOfWeek=3)
      const now = new Date('2024-06-17T10:00:00');
      const thursday = '2024-06-20';
      const openingHours: OpeningHour[] = [
        { dayOfWeek: 3, openTime: '10:00', closeTime: '14:00' },
      ];

      const slots = getAvailableSlots({ openingHours, date: thursday, now });

      expect(slots).toEqual([]);
    });

    it('supports custom slotIntervalMinutes', () => {
      const now = new Date('2024-06-17T08:00:00');
      const openingHours: OpeningHour[] = [
        { dayOfWeek: 0, openTime: '10:00', closeTime: '11:00' },
      ];

      const slots = getAvailableSlots({
        openingHours,
        date: monday,
        now,
        slotIntervalMinutes: 15,
      });

      expect(slots).toEqual(['10:00', '10:15', '10:30', '10:45']);
    });

    it('supports custom scheduleLeadTimeMin', () => {
      // now = Monday 12:30, custom lead time = 60 min → minTime = 13:30
      const now = new Date('2024-06-17T12:30:00');
      const openingHours: OpeningHour[] = [
        { dayOfWeek: 0, openTime: '13:00', closeTime: '14:00' },
      ];

      const slots = getAvailableSlots({
        openingHours,
        date: monday,
        now,
        scheduleLeadTimeMin: 60,
      });

      expect(slots[0]).toBe('13:30');
      expect(slots).not.toContain('13:00');
      expect(slots).not.toContain('13:20');
    });
  });
});
