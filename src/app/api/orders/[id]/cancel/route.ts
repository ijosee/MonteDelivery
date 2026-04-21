import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { validateTransition } from "@/lib/domain/order-fsm";
import { logAudit } from "@/lib/services/audit.service";

/**
 * POST /api/orders/[id]/cancel — Cancel an order.
 * Uses FSM validation to check if cancellation is allowed.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    const { id } = await params;

    const supabase = await createClient();

    // 1. Get the order and verify ownership
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(
        "id, userId, currentStatus, fulfillmentType, scheduledFor, orderNumber"
      )
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      if (fetchError?.code === "PGRST116" || !order) {
        return NextResponse.json(
          { data: null, error: "Pedido no encontrado", success: false },
          { status: 404 }
        );
      }
      console.error("Error fetching order:", fetchError);
      return NextResponse.json(
        { data: null, error: "Error al cancelar el pedido", success: false },
        { status: 500 }
      );
    }

    if (order.userId !== authUser.id) {
      return NextResponse.json(
        { data: null, error: "Pedido no encontrado", success: false },
        { status: 404 }
      );
    }

    // 2. Validate the status transition (current → CANCELLED) using FSM
    const result = validateTransition({
      currentStatus: order.currentStatus,
      targetStatus: "CANCELLED",
      userRole: "CUSTOMER",
      fulfillmentType: order.fulfillmentType,
      scheduledFor: order.scheduledFor ? new Date(order.scheduledFor) : null,
    });

    if (!result.success) {
      return NextResponse.json(
        { data: null, error: result.error, success: false },
        { status: 422 }
      );
    }

    // 3. Update the order status to CANCELLED
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({ currentStatus: "CANCELLED" })
      .eq("id", id)
      .select("id, orderNumber, currentStatus")
      .single();

    if (updateError || !updatedOrder) {
      console.error("Error updating order status:", updateError);
      return NextResponse.json(
        { data: null, error: "Error al cancelar el pedido", success: false },
        { status: 500 }
      );
    }

    // 4. Insert a status history entry
    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert({
        orderId: id,
        fromStatus: order.currentStatus,
        toStatus: "CANCELLED",
        changedByUserId: authUser.id,
        reason: "Cancelado por el cliente",
      });

    if (historyError) {
      console.error("Error inserting status history:", historyError);
      // The order is already cancelled — log the error but don't fail the request
    }

    // Audit log (fire-and-forget)
    logAudit({
      userId: authUser.id,
      action: "ORDER_CANCELLED",
      resourceType: "order",
      resourceId: id,
      details: {
        orderNumber: order.orderNumber,
        fromStatus: order.currentStatus,
      },
    }).catch(() => {});

    // 5. Return the updated order
    return NextResponse.json({
      data: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.currentStatus,
      },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { data: null, error: "Error al cancelar el pedido", success: false },
      { status: 500 }
    );
  }
}
