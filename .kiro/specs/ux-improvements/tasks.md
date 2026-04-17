# Implementation Plan: UX Improvements

## Overview

A presentation-layer polish pass that unifies the color scheme (blue → green), adds add-to-cart feedback, introduces a desktop cart badge, previews delivery fees in the cart summary, fixes a misleading BottomNav link, and shows cart quantity on product cards. Changes touch ~12 existing files and introduce 1 new client component (`CartBadge`). No API routes, database migrations, or new pages are added — except a one-line serializer change to include `deliveryFeeEur` in the cart API response.

## Tasks

- [x] 1. Unify brand color: shared UI components
  - [x] 1.1 Update Button.tsx color classes
    - In `src/components/ui/Button.tsx`, replace `bg-blue-600` → `bg-green-600`, `hover:bg-blue-700` → `hover:bg-green-700`, `focus:ring-blue-500` → `focus:ring-green-500` in the `primary` variant
    - Replace `focus:ring-blue-500` → `focus:ring-green-500` in the `secondary` and `ghost` variants
    - _Requirements: 1.6_
  - [x] 1.2 Update Input.tsx focus color classes
    - In `src/components/ui/Input.tsx`, replace `focus:ring-blue-500` → `focus:ring-green-500` and `focus:border-blue-500` → `focus:border-green-500`
    - _Requirements: 1.1_
  - [x] 1.3 Update BottomNav.tsx colors
    - In `src/components/layout/BottomNav.tsx`, replace `text-blue-600` → `text-green-600` (active link) and `focus:ring-blue-500` → `focus:ring-green-500`
    - _Requirements: 1.7_
  - [x] 1.4 Update FABCart.tsx background color
    - In `src/components/cart/FABCart.tsx`, replace `bg-blue-600` → `bg-green-600` and `hover:bg-blue-700` → `hover:bg-green-700`
    - _Requirements: 1.5_

- [x] 2. Unify brand color: page-level components
  - [x] 2.1 Update Login page colors
    - In `src/app/(public)/auth/login/page.tsx`, replace all `focus:border-blue-500` → `focus:border-green-500`, `focus:ring-blue-500` → `focus:ring-green-500`, `bg-blue-600` → `bg-green-600`, `hover:bg-blue-700` → `hover:bg-green-700`, `text-blue-600` → `text-green-600`
    - _Requirements: 1.2_
  - [x] 2.2 Update Register page colors
    - In `src/app/(public)/auth/registro/page.tsx`, apply the same blue → green replacements as the login page
    - _Requirements: 1.3_
  - [x] 2.3 Update Cart page colors
    - In `src/app/(customer)/carrito/page.tsx`, replace `border-blue-600` → `border-green-600` (spinner), `bg-blue-600` → `bg-green-600` and `hover:bg-blue-700` → `hover:bg-green-700` (links and buttons)
    - _Requirements: 1.4_
  - [x] 2.4 Update Profile page colors
    - In `src/app/(customer)/perfil/page.tsx`, replace `bg-blue-100` → `bg-green-100` (avatar) and `focus:ring-blue-500` → `focus:ring-green-500` (nav links)
    - _Requirements: 1.8_

- [x] 3. Fix BottomNav "Buscar" link
  - In `src/components/layout/BottomNav.tsx`, change `NAV_ITEMS[1]` from `{ href: '/como-funciona', label: 'Buscar', icon: '🔍' }` to `{ href: '/', label: 'Explorar', icon: '🧭' }`
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 4. Add-to-cart success feedback on ProductCard
  - [x] 4.1 Add `isAdded` and `cartQuantity` props to ProductCard
    - In `src/components/product/ProductCard.tsx`, add optional props `isAdded?: boolean` and `cartQuantity?: number` to `ProductCardProps`
    - When `isAdded` is true, change the button text to "✓ Añadido" with `bg-green-700` background
    - When `cartQuantity >= 1`, show a small badge with the quantity near the "Añadir" button
    - _Requirements: 2.1, 2.2, 6.1, 6.2_
  - [x] 4.2 Pass `isAdded` and `cartQuantity` from CategoryTabs to ProductCard
    - In `src/app/(public)/restaurante/[slug]/CategoryTabs.tsx`, pass `isAdded={addedProductId === product.id}` to each `<ProductCard>`
    - Use `useCart()` to access `cart.items` and pass `cartQuantity={cart.items.find(i => i.productId === product.id)?.quantity ?? 0}` to each `<ProductCard>`
    - _Requirements: 2.1, 2.3, 2.4, 6.1, 6.3_

- [x] 5. Checkpoint — Verify color and feedback changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Desktop cart badge in Header
  - [x] 6.1 Create CartBadge client component
    - Create `src/components/cart/CartBadge.tsx` as a `'use client'` component
    - Use `useCart()` to get `itemCount`; render a green badge with the count; return `null` when `itemCount === 0` or while loading
    - _Requirements: 3.1, 3.3, 3.4_
  - [x] 6.2 Compose CartBadge into Header
    - In `src/components/layout/Header.tsx`, import `CartBadge` and render it next to the "🛒 Carrito" link in the desktop nav (the `sm:flex` section)
    - The Header remains a server component; CartBadge is a client island
    - _Requirements: 3.1, 3.2_

- [x] 7. Delivery fee preview in CartSummary
  - [x] 7.1 Add `deliveryFeeEur` to CartDTO and cart API response
    - In `src/types/index.ts`, add `deliveryFeeEur: number | null` to `CartDTO`
    - In `src/app/api/cart/route.ts` GET handler, include `deliveryFeeEur` from the restaurant join (add `deliveryFeeEur: true` to the restaurant select, serialize as `Number(cart.restaurant?.deliveryFeeEur) ?? null`)
    - Update the empty-cart response to include `deliveryFeeEur: null`
    - Update `EMPTY_CART` in `src/hooks/use-cart.ts` to include `deliveryFeeEur: null`
    - _Requirements: 4.2_
  - [x] 7.2 Extend CartSummary to display delivery fee and estimated total
    - In `src/components/cart/CartSummary.tsx`, add props `deliveryFeeEur?: number | null`, `isLoadingFee?: boolean`, `feeError?: boolean`
    - Display three rows: Subtotal, Envío (delivery fee), Total estimado
    - When `isLoadingFee` is true, show a loading indicator for the fee
    - When `feeError` is true, show "Consultar en checkout" instead of the fee
    - Calculate total as `subtotalEur + (deliveryFeeEur ?? 0)` rounded to 2 decimal places
    - _Requirements: 4.1, 4.3, 4.4, 4.5_
  - [x] 7.3 Wire delivery fee into the cart page
    - In `src/app/(customer)/carrito/page.tsx`, pass `deliveryFeeEur={cart.deliveryFeeEur}` to `<CartSummary>`
    - _Requirements: 4.1_
  - [ ]* 7.4 Write property test: CartSummary total = subtotal + deliveryFee
    - **Property 1: Cart total equals subtotal plus delivery fee**
    - Generate random `subtotalEur` (0–999.99) and `deliveryFeeEur` (0–20.00) using `fast-check`, render `CartSummary`, assert displayed total equals `(subtotalEur + deliveryFeeEur).toFixed(2)`
    - Minimum 100 iterations
    - **Validates: Requirements 4.1, 4.3**

- [x] 8. Final checkpoint — Ensure all tests pass and lint is clean
  - Run `pnpm test` and `pnpm lint`
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The design uses TypeScript throughout — all implementation follows the existing Next.js + Tailwind + Vitest stack
- Property test uses `fast-check` (already in devDependencies) with Vitest
