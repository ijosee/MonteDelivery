import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { createOrderSchema } from "@/lib/validators/order.schema";
import { ERRORS, formatError } from "@/lib/errors";
import { distanceKm, isInsideDeliveryZone } from "@/lib/domain/haversine";
import { computeEta } from "@/lib/domain/eta-calculator";
import { getAvailableSlots } from "@/lib/domain/slot-generator";
import { logAudit } from "@/lib/services/audit.service";

/**
 * GET /api/orders — Paginated order history for the authenticated user.
 * Query params: page (default 1), limit (default 10)
 * Ordered by createdAt desc.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") ?? "1", 10)
    );
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(searchParams.get("limit") ?? "10", 10))
    );
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = await createClient();

    const [ordersResult, countResult] = await Promise.all([
      supabase
        .from("orders")
        .select("*, restaurants(name)")
        .eq("userId", authUser.id)
        .order("createdAt", { ascending: false })
        .range(from, to),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("userId", authUser.id),
    ]);

    if (ordersResult.error) {
      console.error("Error fetching orders:", ordersResult.error);
      return NextResponse.json(
        { data: null, error: "Error al obtener los pedidos", success: false },
        { status: 500 }
      );
    }

    const orders = ordersResult.data ?? [];
    const total = countResult.count ?? 0;

    return NextResponse.json({
      data: {
        orders: orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          restaurantName: o.restaurants?.name ?? null,
          status: o.currentStatus,
          fulfillmentType: o.fulfillmentType,
          totalEur: Number(o.totalEur),
          eta: o.eta ?? null,
          createdAt: o.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { data: null, error: "Error al obtener los pedidos", success: false },
      { status: 500 }
    );
  }
}

/**
 * Helper: check if restaurant is currently open.
 */
function isRestaurantOpen(
  openingHours: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
  }[],
  now: Date = new Date()
): boolean {
  const jsDay = now.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return openingHours.some(
    (h) =>
      h.dayOfWeek === dayOfWeek &&
      currentTime >= h.openTime &&
      currentTime < h.closeTime
  );
}

/**
 * POST /api/orders — Create a new order.
 *
 * Flow:
 * 1. Validate with createOrderSchema (Zod)
 * 2. Check idempotency_key: if duplicate, return existing order (409)
 * 3. Verify restaurant is open for ASAP (error RESTAURANT_CLOSED)
 * 4. Verify slot is valid for SCHEDULED (error SLOT_UNAVAILABLE)
 * 5. Verify delivery zone with Haversine (error OUTSIDE_DELIVERY_ZONE)
 * 6. Verify all cart products are available (error PRODUCT_UNAVAILABLE)
 * 7. Calculate ETA with computeEta
 * 8. Create order via RPC (create_order_transaction) for atomicity
 * 9. Log to audit service
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
      return NextResponse.json(
        { data: null, error: firstError, success: false },
        { status: 422 }
      );
    }

    const {
      addressId,
      phone,
      fulfillmentType,
      scheduledFor,
      idempotencyKey,
    } = parsed.data;

    const supabase = await createClient();

    // 2. Check idempotency_key: if duplicate, return existing order
    const { data: existingOrder } = await supabase
      .from("orders")
      .select(
        "id, orderNumber, currentStatus, totalEur, eta, etaWindowEnd, fulfillmentType, createdAt"
      )
      .eq("idempotencyKey", idempotencyKey)
      .single();

    if (existingOrder) {
      return NextResponse.json(
        {
          data: {
            id: existingOrder.id,
            orderNumber: existingOrder.orderNumber,
            status: existingOrder.currentStatus,
            totalEur: Number(existingOrder.totalEur),
            eta: existingOrder.eta ?? null,
            etaWindowEnd: existingOrder.etaWindowEnd ?? null,
            fulfillmentType: existingOrder.fulfillmentType,
            createdAt: existingOrder.createdAt,
          },
          error: null,
          success: true,
        },
        { status: 409 }
      );
    }

    // Fetch user's address (with lat/lng for zone validation)
    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .select("id, userId, street, municipality, city, postalCode, lat, lng")
      .eq("id", addressId)
      .single();

    if (addressError || !address || address.userId !== authUser.id) {
      return NextResponse.json(
        { data: null, error: "Dirección no encontrada", success: false },
        { status: 404 }
      );
    }

    // Fetch user's cart with items and product details
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select(
        "id, restaurantId, cart_items(id, productId, quantity, products(id, name, priceEur, isAvailable, categoryId, categories(restaurantId)))"
      )
      .eq("userId", authUser.id)
      .single();

    if (cartError && cartError.code !== "PGRST116") {
      console.error("Error fetching cart:", cartError);
      return NextResponse.json(
        { data: null, error: "Error al obtener el carrito", success: false },
        { status: 500 }
      );
    }

    if (!cart?.cart_items?.length) {
      return NextResponse.json(
        {
          data: null,
          error: ERRORS.CART_EMPTY.message,
          code: ERRORS.CART_EMPTY.code,
          success: false,
        },
        { status: 422 }
      );
    }

    const restaurantId = cart.restaurantId;
    if (!restaurantId) {
      return NextResponse.json(
        {
          data: null,
          error: "El carrito no tiene restaurante asociado",
          success: false,
        },
        { status: 422 }
      );
    }

    // Fetch restaurant details
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("*, opening_hours(dayOfWeek, openTime, closeTime)")
      .eq("id", restaurantId)
      .single();

    if (restaurantError || !restaurant.isActive) {
      return NextResponse.json(
        {
          data: null,
          error: "Restaurante no encontrado o inactivo",
          success: false,
        },
        { status: 404 }
      );
    }

    const now = new Date();
    const openingHours = restaurant.opening_hours ?? [];

    // 3. Verify restaurant is open for ASAP
    if (fulfillmentType === "ASAP") {
      if (!isRestaurantOpen(openingHours, now)) {
        return NextResponse.json(
          {
            data: null,
            error: ERRORS.RESTAURANT_CLOSED.message,
            code: ERRORS.RESTAURANT_CLOSED.code,
            title: ERRORS.RESTAURANT_CLOSED.title,
            action: ERRORS.RESTAURANT_CLOSED.action,
            success: false,
          },
          { status: 422 }
        );
      }
    }

    // 4. Verify slot is valid for SCHEDULED
    if (fulfillmentType === "SCHEDULED" && scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      const dateStr = scheduledDate.toISOString().split("T")[0];

      const availableSlots = getAvailableSlots({
        openingHours,
        date: dateStr,
        now,
      });

      const requestedSlot = `${String(scheduledDate.getHours()).padStart(2, "0")}:${String(scheduledDate.getMinutes()).padStart(2, "0")}`;

      if (!availableSlots.includes(requestedSlot)) {
        return NextResponse.json(
          {
            data: null,
            error: ERRORS.SLOT_UNAVAILABLE.message,
            code: ERRORS.SLOT_UNAVAILABLE.code,
            title: ERRORS.SLOT_UNAVAILABLE.title,
            action: ERRORS.SLOT_UNAVAILABLE.action,
            success: false,
          },
          { status: 422 }
        );
      }
    }

    // 5. Verify delivery zone with Haversine
    const distance = distanceKm(
      address.lat,
      address.lng,
      restaurant.lat,
      restaurant.lng
    );

    if (
      !isInsideDeliveryZone(
        address.lat,
        address.lng,
        restaurant.lat,
        restaurant.lng,
        restaurant.deliveryRadiusKm
      )
    ) {
      const errorMsg = formatError(ERRORS.OUTSIDE_DELIVERY_ZONE, {
        maxRadius: restaurant.deliveryRadiusKm.toFixed(1),
        distance: distance.toFixed(1),
      });
      return NextResponse.json(
        {
          data: null,
          error: errorMsg.message,
          code: ERRORS.OUTSIDE_DELIVERY_ZONE.code,
          title: ERRORS.OUTSIDE_DELIVERY_ZONE.title,
          action: ERRORS.OUTSIDE_DELIVERY_ZONE.action,
          success: false,
        },
        { status: 422 }
      );
    }

    // 6. Verify all cart products are available
    for (const item of cart.cart_items) {
      if (!item.products?.isAvailable) {
        const errorMsg = formatError(ERRORS.PRODUCT_UNAVAILABLE, {
          productName: item.products?.name ?? "Producto",
        });
        return NextResponse.json(
          {
            data: null,
            error: errorMsg.message,
            code: ERRORS.PRODUCT_UNAVAILABLE.code,
            title: ERRORS.PRODUCT_UNAVAILABLE.title,
            action: ERRORS.PRODUCT_UNAVAILABLE.action,
            success: false,
          },
          { status: 422 }
        );
      }
    }

    // Calculate subtotal and total
    const subtotalEur = cart.cart_items.reduce(
      (sum, item) => sum + Number(item.products!.priceEur) * item.quantity,
      0
    );
    const deliveryFeeEur = Number(restaurant.deliveryFeeEur);
    const totalEur = subtotalEur + deliveryFeeEur;

    // Count total items for ETA
    const totalItems = cart.cart_items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Count active orders for queue factor
    const { count: activeOrderCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("restaurantId", restaurantId)
      .in("currentStatus", [
        "PLACED",
        "ACCEPTED",
        "PREPARING",
        "READY_FOR_PICKUP",
        "OUT_FOR_DELIVERY",
      ]);

    // 7. Calculate ETA
    const scheduledForDate = scheduledFor ? new Date(scheduledFor) : null;
    const etaResult = computeEta({
      fulfillmentType,
      itemCount: totalItems,
      distanceKm: distance,
      activeOrderCount: activeOrderCount ?? 0,
      scheduledFor: scheduledForDate,
      now,
    });

    // 8. Create order via RPC (create_order_transaction) for atomicity
    const rpcItems = cart.cart_items.map((item) => ({
      productId: item.products!.id,
      productName: item.products!.name,
      productPriceEur: Number(item.products!.priceEur),
      quantity: item.quantity,
    }));

    const { data: orderResult, error: rpcError } = await supabase.rpc(
      "create_order_transaction",
      {
        p_user_id: authUser.id,
        p_restaurant_id: restaurantId,
        p_address_id: addressId,
        p_phone: phone,
        p_fulfillment_type: fulfillmentType,
        p_scheduled_for: scheduledForDate?.toISOString() ?? null,
        p_subtotal_eur: Math.round(subtotalEur * 100) / 100,
        p_delivery_fee_eur: Math.round(deliveryFeeEur * 100) / 100,
        p_total_eur: Math.round(totalEur * 100) / 100,
        p_eta: etaResult.eta.toISOString(),
        p_eta_window_end: etaResult.etaWindowEnd?.toISOString() ?? null,
        p_idempotency_key: idempotencyKey,
        p_items: rpcItems,
      }
    );

    if (rpcError) {
      console.error("Error creating order (RPC):", rpcError);
      return NextResponse.json(
        { data: null, error: "Error al crear el pedido", success: false },
        { status: 500 }
      );
    }

    // The RPC returns a JSONB object with the created order data
    const order = orderResult as {
      id: string;
      orderNumber: number;
      currentStatus: string;
      fulfillmentType: string;
      subtotalEur: number;
      deliveryFeeEur: number;
      totalEur: number;
      eta: string | null;
      etaWindowEnd: string | null;
      createdAt: string;
    };

    // 9. Log to audit service (fire-and-forget, outside transaction)
    logAudit({
      userId: authUser.id,
      action: "ORDER_CREATED",
      resourceType: "order",
      resourceId: order.id,
      details: {
        orderNumber: order.orderNumber,
        restaurantId,
        fulfillmentType,
        totalEur,
      },
    }).catch(() => {
      // Audit logging should not block the response
    });

    return NextResponse.json(
      {
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.currentStatus,
          fulfillmentType: order.fulfillmentType,
          subtotalEur: Number(order.subtotalEur),
          deliveryFeeEur: Number(order.deliveryFeeEur),
          totalEur: Number(order.totalEur),
          eta: order.eta ?? null,
          etaWindowEnd: order.etaWindowEnd ?? null,
          createdAt: order.createdAt,
        },
        error: null,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { data: null, error: "Error al crear el pedido", success: false },
      { status: 500 }
    );
  }
}
