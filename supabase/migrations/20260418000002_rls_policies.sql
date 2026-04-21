-- RLS Policies for Pueblo Delivery Marketplace
-- This migration enables Row Level Security on tables accessed with the anon key
-- and creates policies for user-scoped and public data access.
--
-- NOTE: auth.uid() returns UUID but our id/userId columns are TEXT,
-- so we cast auth.uid()::text for all comparisons.
--
-- Tables accessed ONLY with Service Role Key (no RLS policies needed):
--   - admin_audit_log
--   - restaurant_users
--   - order_status_history
--   - order_items
--   - delivery_zones
--   - sessions
--   - auth_accounts
--   - cookie_consents
--   - legal_acceptances
--   - phone_verifications
--   - geocoding_cache

-- ═══════════════════════════════════════════════════════════════
-- Enable RLS on user-scoped tables
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "carts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- Enable RLS on public-read tables
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE "restaurants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "opening_hours" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "allergens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_allergens" ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- Users: SELECT/UPDATE own profile
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "users_select_own"
  ON "users"
  FOR SELECT
  USING (auth.uid()::text = "id");

CREATE POLICY "users_update_own"
  ON "users"
  FOR UPDATE
  USING (auth.uid()::text = "id")
  WITH CHECK (auth.uid()::text = "id");

-- ═══════════════════════════════════════════════════════════════
-- Carts: CRUD own cart
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "carts_select_own"
  ON "carts"
  FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "carts_insert_own"
  ON "carts"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "carts_update_own"
  ON "carts"
  FOR UPDATE
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "carts_delete_own"
  ON "carts"
  FOR DELETE
  USING (auth.uid()::text = "userId");

-- ═══════════════════════════════════════════════════════════════
-- Cart Items: CRUD own items (via cart ownership)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "cart_items_select_own"
  ON "cart_items"
  FOR SELECT
  USING (
    auth.uid()::text = (SELECT "userId" FROM "carts" WHERE "carts"."id" = "cart_items"."cartId")
  );

CREATE POLICY "cart_items_insert_own"
  ON "cart_items"
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = (SELECT "userId" FROM "carts" WHERE "carts"."id" = "cart_items"."cartId")
  );

CREATE POLICY "cart_items_update_own"
  ON "cart_items"
  FOR UPDATE
  USING (
    auth.uid()::text = (SELECT "userId" FROM "carts" WHERE "carts"."id" = "cart_items"."cartId")
  )
  WITH CHECK (
    auth.uid()::text = (SELECT "userId" FROM "carts" WHERE "carts"."id" = "cart_items"."cartId")
  );

CREATE POLICY "cart_items_delete_own"
  ON "cart_items"
  FOR DELETE
  USING (
    auth.uid()::text = (SELECT "userId" FROM "carts" WHERE "carts"."id" = "cart_items"."cartId")
  );

-- ═══════════════════════════════════════════════════════════════
-- Addresses: CRUD own addresses
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "addresses_select_own"
  ON "addresses"
  FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "addresses_insert_own"
  ON "addresses"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "addresses_update_own"
  ON "addresses"
  FOR UPDATE
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "addresses_delete_own"
  ON "addresses"
  FOR DELETE
  USING (auth.uid()::text = "userId");

-- ═══════════════════════════════════════════════════════════════
-- Orders: SELECT own orders
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "orders_select_own"
  ON "orders"
  FOR SELECT
  USING (auth.uid()::text = "userId");

-- ═══════════════════════════════════════════════════════════════
-- Public read policies: restaurants, opening_hours, categories,
-- products, allergens, product_allergens
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "restaurants_select_public"
  ON "restaurants"
  FOR SELECT
  USING (true);

CREATE POLICY "opening_hours_select_public"
  ON "opening_hours"
  FOR SELECT
  USING (true);

CREATE POLICY "categories_select_public"
  ON "categories"
  FOR SELECT
  USING (true);

CREATE POLICY "products_select_public"
  ON "products"
  FOR SELECT
  USING (true);

CREATE POLICY "allergens_select_public"
  ON "allergens"
  FOR SELECT
  USING (true);

CREATE POLICY "product_allergens_select_public"
  ON "product_allergens"
  FOR SELECT
  USING (true);
