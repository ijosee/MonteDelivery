import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";

/**
 * GET /api/orders/[id] — Get order details for the authenticated user.
 */
export async function GET(
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

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "*, order_items(id, productName, productPriceEur, quantity), order_status_history(fromStatus, toStatus, reason, createdAt), restaurants(name), addresses(street, municipality, city, postalCode, floorDoor)"
      )
      .eq("id", id)
      .single();

    if (error || !order) {
      if (error?.code === "PGRST116" || !order) {
        return NextResponse.json(
          { data: null, error: "Pedido no encontrado", success: false },
          { status: 404 }
        );
      }
      console.error("Error fetching order:", error);
      return NextResponse.json(
        { data: null, error: "Error al obtener el pedido", success: false },
        { status: 500 }
      );
    }

    // Verify the order belongs to the authenticated user
    if (order.userId !== authUser.id) {
      return NextResponse.json(
        { data: null, error: "Pedido no encontrado", success: false },
        { status: 404 }
      );
    }

    // Sort status history by createdAt ascending
    const statusHistory = (order.order_status_history ?? []).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return NextResponse.json({
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        restaurantName: order.restaurants?.name ?? null,
        status: order.currentStatus,
        fulfillmentType: order.fulfillmentType,
        scheduledFor: order.scheduledFor ?? null,
        subtotalEur: Number(order.subtotalEur),
        deliveryFeeEur: Number(order.deliveryFeeEur),
        totalEur: Number(order.totalEur),
        eta: order.eta ?? null,
        etaWindowEnd: order.etaWindowEnd ?? null,
        phone: order.phone,
        address: order.addresses
          ? {
              street: order.addresses.street,
              municipality: order.addresses.municipality,
              city: order.addresses.city,
              postalCode: order.addresses.postalCode,
              floorDoor: order.addresses.floorDoor,
            }
          : null,
        items: (order.order_items ?? []).map((item) => ({
          id: item.id,
          productName: item.productName,
          productPriceEur: Number(item.productPriceEur),
          quantity: item.quantity,
        })),
        statusHistory: statusHistory.map((h) => ({
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          reason: h.reason,
          createdAt: h.createdAt,
        })),
        createdAt: order.createdAt,
      },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { data: null, error: "Error al obtener el pedido", success: false },
      { status: 500 }
    );
  }
}
