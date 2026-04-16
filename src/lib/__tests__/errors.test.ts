import { describe, it, expect } from 'vitest';
import { ERRORS, formatError } from '../errors';

describe('ERRORS', () => {
  const expectedCodes = [
    'OUTSIDE_SERVICE_AREA',
    'ADDRESS_NOT_FOUND',
    'OUTSIDE_DELIVERY_ZONE',
    'RESTAURANT_CLOSED',
    'SLOT_UNAVAILABLE',
    'PRODUCT_UNAVAILABLE',
    'PRODUCT_IMAGE_REQUIRED',
    'INVALID_TRANSITION',
    'CANCEL_NOT_ALLOWED_ASAP',
    'CANCEL_NOT_ALLOWED_SCHEDULED',
    'FORBIDDEN',
    'TOO_MANY_ATTEMPTS',
    'NO_RESTAURANTS_FOUND',
    'CART_EMPTY',
    'CART_DIFFERENT_RESTAURANT',
  ];

  it('contains all expected error codes', () => {
    for (const code of expectedCodes) {
      expect(ERRORS).toHaveProperty(code);
    }
  });

  it('every error has required fields', () => {
    for (const key of Object.keys(ERRORS)) {
      const error = ERRORS[key as keyof typeof ERRORS];
      expect(error.code).toBe(key);
      expect(typeof error.title).toBe('string');
      expect(typeof error.message).toBe('string');
      expect(typeof error.action).toBe('string');
      expect(typeof error.httpStatus).toBe('number');
    }
  });
});

describe('formatError', () => {
  it('returns the error unchanged when no params provided', () => {
    const result = formatError(ERRORS.FORBIDDEN);
    expect(result.message).toBe('No tienes permisos para realizar esta acción.');
  });

  it('replaces placeholders with provided values', () => {
    const result = formatError(ERRORS.OUTSIDE_DELIVERY_ZONE, {
      maxRadius: 5,
      distance: 7.3,
    });
    expect(result.message).toBe(
      'Este restaurante reparte hasta 5 km y tu dirección está a 7.3 km.'
    );
  });

  it('replaces product name placeholder', () => {
    const result = formatError(ERRORS.PRODUCT_UNAVAILABLE, {
      productName: 'Tortilla Española',
    });
    expect(result.message).toBe(
      'El producto Tortilla Española ya no está disponible. Por favor, revisa tu carrito.'
    );
  });

  it('replaces transition status placeholders', () => {
    const result = formatError(ERRORS.INVALID_TRANSITION, {
      fromStatus: 'DELIVERED',
      toStatus: 'PREPARING',
    });
    expect(result.message).toBe(
      'Transición de estado no válida: no se puede pasar de DELIVERED a PREPARING.'
    );
  });

  it('does not mutate the original error object', () => {
    const original = ERRORS.OUTSIDE_DELIVERY_ZONE;
    formatError(original, { maxRadius: 5, distance: 7 });
    expect(original.message).toContain('{maxRadius}');
  });
});
