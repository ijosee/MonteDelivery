import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { z } from "zod";

const updateItemSchema = z.object({
  quantity: z
    .number()
    .int()
    .min(1, "La cantidad debe ser al menos 1")
    .optional(),
  notes: z.string().max(200).nullable().optional(),
});

/**
 * PATCH /api/cart/items/[itemId] — Update quantity and/or notes of a cart item.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    const { itemId } = await params;

    const body = await request.json();
    const parsed = updateItemSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
      return NextResponse.json(
        { data: null, error: firstError, success: false },
        { status: 422 }
      );
    }

    const supabase = await createClient();

    // Verify the item belongs to the user's cart
    const { data: cartItem, error: findError } = await supabase
      .from("cart_items")
      .select("id, cartId, carts(userId)")
      .eq("id", itemId)
      .single();

    if (findError || !cartItem || cartItem.carts?.userId !== authUser.id) {
      return NextResponse.json(
        { data: null, error: "Ítem no encontrado", success: false },
        { status: 404 }
      );
    }

    const updateData: { quantity?: number; notes?: string | null } = {};
    if (parsed.data.quantity !== undefined) {
      updateData.quantity = parsed.data.quantity;
    }
    if (parsed.data.notes !== undefined) {
      updateData.notes = parsed.data.notes;
    }

    const { error: updateError } = await supabase
      .from("cart_items")
      .update(updateData)
      .eq("id", itemId);

    if (updateError) {
      console.error("Error updating cart item:", updateError);
      return NextResponse.json(
        { data: null, error: "Error al actualizar el ítem", success: false },
        { status: 500 }
      );
    }

    // Return updated cart
    const updatedCart = await getCartResponse(supabase, authUser.id);

    return NextResponse.json({ data: updatedCart, error: null, success: true });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return NextResponse.json(
      { data: null, error: "Error al actualizar el ítem", success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/items/[itemId] — Remove an item from the cart.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    const { itemId } = await params;

    const supabase = await createClient();

    // Verify the item belongs to the user's cart
    const { data: cartItem, error: findError } = await supabase
      .from("cart_items")
      .select("id, cartId, carts(id, userId)")
      .eq("id", itemId)
      .single();

    if (findError || !cartItem || cartItem.carts?.userId !== authUser.id) {
      return NextResponse.json(
        { data: null, error: "Ítem no encontrado", success: false },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId);

    if (deleteError) {
      console.error("Error deleting cart item:", deleteError);
      return NextResponse.json(
        { data: null, error: "Error al eliminar el ítem", success: false },
        { status: 500 }
      );
    }

    // Check if cart is now empty — if so, clear restaurantId
    const { count, error: countError } = await supabase
      .from("cart_items")
      .select("id", { count: "exact", head: true })
      .eq("cartId", cartItem.cartId);

    if (!countError && count === 0) {
      await supabase
        .from("carts")
        .update({ restaurantId: null })
        .eq("id", cartItem.cartId);
    }

    // Return updated cart
    const updatedCart = await getCartResponse(supabase, authUser.id);

    return NextResponse.json({ data: updatedCart, error: null, success: true });
  } catch (error) {
    console.error("Error removing cart item:", error);
    return NextResponse.json(
      { data: null, error: "Error al eliminar el ítem", success: false },
      { status: 500 }
    );
  }
}

/** Helper to build the cart response DTO */
async function getCartResponse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: cart, error } = await supabase
    .from("carts")
    .select(
      "id, restaurantId, restaurants(id, name, deliveryFeeEur), cart_items(id, productId, quantity, notes, createdAt, products(id, name, priceEur))"
    )
    .eq("userId", userId)
    .single();

  if (error || !cart) {
    return {
      id: null,
      restaurantId: null,
      restaurantName: null,
      deliveryFeeEur: null,
      items: [],
      subtotalEur: 0,
    };
  }

  // Sort items by createdAt ascending (matching original orderBy)
  const sortedItems = [...(cart.cart_items ?? [])].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const items = sortedItems.map((item) => ({
    id: item.id,
    productId: item.products!.id,
    productName: item.products!.name,
    priceEur: Number(item.products!.priceEur),
    quantity: item.quantity,
    notes: item.notes,
  }));

  const subtotalEur = items.reduce(
    (sum, item) => sum + item.priceEur * item.quantity,
    0
  );

  const restaurant = cart.restaurants;

  return {
    id: cart.id,
    restaurantId: cart.restaurantId,
    restaurantName: restaurant?.name ?? null,
    deliveryFeeEur: restaurant?.deliveryFeeEur
      ? Number(restaurant.deliveryFeeEur)
      : null,
    items,
    subtotalEur: Math.round(subtotalEur * 100) / 100,
  };
}
