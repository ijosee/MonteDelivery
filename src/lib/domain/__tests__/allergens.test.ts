import { describe, it, expect } from 'vitest';
import { EU_ALLERGENS } from '../allergens';
import type { Allergen } from '../allergens';

describe('EU_ALLERGENS', () => {
  it('contains exactly 14 allergens', () => {
    expect(EU_ALLERGENS).toHaveLength(14);
  });

  it('has unique ids from 1 to 14', () => {
    const ids = EU_ALLERGENS.map((a: Allergen) => a.id);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  it('has unique codes', () => {
    const codes = EU_ALLERGENS.map((a: Allergen) => a.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(14);
  });

  it('every allergen has all required fields', () => {
    for (const allergen of EU_ALLERGENS) {
      expect(allergen.id).toBeGreaterThanOrEqual(1);
      expect(allergen.code).toBeTruthy();
      expect(allergen.nameEs).toBeTruthy();
      expect(allergen.icon).toMatch(/\.svg$/);
    }
  });
});
