# Requirements Document

## Introduction

This specification covers a UX polish pass for the Pueblo Delivery marketplace app. A UX audit identified color inconsistencies, missing feedback mechanisms, and misleading navigation elements that degrade the user experience. This document defines requirements to unify the brand color scheme, add add-to-cart feedback, surface cart information on desktop, preview delivery fees in the cart page, display cart quantity on product cards, and fix a misleading bottom navigation link.

## Glossary

- **App**: The Pueblo Delivery Next.js web application
- **Brand_Green**: The primary brand color (`green-600` / `#16a34a` in Tailwind) used for the header, hero section, restaurant cards, and product "Añadir" buttons
- **Header**: The sticky top navigation bar rendered by `Header.tsx`, visible on all pages
- **BottomNav**: The mobile-only bottom navigation bar rendered by `BottomNav.tsx`, showing four icon links
- **FABCart**: The floating action button for the cart rendered by `FABCart.tsx`, currently visible only on mobile
- **ProductCard**: The product display component rendered by `ProductCard.tsx`, showing product image, name, price, allergens, and an "Añadir" button
- **CartSummary**: The cart subtotal display component rendered by `CartSummary.tsx`, shown on the cart page
- **Cart_Page**: The `/carrito` route displaying the user's current cart items and summary
- **Button_Component**: The reusable `Button.tsx` UI component with variant styles
- **Customer**: An authenticated user with the CUSTOMER role

## Requirements

### Requirement 1: Unified Brand Green Color Scheme

**User Story:** As a Customer, I want the app to use a consistent green color scheme across all pages, so that the brand feels cohesive and trustworthy.

#### Acceptance Criteria

1. THE App SHALL use Brand_Green (`green-600`) as the primary action color for all interactive buttons, links, and focus rings across all pages
2. WHEN the Login page is displayed, THE App SHALL render the submit button, input focus rings, and text links using Brand_Green instead of blue
3. WHEN the Registration page is displayed, THE App SHALL render the submit button, input focus rings, and text links using Brand_Green instead of blue
4. WHEN the Cart_Page is displayed, THE App SHALL render the "Ver restaurantes" link, "Ir al checkout" button, and loading spinner using Brand_Green instead of blue
5. WHEN the FABCart is displayed, THE FABCart SHALL use Brand_Green (`green-600`) as its background color instead of blue
6. THE Button_Component SHALL use Brand_Green (`green-600`) for its `primary` variant instead of blue
7. WHEN the BottomNav is displayed, THE BottomNav SHALL use Brand_Green for the active link color and focus ring instead of blue
8. WHEN the Profile page is displayed, THE App SHALL use Brand_Green for the avatar background and focus rings instead of blue

### Requirement 2: Add-to-Cart Success Feedback

**User Story:** As a Customer, I want to see visual confirmation when I add a product to my cart, so that I know the action succeeded.

#### Acceptance Criteria

1. WHEN a product is successfully added to the cart, THE ProductCard SHALL display a success state on the "Añadir" button for 1500 milliseconds
2. WHEN the success state is active, THE ProductCard SHALL change the button text from "Añadir" to "✓ Añadido" and apply a distinct visual style (e.g., `green-700` background)
3. WHILE the success state is active on one ProductCard, WHEN another product is added, THE ProductCard for the new product SHALL display its own success state independently
4. WHEN the 1500-millisecond duration elapses, THE ProductCard SHALL revert the button to its default "Añadir" state

### Requirement 3: Desktop Cart Badge in Header

**User Story:** As a Customer using a desktop browser, I want to see the number of items in my cart from the header navigation, so that I always know my cart status without scrolling.

#### Acceptance Criteria

1. WHILE the Customer has items in the cart, THE Header SHALL display a numeric badge next to the "Carrito" link showing the total item count
2. THE Header cart badge SHALL be visible on desktop viewports (screen width ≥ 640px)
3. WHEN the cart is empty, THE Header SHALL display the "Carrito" link without a badge
4. WHEN an item is added to or removed from the cart, THE Header cart badge SHALL update to reflect the new total item count

### Requirement 4: Delivery Fee Preview in Cart Summary

**User Story:** As a Customer, I want to see the delivery fee and estimated total on the cart page, so that I know the full cost before starting checkout.

#### Acceptance Criteria

1. WHEN the Cart_Page is displayed with items, THE CartSummary SHALL show the subtotal, the delivery fee, and the estimated total
2. THE CartSummary SHALL retrieve the delivery fee from the restaurant associated with the current cart
3. THE CartSummary SHALL calculate the estimated total as subtotal plus delivery fee
4. WHILE the delivery fee is loading, THE CartSummary SHALL display a loading indicator in place of the fee amount
5. IF the delivery fee cannot be retrieved, THEN THE CartSummary SHALL display "Consultar en checkout" in place of the fee amount

### Requirement 5: Fix BottomNav "Buscar" Misleading Link

**User Story:** As a Customer, I want the bottom navigation labels to accurately describe their destinations, so that I am not confused by misleading icons.

#### Acceptance Criteria

1. THE BottomNav SHALL label the second navigation item as "Explorar" instead of "Buscar"
2. THE BottomNav SHALL use a home/compass icon (🧭) for the "Explorar" item instead of the search icon (🔍)
3. WHEN the "Explorar" item is tapped, THE BottomNav SHALL navigate to the home page (`/`) instead of `/como-funciona`

### Requirement 6: Product Card Cart Quantity Indicator

**User Story:** As a Customer, I want to see how many of a product are already in my cart when browsing the menu, so that I can make informed ordering decisions without checking the cart.

#### Acceptance Criteria

1. WHILE a product exists in the cart with quantity ≥ 1, THE ProductCard SHALL display the current cart quantity as a badge on or near the "Añadir" button
2. WHEN the product is not in the cart, THE ProductCard SHALL display only the "Añadir" button without a quantity badge
3. WHEN the cart quantity for a product changes, THE ProductCard SHALL update the displayed quantity to reflect the new value
