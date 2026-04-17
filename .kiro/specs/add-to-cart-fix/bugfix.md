# Bugfix Requirements Document

## Introduction

The "Añadir" (Add to cart) button does not appear on product cards when a user visits a restaurant's menu page (`/restaurante/[slug]`). The `CategoryTabs` component renders `ProductCard` components but does not pass the `onAdd` prop, so the button is conditionally hidden. All underlying cart infrastructure (API, hook, button logic) already exists and works correctly — the only missing piece is wiring the `onAdd` prop in `CategoryTabs` to call `useCart().addItem()`.

This prevents users from adding any products to their cart from the restaurant menu, which is a core e-commerce flow.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user visits `/restaurante/[slug]` and views product cards THEN the system does not display the "Añadir" button on any product card because `CategoryTabs` renders `<ProductCard>` without passing the `onAdd` prop

1.2 WHEN a user visits `/restaurante/[slug]` THEN the system provides no mechanism to add products to the cart from the menu page

1.3 WHEN a user visits `/restaurante/[slug]` and a product from a different restaurant is already in the cart THEN the system does not present a restaurant conflict dialog because there is no add-to-cart interaction to trigger the 409 conflict response

### Expected Behavior (Correct)

2.1 WHEN a user visits `/restaurante/[slug]` and views product cards THEN the system SHALL display an "Añadir" button on each product card by passing an `onAdd` handler from `CategoryTabs` to each `ProductCard`

2.2 WHEN a user clicks the "Añadir" button on a product card THEN the system SHALL add the product to the cart by calling `useCart().addItem(productId)` and the FABCart SHALL update to reflect the new item count and subtotal

2.3 WHEN a user clicks "Añadir" and the cart already contains items from a different restaurant (409 conflict response) THEN the system SHALL present a confirmation dialog allowing the user to either cancel or clear the existing cart and add the new item

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user visits `/restaurante/[slug]` THEN the system SHALL CONTINUE TO display product cards with name, description, price, image, and allergen badges

3.2 WHEN a user switches between category tabs THEN the system SHALL CONTINUE TO show the correct products for the selected category

3.3 WHEN the `useCart().addItem()` method is called with a valid product THEN the system SHALL CONTINUE TO send a POST request to `/api/cart/items` and update the cart state on success

3.4 WHEN the cart has items THEN the FABCart component SHALL CONTINUE TO display the floating cart button with the correct item count and subtotal

3.5 WHEN a restaurant has no available products in a category THEN the system SHALL CONTINUE TO display the "No hay productos disponibles en esta categoría" message

---

## Bug Condition (Formal)

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ProductCardRender (a ProductCard rendered inside CategoryTabs)
  OUTPUT: boolean

  // The bug triggers when CategoryTabs renders a ProductCard without the onAdd prop
  RETURN X.onAdd = undefined
END FUNCTION
```

```pascal
// Property: Fix Checking — Añadir button appears and works
FOR ALL X WHERE isBugCondition(X) DO
  render ← CategoryTabs'(categories)
  productCard ← findProductCard(render, X.product.id)
  ASSERT productCard.onAdd IS DEFINED
  ASSERT productCard displays "Añadir" button
  ASSERT clicking "Añadir" calls useCart().addItem(X.product.id)
END FOR
```

```pascal
// Property: Preservation Checking — Non-buggy behavior unchanged
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```
