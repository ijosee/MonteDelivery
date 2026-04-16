import { describe, it, expect } from 'vitest';
import {
  computeEta,
  PREP_TIME_BASE,
  PREP_TIME_PER_ITEM,
  QUEUE_THRESHOLD,
  QUEUE_FACTOR_PER_ORDER,
  TRAVEL_TIME_PER_KM,
  BUFFER_MINUTES,
  SCHEDULED_WINDOW,
} from '../eta-calculator';

describe('eta-calculator', () => {
  describe('constants', () => {
    it('should have correct MVP constants', () => {
      expect(PREP_TIME_BASE).toBe(20);
      expect(PREP_TIME_PER_ITEM).toBe(2);
      expect(QUEUE_THRESHOLD).toBe(3);
      expect(QUEUE_FACTOR_PER_ORDER).toBe(3);
      expect(TRAVEL_TIME_PER_KM).toBe(4);
      expect(BUFFER_MINUTES).toBe(8);
      expect(SCHEDULED_WINDOW).toBe(10);
    });
  });

  describe('computeEta — ASAP', () => {
    const now = new Date('2024-06-15T13:00:00Z');

    it('ASAP with no queue: 3 items, 1.5 km, 2 active orders → total 40 min', () => {
      // Req 9.1 example: 3 items, 1.5 km, 2 active orders
      // prepTime = 20 + (3 * 2) = 26
      // queueFactor = max(0, (2 - 3) * 3) = 0
      // travelTime = ceil(1.5 * 4) = 6
      // buffer = 8
      // total = 26 + 0 + 6 + 8 = 40
      const result = computeEta({
        fulfillmentType: 'ASAP',
        itemCount: 3,
        distanceKm: 1.5,
        activeOrderCount: 2,
        now,
      });

      expect(result.breakdown.prepTime).toBe(26);
      expect(result.breakdown.queueFactor).toBe(0);
      expect(result.breakdown.travelTime).toBe(6);
      expect(result.breakdown.buffer).toBe(8);
      expect(result.breakdown.totalMinutes).toBe(40);
      expect(result.eta.getTime()).toBe(now.getTime() + 40 * 60000);
      expect(result.etaWindowEnd).toBeUndefined();
    });

    it('ASAP with queue: 5 items, 2.0 km, 6 active orders → total 55 min', () => {
      // Req 9.2 example: 5 items, 2.0 km, 6 active orders
      // prepTime = 20 + (5 * 2) = 30
      // queueFactor = max(0, (6 - 3) * 3) = 9
      // travelTime = ceil(2.0 * 4) = 8
      // buffer = 8
      // total = 30 + 9 + 8 + 8 = 55
      const result = computeEta({
        fulfillmentType: 'ASAP',
        itemCount: 5,
        distanceKm: 2.0,
        activeOrderCount: 6,
        now,
      });

      expect(result.breakdown.prepTime).toBe(30);
      expect(result.breakdown.queueFactor).toBe(9);
      expect(result.breakdown.travelTime).toBe(8);
      expect(result.breakdown.buffer).toBe(8);
      expect(result.breakdown.totalMinutes).toBe(55);
      expect(result.eta.getTime()).toBe(now.getTime() + 55 * 60000);
      expect(result.etaWindowEnd).toBeUndefined();
    });

    it('eta is always > now for ASAP', () => {
      const result = computeEta({
        fulfillmentType: 'ASAP',
        itemCount: 1,
        distanceKm: 0,
        activeOrderCount: 0,
        now,
      });

      // Even with minimal inputs: prepTime=22, queueFactor=0, travelTime=0, buffer=8 → 30 min
      expect(result.eta.getTime()).toBeGreaterThan(now.getTime());
    });

    it('queueFactor is 0 when activeOrderCount equals threshold', () => {
      const result = computeEta({
        fulfillmentType: 'ASAP',
        itemCount: 1,
        distanceKm: 1,
        activeOrderCount: QUEUE_THRESHOLD,
        now,
      });

      expect(result.breakdown.queueFactor).toBe(0);
    });

    it('travelTime uses Math.ceil for fractional km', () => {
      const result = computeEta({
        fulfillmentType: 'ASAP',
        itemCount: 1,
        distanceKm: 0.1,
        activeOrderCount: 0,
        now,
      });

      // ceil(0.1 * 4) = ceil(0.4) = 1
      expect(result.breakdown.travelTime).toBe(1);
    });
  });

  describe('computeEta — SCHEDULED', () => {
    it('returns scheduledFor as eta with 10 min window', () => {
      const scheduledFor = new Date('2024-06-15T14:00:00Z');

      const result = computeEta({
        fulfillmentType: 'SCHEDULED',
        itemCount: 3,
        distanceKm: 2.0,
        activeOrderCount: 5,
        scheduledFor,
      });

      expect(result.eta).toBe(scheduledFor);
      expect(result.etaWindowEnd).toEqual(
        new Date(scheduledFor.getTime() + SCHEDULED_WINDOW * 60000)
      );
      // Verify the window is exactly 10 minutes
      expect(result.etaWindowEnd!.getTime() - result.eta.getTime()).toBe(10 * 60000);
    });

    it('breakdown is all zeros for SCHEDULED', () => {
      const scheduledFor = new Date('2024-06-15T20:00:00Z');

      const result = computeEta({
        fulfillmentType: 'SCHEDULED',
        itemCount: 10,
        distanceKm: 5.0,
        activeOrderCount: 8,
        scheduledFor,
      });

      expect(result.breakdown.prepTime).toBe(0);
      expect(result.breakdown.queueFactor).toBe(0);
      expect(result.breakdown.travelTime).toBe(0);
      expect(result.breakdown.buffer).toBe(0);
      expect(result.breakdown.totalMinutes).toBe(0);
    });

    it('falls back to ASAP calculation when SCHEDULED has no scheduledFor', () => {
      const now = new Date('2024-06-15T13:00:00Z');

      const result = computeEta({
        fulfillmentType: 'SCHEDULED',
        itemCount: 3,
        distanceKm: 1.5,
        activeOrderCount: 2,
        now,
      });

      // Should compute as ASAP since scheduledFor is missing
      expect(result.breakdown.totalMinutes).toBe(40);
      expect(result.etaWindowEnd).toBeUndefined();
    });
  });
});
