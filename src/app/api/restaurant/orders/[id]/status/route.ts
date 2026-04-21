import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserWithRole } from "@/lib/auth/session";
import { validateTransition } from "@/lib/domain/order-fsm";
import { computeEta } from "@/lib/domain/eta-calculator";
import { distanceKm } from "@/lib/domain/haversine";
import { logAudit } from "@/lib/services/audit.service";
import { requirePermission } from "@/lib/auth/rbac";
import type { OrderStatus } from "@/types/database";

/**
 * POST /api/restaurant/orders/[id]/status — Change order status per FSM.
 * Body: { status: OrderStatus }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    requirePermission(authUser.role, "orders:change_status");

    const { id } = await params;
    const body = await request.json();
    const targetStatus = body.status as OrderStatus;

    if (!targetStatus) {
      return NextResponse.json(
        { data: null, error: "El estado destino es obligatorio", success: false },
        { status: 422 }
      );
    }

    const supabase = await createClient();

    // Fetch the order with restaurant, address, and items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, orderNumber, currentStatus, fulfillmentType, scheduledFor, restaurantId, restaurants(id, lat, lng), addresses(lat, lng), order_items(quantity)"
      )
      .eq("id", id)
      .single();

    if (orderError || !order) {
      if (orderError?.code === "PGRST116" || !order) {
        return NextResponse.json(
          { data: null, error: "Pedido no encontrado", success: false },
          { status: 404 }
        );
      }
      console.error("Error fetching order:", orderError);
      return NextResponse.json(
        { data: null, error: "Error al cambiar estado", success: false },
        { status: 500 }
      );
    }

    // Verify user belongs to the restaurant
    const { data: ru } = await supabase
      .from("restaurant_users")
      .select("restaurantId")
      .eq("userId", authUser.id)
      .eq("restaurantId", order.restaurantId)
      .limit(1)
      .single();

    if (!ru) {
      return NextResponse.json(
        { data: null, error: "No tienes permisos para este pedido", success: false },
        { status: 403 }
      );
    }

    const result = validateTransition({
      currentStatus: order.currentStatus,
      targetStatus,
      userRole: authUser.role as "RESTAURANT_OWNER" | "RESTAURANT_STAFF",
      fulfillmentType: order.fulfillmentType,
      scheduledFor: order.scheduledFor ? new Date(order.scheduledFor) : null,
    });

    if (!result.success) {
      return NextResponse.json(
        { data: null, error: result.error, success: false },
        { status: 422 }
      );
    }

    // Recalculate ETA on status change
    const restaurant = order.restaurants as unknown as { id: string; lat: number; lng: number };
    const address = order.addresses as unknown as { lat: number; lng: number };
    const items = order.order_items as unknown as { quantity: number }[];

    const totalItems = items.reduce((s: number, i) => s + i.quantity, 0);
    const dist = distanceKm(address.lat, address.lng, restaurant.lat, restaurant.lng);

    const { count: activeCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("restaurantId", order.restaurantId)
      .in("currentStatus", [
        "PLACED",
        "ACCEPTED",
        "PREPARING",
        "READY_FOR_PICKUP",
        "OUT_FOR_DELIVERY",
      ]);

    const etaResult = computeEta({
      fulfillmentType: order.fulfillmentType,
      itemCount: totalItems,
      distanceKm: dist,
      activeOrderCount: activeCount ?? 0,
      scheduledFor: order.scheduledFor ? new Date(order.scheduledFor) : null,
    });

    // Update order status
    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({
        currentStatus: targetStatus,
        eta: etaResult.eta.toISOString(),
        etaWindowEnd: etaResult.etaWindowEnd?.toISOString() ?? null,
      })
      .eq("id", id)
      .select("id, orderNumber, currentStatus")
      .single();

    if (updateError || !updated) {
      console.error("Error updating order:", updateError);
      return NextResponse.json(
        { data: null, error: "Error al cambiar estado", success: false },
        { status: 500 }
      );
    }

    // Insert status history
    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert({
        orderId: id,
        fromStatus: order.currentStatus,
        toStatus: targetStatus,
        changedByUserId: authUser.id,
      });

    if (historyError) {
      console.error("Error inserting status history:", historyError);
    }

    // Audit log (fire-and-forget)
    logAudit({
      userId: authUser.id,
      action: "ORDER_STATUS_CHANGED",
      resourceType: "order",
      resourceId: id,
      details: {
        orderNumber: order.orderNumber,
        fromStatus: order.currentStatus,
        toStatus: targetStatus,
      },
    }).catch(() => {});

    return NextResponse.json({
      data: {
        id: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.currentStatus,
      },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cambiar estado";
    const status = message.includes("permisos") ? 403 : 500;
    return NextResponse.json(
      { data: null, error: message, success: false },
      { status }
    );
  }
}
