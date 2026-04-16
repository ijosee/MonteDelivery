import { describe, it, expect } from 'vitest';
import { createOrderSchema } from '../order.schema';
import { createAddressSchema } from '../address.schema';
import { createProductSchema } from '../product.schema';
import { registerSchema, loginSchema, resetPasswordSchema } from '../auth.schema';

describe('createOrderSchema', () => {
  const validOrder = {
    addressId: 'cm1234567890123456789012345',
    phone: '+34612345678',
    fulfillmentType: 'ASAP' as const,
    idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
  };

  it('accepts a valid ASAP order', () => {
    const result = createOrderSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it('accepts a valid SCHEDULED order with scheduledFor', () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      fulfillmentType: 'SCHEDULED',
      scheduledFor: '2025-01-15T14:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects SCHEDULED without scheduledFor', () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      fulfillmentType: 'SCHEDULED',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid phone format', () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      phone: '612345678',
    });
    expect(result.success).toBe(false);
  });

  it('rejects phone with wrong prefix', () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      phone: '+33612345678',
    });
    expect(result.success).toBe(false);
  });

  it('rejects phone with too few digits', () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      phone: '+3461234567',
    });
    expect(result.success).toBe(false);
  });
});

describe('createAddressSchema', () => {
  const validAddress = {
    street: 'Calle Mayor 1',
    municipality: 'Ronda',
    city: 'Málaga',
    postalCode: '29400',
  };

  it('accepts a valid address', () => {
    const result = createAddressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it('accepts address with optional fields', () => {
    const result = createAddressSchema.safeParse({
      ...validAddress,
      floorDoor: '2ºB',
      label: 'Casa',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid postal code (4 digits)', () => {
    const result = createAddressSchema.safeParse({
      ...validAddress,
      postalCode: '2940',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid postal code (6 digits)', () => {
    const result = createAddressSchema.safeParse({
      ...validAddress,
      postalCode: '294001',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid postal code (letters)', () => {
    const result = createAddressSchema.safeParse({
      ...validAddress,
      postalCode: '29A00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty street', () => {
    const result = createAddressSchema.safeParse({
      ...validAddress,
      street: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('createProductSchema', () => {
  const validProduct = {
    categoryId: 'cm1234567890123456789012345',
    name: 'Burger Clásica',
    priceEur: 8.5,
    imageUrl: 'https://example.com/burger.jpg',
    allergenIds: [1, 3, 7],
  };

  it('accepts a valid product', () => {
    const result = createProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('accepts product with optional description', () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      description: 'Deliciosa hamburguesa clásica',
    });
    expect(result.success).toBe(true);
  });

  it('rejects product without imageUrl with exact message', () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      imageUrl: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const imageIssue = result.error.issues.find((i) =>
        i.path.includes('imageUrl'),
      );
      expect(imageIssue?.message).toBe(
        'La imagen del producto es obligatoria.',
      );
    }
  });

  it('rejects product with negative price', () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      priceEur: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects product with zero price', () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      priceEur: 0,
    });
    expect(result.success).toBe(false);
  });

  it('accepts product with empty allergenIds array', () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      allergenIds: [],
    });
    expect(result.success).toBe(true);
  });
});

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      name: 'Juan García',
      email: 'juan@example.com',
      password: 'securepass123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'Juan García',
      email: 'not-an-email',
      password: 'securepass123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      name: 'Juan García',
      email: 'juan@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = registerSchema.safeParse({
      name: '',
      email: 'juan@example.com',
      password: 'securepass123',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'juan@example.com',
      password: 'securepass123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid',
      password: 'securepass123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'juan@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid reset data', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'some-reset-token',
      password: 'newsecurepass',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'some-reset-token',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });
});
