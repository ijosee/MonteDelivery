import { describe, it, expect } from 'vitest';
import { distanceKm, isInsideDeliveryZone, EARTH_RADIUS_KM } from '../haversine';

describe('haversine', () => {
  describe('EARTH_RADIUS_KM', () => {
    it('should be 6371', () => {
      expect(EARTH_RADIUS_KM).toBe(6371);
    });
  });

  describe('distanceKm', () => {
    it('returns 0 for the same point', () => {
      const d = distanceKm(37.3891, -5.9845, 37.3891, -5.9845);
      expect(d).toBe(0);
    });

    it('is symmetric: d(A,B) === d(B,A)', () => {
      const sevillaLat = 37.3891, sevillaLng = -5.9845;
      const cordobaLat = 37.8882, cordobaLng = -4.7794;

      const dAB = distanceKm(sevillaLat, sevillaLng, cordobaLat, cordobaLng);
      const dBA = distanceKm(cordobaLat, cordobaLng, sevillaLat, sevillaLng);

      expect(dAB).toBeCloseTo(dBA, 10);
    });

    it('is non-negative', () => {
      const d = distanceKm(37.3891, -5.9845, 37.8882, -4.7794);
      expect(d).toBeGreaterThanOrEqual(0);
    });

    it('computes known distance: Sevilla to Córdoba ≈ 120 km', () => {
      // Sevilla (37.3891, -5.9845) to Córdoba (37.8882, -4.7794)
      // Actual Haversine distance with these coords is ~119.7 km
      const d = distanceKm(37.3891, -5.9845, 37.8882, -4.7794);
      expect(d).toBeGreaterThan(115);
      expect(d).toBeLessThan(125);
    });
  });

  describe('isInsideDeliveryZone', () => {
    it('returns true when distance <= radius', () => {
      // Same point, any positive radius
      const result = isInsideDeliveryZone(37.3891, -5.9845, 37.3891, -5.9845, 5);
      expect(result).toBe(true);
    });

    it('returns true when distance equals radius (boundary)', () => {
      const sevillaLat = 37.3891, sevillaLng = -5.9845;
      const cordobaLat = 37.8882, cordobaLng = -4.7794;
      const exactDistance = distanceKm(sevillaLat, sevillaLng, cordobaLat, cordobaLng);

      const result = isInsideDeliveryZone(sevillaLat, sevillaLng, cordobaLat, cordobaLng, exactDistance);
      expect(result).toBe(true);
    });

    it('returns false when distance > radius', () => {
      // Sevilla to Córdoba is ~132 km, radius of 10 km should be outside
      const result = isInsideDeliveryZone(37.3891, -5.9845, 37.8882, -4.7794, 10);
      expect(result).toBe(false);
    });
  });
});
