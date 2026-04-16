import { describe, it, expect } from 'vitest';
import { normalizeAddress } from '../geocoding.service';

describe('normalizeAddress', () => {
  it('converts to lowercase', () => {
    expect(normalizeAddress('Calle Mayor 5')).toBe('calle mayor 5');
  });

  it('removes diacritics', () => {
    expect(normalizeAddress('Cádiz Málaga Córdoba')).toBe('cadiz malaga cordoba');
  });

  it('normalizes whitespace', () => {
    expect(normalizeAddress('  Calle   Mayor   5  ')).toBe('calle mayor 5');
  });

  it('handles empty string', () => {
    expect(normalizeAddress('')).toBe('');
  });

  it('handles combined transformations', () => {
    expect(normalizeAddress('  Avenida de la Constitución  23, Séville  ')).toBe(
      'avenida de la constitucion 23, seville',
    );
  });

  it('produces same key for equivalent addresses', () => {
    const a = normalizeAddress('Calle Córdoba 10');
    const b = normalizeAddress('calle cordoba  10');
    expect(a).toBe(b);
  });
});
