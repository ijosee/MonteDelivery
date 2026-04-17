# Add-to-Cart Fix — Bugfix Design

## Overview

The "Añadir" (Add to cart) button is missing from product cards on the restaurant menu page because `CategoryTabs` renders `<ProductCard>` without passing the `onAdd` prop. Since `ProductCard` conditionally renders the button only when `onAdd` is provided, users have no way to add products to their cart.

The fix is a wiring change: `CategoryTabs` will call `useCart().addItem()` and pass a handler as the `onAdd` prop to each `ProductCard`. Additionally, the component must handle the 409 restaurant-conflict response by showing a confirmation dialog (using the existing `Dialog` component), and provide visual feedback when an item is successfully added.

## Glossary

- **Bug_Condition (C)**: `ProductCard` is rendered inside `CategoryTabs` without an `onAdd` prop, causing the "Añadir" button to be hidden
- **Property (P)**: Every `ProductCard` rendered by `CategoryTabs` receives an `onAdd` handler that calls `useCart().addItem(productId)`, making the "Añadir" button visible and functional
- **Preservation**: Existing product card display (name, description, price, image, allergens), category tab switching, empty-category messaging, and FABCart behavior must remain unchanged
- **`CategoryTabs`**: Client component in `src/app/(public)/restaurante/[slug]/CategoryTabs.tsx` that renders category navigation tabs and a grid of `ProductCard` components
- **`ProductCard`**: Component in `src/components/product/ProductCard.tsx` that displays a product and conditionally renders an "Añadir" button when `onAdd` is provided
- **`useCart()`**: Hook in `src/hooks/use-cart.ts` that manages cart state; its `addItem` method returns `{success, conflict, message}` and its `clearAndAdd` method clears the cart before adding
- **`Dialog`**: Accessible modal component in `src/components/ui/Dialog.tsx` using the native `<dialog>` element with backdrop click and ESC-to-close support

## Bug Details

### Bug Condition

The bug manifests when `CategoryTabs` renders `ProductCard` components without passing the `onAdd` prop. Because `ProductCard` uses `{onAdd && (<button>...</button>)}` to conditionally render the "Añadir" button, the button never appears and users cannot add items to their cart.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { component: CategoryTabs, product: Product }
  OUTPUT: boolean

  renderedCard := CategoryTabs.render(input.product)
  RETURN renderedCard.props.onAdd IS undefined
END FUNCTION
```

### Examples

- **Example 1**: User visits `/restaurante/pizza-place`, sees "Margherita — 8.50 €" but no "Añadir" button. Expected: "Añadir" button visible, clicking it adds Margherita to cart.
- **Example 2**: User visits `/restaurante/sushi-bar`, sees "Salmon Roll — 12.00 €" but no "Añadir" button. Expected: "Añadir" button visible, clicking it adds Salmon Roll to cart.
- **Example 3**: User has pizza in cart, visits `/restaurante/sushi-bar`, clicks "Añadir" on Salmon Roll. Expected: confirmation dialog asks whether to clear cart and switch restaurants. Currently: no button exists, so the conflict path is never reached.
- **Edge case**: User visits a category with 0 products. Expected: "No hay productos disponibles en esta categoría" message (unchanged — no ProductCards rendered, so no onAdd needed).

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Product cards must continue to display name, description, price, image, and allergen badges exactly as before
- Category tab switching must continue to show the correct products for the selected category
- The `useCart()` hook and `/api/cart/items` API are not modified — their behavior is inherently preserved
- The FABCart component continues to update automatically via the `useCart` hook
- Empty categories continue to show the "No hay productos disponibles en esta categoría" message

**Scope:**
All rendering and interaction paths that do NOT involve the `onAdd` prop or the "Añadir" button should be completely unaffected by this fix. This includes:
- Product card visual layout and content
- Category tab navigation and active-tab state
- FABCart display and link behavior
- Restaurant header and opening hours display

## Hypothesized Root Cause

Based on the code analysis, the root cause is clear and singular:

1. **Missing prop wiring in `CategoryTabs`**: Line 76 of `CategoryTabs.tsx` renders `<ProductCard key={product.id} product={product} />` without passing `onAdd`. The `ProductCard` component already supports `onAdd?: (productId: string) => void` and conditionally renders the button — the only missing piece is the prop.

2. **No `useCart` hook usage in `CategoryTabs`**: Since `CategoryTabs` is already a `'use client'` component, it can call `useCart()` directly. However, it currently does not import or use the hook, so there is no `addItem` function available to pass as `onAdd`.

3. **No conflict handling UI**: Even once `onAdd` is wired, the component needs to handle the `{conflict: true}` response from `addItem` by showing a confirmation dialog. The existing `Dialog` component from `src/components/ui/Dialog.tsx` can be used for this.

4. **No success feedback**: There is no visual indication when an item is added successfully. A brief inline animation or state change on the button would improve UX.

## Correctness Properties

Property 1: Bug Condition — Añadir Button Appears and Triggers addItem

_For any_ product rendered inside `CategoryTabs`, the `ProductCard` SHALL receive a defined `onAdd` callback, causing the "Añadir" button to be visible. When clicked, the callback SHALL call `useCart().addItem(product.id)` and, on success, the cart state SHALL update to include the new item.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — Product Card Display and Tab Navigation Unchanged

_For any_ product rendered inside `CategoryTabs`, the product card SHALL continue to display the product name, description, price, image, and allergen badges identically to the unfixed version. Category tab switching SHALL continue to show the correct products for the selected tab. The empty-category message SHALL continue to appear for categories with no products.

**Validates: Requirements 3.1, 3.2, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/app/(public)/restaurante/[slug]/CategoryTabs.tsx`

**Specific Changes**:

1. **Import `useCart` hook**: Add `import { useCart } from '@/hooks/use-cart'` and `import { Dialog } from '@/components/ui'` (or direct import).

2. **Call `useCart()` in component body**: Destructure `addItem` and `clearAndAdd` from the hook inside the `CategoryTabs` function.

3. **Add conflict dialog state**: Add `useState` for `conflictOpen` (boolean) and `pendingProductId` (string | null) to manage the restaurant-conflict confirmation flow.

4. **Create `handleAdd` handler**: Implement an async function that:
   - Calls `addItem(productId)`
   - If result is `{success: true}`: show brief success feedback (e.g., button text changes to "✓ Añadido" for ~1.5s)
   - If result is `{conflict: true}`: store `productId` in `pendingProductId` and set `conflictOpen = true`
   - If result is `{success: false, conflict: false}`: show error feedback

5. **Create `handleConfirmConflict` handler**: Implement an async function that:
   - Calls `clearAndAdd(pendingProductId)`
   - Closes the dialog and clears `pendingProductId`

6. **Pass `onAdd={handleAdd}` to each `ProductCard`**: Update the JSX from `<ProductCard key={product.id} product={product} />` to `<ProductCard key={product.id} product={product} onAdd={handleAdd} />`.

7. **Render conflict `Dialog`**: Add a `<Dialog>` at the end of the component JSX that shows when `conflictOpen` is true, with a message explaining the restaurant switch and "Cancelar" / "Cambiar restaurante" buttons.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Test Plan**: Render `CategoryTabs` with mock categories/products and inspect the rendered output for the presence of "Añadir" buttons. Run on UNFIXED code to confirm they are absent.

**Test Cases**:
1. **Button Absence Test**: Render `CategoryTabs` with products — assert "Añadir" button is NOT present (will pass on unfixed code, confirming the bug)
2. **onAdd Prop Test**: Inspect rendered `ProductCard` props — assert `onAdd` is undefined (will pass on unfixed code)
3. **Click Attempt Test**: Attempt to find and click "Añadir" — assert it fails because the button doesn't exist (will pass on unfixed code)

**Expected Counterexamples**:
- No "Añadir" button found in the rendered output of `CategoryTabs`
- Root cause confirmed: `ProductCard` is rendered without `onAdd` prop

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL product IN categories.flatMap(c => c.products) DO
  render := CategoryTabs_fixed(categories)
  card := findProductCard(render, product.id)
  ASSERT card.props.onAdd IS DEFINED
  ASSERT card contains "Añadir" button
  simulateClick("Añadir")
  ASSERT addItem was called with product.id
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL categories WHERE products exist DO
  renderOriginal := CategoryTabs_original(categories)
  renderFixed := CategoryTabs_fixed(categories)
  
  // Product display is preserved (ignoring the new button)
  FOR ALL product IN categories.flatMap(c => c.products) DO
    ASSERT productName(renderFixed, product.id) = productName(renderOriginal, product.id)
    ASSERT productPrice(renderFixed, product.id) = productPrice(renderOriginal, product.id)
    ASSERT productAllergens(renderFixed, product.id) = productAllergens(renderOriginal, product.id)
  END FOR
  
  // Tab switching is preserved
  FOR ALL category IN categories DO
    switchTab(renderFixed, category.id)
    ASSERT visibleProducts(renderFixed) = category.products
  END FOR
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many product/category configurations automatically
- It catches edge cases like empty categories, single products, or many allergens
- It provides strong guarantees that display behavior is unchanged

**Test Plan**: Observe rendering behavior on UNFIXED code for product display and tab switching, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Product Display Preservation**: Verify product name, description, price, image, and allergens render identically after fix
2. **Tab Switching Preservation**: Verify switching categories shows correct products after fix
3. **Empty Category Preservation**: Verify empty categories still show the placeholder message after fix

### Unit Tests

- Test that `handleAdd` calls `addItem` with the correct `productId`
- Test that `handleAdd` opens conflict dialog when `addItem` returns `{conflict: true}`
- Test that `handleConfirmConflict` calls `clearAndAdd` and closes the dialog
- Test that success feedback appears briefly after a successful add
- Test edge case: rapid clicks on "Añadir" (debounce or disable during request)

### Property-Based Tests

- Generate random category/product configurations and verify every rendered `ProductCard` has an `onAdd` prop and an "Añadir" button
- Generate random category/product configurations and verify product display fields (name, price, allergens) match input data identically
- Generate random tab-switch sequences and verify the correct products are shown for each active category

### Integration Tests

- Test full add-to-cart flow: render page → click "Añadir" → verify cart updates via mocked API
- Test restaurant conflict flow: mock 409 response → verify dialog appears → click "Cambiar restaurante" → verify `clearAndAdd` is called
- Test conflict cancellation: mock 409 response → verify dialog appears → click "Cancelar" → verify cart is unchanged
