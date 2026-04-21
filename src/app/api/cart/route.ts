import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";

/**
 * GET /api/cart — Get the authenticated user's cart with items and product details.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { data: cart, error } = await supabase
      .from("carts")
      .select(
        "id, userId, restaurantId, restaurants(id, name, deliveryFeeEur), cart_items(id, productId, quantity, notes, createdAt, products(id, name, priceEur, imageUrl))"
      )
      .eq("userId", authUser.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching cart:", error);
      return NextResponse.json(
        { data: null, error: "Error al obtener el carrito", success: false },
        { status: 500 }
      );
    }

    if (!cart?.cart_items?.length) {
      return NextResponse.json({
        data: {
          id: cart?.id ?? null,
          restaurantId: null,
          restaurantName: null,
          deliveryFeeEur: null,
          items: [],
          subtotalEur: 0,
        },
        error: null,
        success: true,
      });
    }

    // Sort items by createdAt ascending (matching original orderBy)
    const sortedItems = [...cart.cart_items].sort(
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

    return NextResponse.json({
      data: {
        id: cart.id,
        restaurantId: cart.restaurantId,
        restaurantName: restaurant?.name ?? null,
        deliveryFeeEur: restaurant?.deliveryFeeEur
          ? Number(restaurant.deliveryFeeEur)
          : null,
        items,
        subtotalEur: Math.round(subtotalEur * 100) / 100,
      },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { data: null, error: "Error al obtener el carrito", success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart — Clear the authenticated user's cart (remove all items).
 */
export async function DELETE() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { data: cart, error: findError } = await supabase
      .from("carts")
      .select("id")
      .eq("userId", authUser.id)
      .single();

    if (findError && findError.code !== "PGRST116") {
      console.error("Error finding cart:", findError);
      return NextResponse.json(
        { data: null, error: "Error al vaciar el carrito", success: false },
        { status: 500 }
      );
    }

    if (cart) {
      const { error: deleteError } = await supabase
        .from("cart_items")
        .delete()
        .eq("cartId", cart.id);

      if (deleteError) {
        console.error("Error deleting cart items:", deleteError);
        return NextResponse.json(
          { data: null, error: "Error al vaciar el carrito", success: false },
          { status: 500 }
        );
      }

      const { error: updateError } = await supabase
        .from("carts")
        .update({ restaurantId: null })
        .eq("id", cart.id);

      if (updateError) {
        console.error("Error updating cart:", updateError);
        return NextResponse.json(
          { data: null, error: "Error al vaciar el carrito", success: false },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      data: {
        id: cart?.id ?? null,
        restaurantId: null,
        restaurantName: null,
        deliveryFeeEur: null,
        items: [],
        subtotalEur: 0,
      },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { data: null, error: "Error al vaciar el carrito", success: false },
      { status: 500 }
    );
  }
}
