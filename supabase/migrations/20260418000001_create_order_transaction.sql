-- Create RPC function for atomic order creation
-- Replaces the Prisma $transaction in POST /api/orders
--
-- Steps:
--   1. Insert into orders
--   2. Insert order_items from JSONB array
--   3. Insert initial order_status_history entry (PLACED)
--   4. Clear cart (delete cart_items, set cart.restaurantId to NULL)
--   5. Return created order as JSONB

CREATE OR REPLACE FUNCTION create_order_transaction(
  p_user_id TEXT,
  p_restaurant_id TEXT,
  p_address_id TEXT,
  p_phone TEXT,
  p_fulfillment_type "FulfillmentType",
  p_scheduled_for TIMESTAMP(3),
  p_subtotal_eur NUMERIC(10,2),
  p_delivery_fee_eur NUMERIC(10,2),
  p_total_eur NUMERIC(10,2),
  p_eta TIMESTAMP(3),
  p_eta_window_end TIMESTAMP(3),
  p_idempotency_key TEXT,
  p_items JSONB -- [{"productId", "productName", "productPriceEur", "quantity"}]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_cart_id TEXT;
  v_item JSONB;
  v_now TIMESTAMP(3) := NOW();
BEGIN
  -- 1. Create the order
  INSERT INTO orders (
    "userId", "restaurantId", "addressId", "phone",
    "fulfillmentType", "scheduledFor",
    "subtotalEur", "deliveryFeeEur", "totalEur",
    "currentStatus", "eta", "etaWindowEnd",
    "idempotencyKey", "createdAt", "updatedAt"
  )
  VALUES (
    p_user_id, p_restaurant_id, p_address_id, p_phone,
    p_fulfillment_type, p_scheduled_for,
    p_subtotal_eur, p_delivery_fee_eur, p_total_eur,
    'PLACED', p_eta, p_eta_window_end,
    p_idempotency_key, v_now, v_now
  )
  RETURNING * INTO v_order;

  -- 2. Create order items from JSONB array
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      "orderId", "productId", "productName", "productPriceEur", "quantity", "createdAt"
    )
    VALUES (
      v_order.id,
      v_item->>'productId',
      v_item->>'productName',
      (v_item->>'productPriceEur')::NUMERIC(10,2),
      (v_item->>'quantity')::INT,
      v_now
    );
  END LOOP;

  -- 3. Create initial status history entry (PLACED)
  INSERT INTO order_status_history (
    "orderId", "fromStatus", "toStatus", "changedByUserId", "createdAt"
  )
  VALUES (
    v_order.id, NULL, 'PLACED', p_user_id, v_now
  );

  -- 4. Clear the cart (delete cart_items and set restaurantId to NULL)
  SELECT id INTO v_cart_id FROM carts WHERE "userId" = p_user_id;
  IF v_cart_id IS NOT NULL THEN
    DELETE FROM cart_items WHERE "cartId" = v_cart_id;
    UPDATE carts SET "restaurantId" = NULL, "updatedAt" = v_now WHERE id = v_cart_id;
  END IF;

  -- 5. Return the created order as JSONB
  RETURN jsonb_build_object(
    'id', v_order.id,
    'orderNumber', v_order."orderNumber",
    'currentStatus', v_order."currentStatus",
    'fulfillmentType', v_order."fulfillmentType",
    'subtotalEur', v_order."subtotalEur",
    'deliveryFeeEur', v_order."deliveryFeeEur",
    'totalEur', v_order."totalEur",
    'eta', v_order.eta,
    'etaWindowEnd', v_order."etaWindowEnd",
    'createdAt', v_order."createdAt"
  );
END;
$$;
