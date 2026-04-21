import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { sendOrderConfirmationEmail } from "@/lib/services/email.service";
import { headers } from "next/headers";

/**
 * POST /api/orders/[id]/confirm — Register legal acceptance and send confirmation email.
 * Called after order creation from the confirmation page.
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

    // Fetch order with details
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(
        "id, userId, orderNumber, fulfillmentType, eta, etaWindowEnd, subtotalEur, deliveryFeeEur, totalEur, restaurants(name), addresses(street, municipality, city, postalCode), order_items(productName, productPriceEur, quantity)"
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
        { data: null, error: "Error al confirmar el pedido", success: false },
        { status: 500 }
      );
    }

    if (order.userId !== authUser.id) {
      return NextResponse.json(
        { data: null, error: "Pedido no encontrado", success: false },
        { status: 404 }
      );
    }

    // Get IP address for legal acceptance
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      null;

    // Register legal acceptance (terms + privacy)
    const { error: legalError } = await supabase
      .from("legal_acceptances")
      .insert([
        {
          userId: authUser.id,
          documentType: "terms_of_service",
          documentVersion: "1.0",
          ipAddress,
        },
        {
          userId: authUser.id,
          documentType: "privacy_policy",
          documentVersion: "1.0",
          ipAddress,
        },
      ]);

    if (legalError) {
      console.error("Error registering legal acceptance:", legalError);
      // Non-critical — log but don't fail the request
    }

    // Extract related data (Supabase returns relations as objects/arrays)
    const restaurant = order.restaurants as unknown as { name: string } | null;
    const address = order.addresses as unknown as {
      street: string;
      municipality: string;
      city: string;
      postalCode: string;
    } | null;
    const items = (order.order_items ?? []) as unknown as Array<{
      productName: string;
      productPriceEur: number;
      quantity: number;
    }>;

    // Format ETA for email
    let etaText = "";
    if (
      order.fulfillmentType === "SCHEDULED" &&
      order.eta &&
      order.etaWindowEnd
    ) {
      const eta = new Date(order.eta);
      const end = new Date(order.etaWindowEnd);
      const etaTime = `${String(eta.getHours()).padStart(2, "0")}:${String(eta.getMinutes()).padStart(2, "0")}`;
      const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
      etaText = `${etaTime}–${endTime}`;
    } else if (order.eta) {
      const eta = new Date(order.eta);
      etaText = eta.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Send confirmation email (fire-and-forget)
    sendOrderConfirmationEmail(authUser.email, {
      orderNumber: order.orderNumber,
      restaurantName: restaurant?.name ?? "",
      items: items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        priceEur: Number(item.productPriceEur),
      })),
      subtotalEur: Number(order.subtotalEur),
      deliveryFeeEur: Number(order.deliveryFeeEur),
      totalEur: Number(order.totalEur),
      eta: etaText,
      deliveryAddress: address
        ? `${address.street}, ${address.municipality}, ${address.postalCode}`
        : "",
      fulfillmentType: order.fulfillmentType,
    }).catch((err) => {
      console.error("[OrderConfirm] Failed to send confirmation email:", err);
    });

    return NextResponse.json({
      data: { confirmed: true },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error("Error confirming order:", error);
    return NextResponse.json(
      { data: null, error: "Error al confirmar el pedido", success: false },
      { status: 500 }
    );
  }
}
