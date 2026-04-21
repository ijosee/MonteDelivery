import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserWithRole } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/rbac";
import type { OrderStatus, FulfillmentType } from "@/types/database";

/**
 * Helper: get the restaurant ID for the current user via restaurant_users table.
 */
async function getUserRestaurantId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data: ru } = await supabase
    .from("restaurant_users")
    .select("restaurantId")
    .eq("userId", userId)
    .limit(1)
    .single();
  return ru?.restaurantId ?? null;
}

/**
 * GET /api/restaurant/orders — Orders for the user's restaurant.
 * Query params: status, fulfillmentType, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    requirePermission(authUser.role, "orders:read_restaurant");

    const supabase = await createClient();

    const restaurantId = await getUserRestaurantId(supabase, authUser.id);
    if (!restaurantId) {
      return NextResponse.json(
        { data: null, error: "No tienes un restaurante asociado", success: false },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const fulfillmentType = searchParams.get("fulfillmentType");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build the orders query
    let ordersQuery = supabase
      .from("orders")
      .select(
        "*, users(name, email), addresses(street, municipality, postalCode, floorDoor), order_items(productName, productPriceEur, quantity)"
      )
      .eq("restaurantId", restaurantId)
      .order("createdAt", { ascending: false })
      .range(from, to);

    if (status) ordersQuery = ordersQuery.eq("currentStatus", status as OrderStatus);
    if (fulfillmentType) ordersQuery = ordersQuery.eq("fulfillmentType", fulfillmentType as FulfillmentType);

    // Build the count query
    let countQuery = supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("restaurantId", restaurantId);

    if (status) countQuery = countQuery.eq("currentStatus", status as OrderStatus);
    if (fulfillmentType) countQuery = countQuery.eq("fulfillmentType", fulfillmentType as FulfillmentType);

    const [ordersResult, countResult] = await Promise.all([ordersQuery, countQuery]);

    if (ordersResult.error) {
      console.error("Error fetching restaurant orders:", ordersResult.error);
      return NextResponse.json(
        { data: null, error: "Error al obtener pedidos", success: false },
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
          customerName: (o.users as unknown as { name: string })?.name ?? null,
          customerEmail: (o.users as unknown as { email: string })?.email ?? null,
          status: o.currentStatus,
          fulfillmentType: o.fulfillmentType,
          scheduledFor: o.scheduledFor ?? null,
          subtotalEur: Number(o.subtotalEur),
          deliveryFeeEur: Number(o.deliveryFeeEur),
          totalEur: Number(o.totalEur),
          eta: o.eta ?? null,
          phone: o.phone,
          address: o.addresses,
          items: (o.order_items as unknown as { productName: string; productPriceEur: number; quantity: number }[] ?? []).map(
            (i) => ({
              productName: i.productName,
              productPriceEur: Number(i.productPriceEur),
              quantity: i.quantity,
            })
          ),
          createdAt: o.createdAt,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener pedidos";
    const status = message.includes("permisos") ? 403 : 500;
    return NextResponse.json(
      { data: null, error: message, success: false },
      { status }
    );
  }
}
