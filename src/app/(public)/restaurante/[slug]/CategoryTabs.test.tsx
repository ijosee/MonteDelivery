// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import CategoryTabs from './CategoryTabs';

/**
 * Bug Condition Exploration Test
 *
 * **Validates: Requirements 1.1, 2.1**
 *
 * Property 1: Bug Condition — Añadir Button Missing from ProductCards in CategoryTabs
 *
 * This test generates arbitrary product/category configurations and asserts that
 * every rendered ProductCard contains an "Añadir" button.
 *
 * On UNFIXED code this test is EXPECTED TO FAIL, confirming the bug exists:
 * CategoryTabs renders ProductCard without the onAdd prop, so the button is hidden.
 */

// Mock next/image to render a plain <img> tag
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, unoptimized, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

// Mock useCart hook so the component can render without real cart infrastructure
vi.mock('@/contexts/cart-context', () => ({
  useCart: () => ({
    cart: { id: '', restaurantId: null, restaurantName: null, deliveryFeeEur: null, items: [], subtotalEur: 0 },
    isLoading: false,
    error: null,
    itemCount: 0,
    fetchCart: vi.fn(),
    addItem: vi.fn().mockResolvedValue({ success: true, conflict: false, message: null }),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    clearAndAdd: vi.fn(),
  }),
}));

// --- fast-check arbitraries ---

const allergenArb = fc.record({
  id: fc.integer({ min: 1, max: 100 }),
  code: fc.string({ minLength: 1, maxLength: 5 }),
  nameEs: fc.string({ minLength: 1, maxLength: 20 }),
  icon: fc.constant('gluten.svg'),
});

const productArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  priceEur: fc.double({ min: 0.01, max: 999.99, noNaN: true }),
  imageUrl: fc.constant('/placeholder.png'),
  allergens: fc.array(allergenArb, { minLength: 0, maxLength: 3 }),
});

const categoryArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  sortOrder: fc.integer({ min: 0, max: 10 }),
  products: fc.array(productArb, { minLength: 1, maxLength: 5 }),
});

const categoriesArb = fc.array(categoryArb, { minLength: 1, maxLength: 4 });

describe('CategoryTabs — Bug Condition Exploration', () => {
  it('every ProductCard should have an "Añadir" button (property-based)', () => {
    fc.assert(
      fc.property(categoriesArb, (categories) => {
        const { unmount } = render(<CategoryTabs categories={categories} />);

        // The first category is active by default, so its products are rendered
        const firstCategory = categories[0];
        const productCount = firstCategory.products.length;

        // Query all buttons with name "Añadir"
        const addButtons = screen.queryAllByRole('button', { name: 'Añadir' });

        // Every product in the active category should have an "Añadir" button
        expect(addButtons.length).toBe(productCount);

        unmount();
      }),
      { numRuns: 20 }
    );
  });
});


// --- Preservation property tests (Task 2) ---
// These tests verify existing behavior BEFORE implementing the fix.
// They MUST PASS on unfixed code to establish a baseline for regression prevention.

/**
 * Preservation Property Tests
 *
 * **Validates: Requirements 3.1, 3.2, 3.5**
 *
 * Property 2: Preservation — Product Display and Tab Navigation Unchanged
 *
 * These tests generate arbitrary category/product configurations and verify that
 * product names, prices, and empty-category messaging render correctly.
 * They run on UNFIXED code and are expected to PASS, establishing baseline behavior.
 */

// Generator for product names that contain at least one visible (non-whitespace) character
const visibleNameArb = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => s.trim().length > 0);

// Product arbitrary with unique IDs and visible names for preservation tests
const preservationProductArb = fc.record({
  id: fc.uuid(),
  name: visibleNameArb,
  description: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  priceEur: fc.double({ min: 0.01, max: 999.99, noNaN: true }),
  imageUrl: fc.constant('/placeholder.png'),
  allergens: fc.array(allergenArb, { minLength: 0, maxLength: 3 }),
});

// Category with at least 1 product using visible names
const preservationCategoryArb = fc.record({
  id: fc.uuid(),
  name: visibleNameArb,
  sortOrder: fc.integer({ min: 0, max: 10 }),
  products: fc.array(preservationProductArb, { minLength: 1, maxLength: 5 }),
});

const preservationCategoriesArb = fc.array(preservationCategoryArb, { minLength: 1, maxLength: 4 });

// Arbitrary for a category that has an empty products array
const emptyCategoryArb = fc.record({
  id: fc.uuid(),
  name: visibleNameArb,
  sortOrder: fc.integer({ min: 0, max: 10 }),
  products: fc.constant([] as Array<{
    id: string;
    name: string;
    description: string | null;
    priceEur: number;
    imageUrl: string;
    allergens: Array<{ id: number; code: string; nameEs: string; icon: string }>;
  }>),
});

describe('CategoryTabs — Preservation Properties', () => {
  it('every product name appears in the rendered output (property-based)', () => {
    fc.assert(
      fc.property(preservationCategoriesArb, (categories) => {
        const { unmount, container } = render(<CategoryTabs categories={categories} />);

        // The first category is active by default
        const firstCategory = categories[0];
        for (const product of firstCategory.products) {
          // Use within(container) to scope queries to this render only
          const found = container.querySelectorAll('h3');
          const names = Array.from(found).map((el) => el.textContent);
          expect(names).toContain(product.name);
        }

        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('every product price (formatted as X.XX €) appears in the rendered output (property-based)', () => {
    fc.assert(
      fc.property(preservationCategoriesArb, (categories) => {
        const { unmount, container } = render(<CategoryTabs categories={categories} />);

        const firstCategory = categories[0];
        for (const product of firstCategory.products) {
          const formattedPrice = `${product.priceEur.toFixed(2)} €`;
          // Search within the container to avoid cross-render collisions
          const priceElements = container.querySelectorAll('.text-green-600');
          const prices = Array.from(priceElements).map((el) => el.textContent?.trim());
          expect(prices).toContain(formattedPrice);
        }

        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('a category with empty products array shows the empty-state message (property-based)', () => {
    fc.assert(
      fc.property(emptyCategoryArb, (emptyCategory) => {
        const { unmount, container } = render(<CategoryTabs categories={[emptyCategory]} />);

        expect(container.textContent).toContain(
          'No hay productos disponibles en esta categoría.'
        );

        unmount();
      }),
      { numRuns: 10 }
    );
  });
});
