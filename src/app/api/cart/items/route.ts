import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { z } from "zod";
import { ERRORS } from "@/lib/errors";

const addItemSchema = z.object({
  productId: z.string().min(1, "productId es obligatorio"),
  quantity: z.number().int().min(1, "La cantidad debe ser al menos 1"),
  notes: z.string().max(200).nullable().optional(),
});

/**
 * POST /api/cart/items — Add an item to the cart.
 * Detects restaurant change and returns 409 if cart has items from a different restaurant.
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
    const parsed = addItemSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
      return NextResponse.json(
        { data: null, error: firstError, success: false },
        { status: 422 }
      );
    }

    const { productId, quantity, notes } = parsed.data;

    const supabase = await createClient();

    // Fetch the product with its category → restaurant
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, isAvailable, categoryId, categories(restaurantId, restaurants(id, name))")
      .eq("id", productId)
      .single();

    if (productError || !product?.isAvailable) {
      return NextResponse.json(
        { data: null, error: "Producto no disponible", success: false },
        { status: 404 }
      );
    }

    const productRestaurantId = product.categories!.restaurants!.id;

    // Get existing cart with items
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id, restaurantId, cart_items(id, productId, quantity, notes)")
      .eq("userId", authUser.id)
      .single();

    let cartId: string;
    let existingItems: { id: string; productId: string; quantity: number; notes: string | null }[] = [];

    if (cartError?.code === "PGRST116") {
      // Cart not found — create one
      const { data: newCart, error: createError } = await supabase
        .from("carts")
        .insert({ userId: authUser.id, restaurantId: productRestaurantId, updatedAt: new Date().toISOString() })
        .select("id")
        .single();

      if (createError || !newCart) {
        console.error("Error creating cart:", createError);
        return NextResponse.json(
          { data: null, error: "Error al añadir producto al carrito", success: false },
          { status: 500 }
        );
      }

      cartId = newCart.id;
    } else if (cartError) {
      console.error("Error fetching cart:", cartError);
      return NextResponse.json(
        { data: null, error: "Error al añadir producto al carrito", success: false },
        { status: 500 }
      );
    } else {
      cartId = cart.id;
      existingItems = cart.cart_items ?? [];

      // Check for restaurant conflict
      if (
        cart.restaurantId &&
        cart.restaurantId !== productRestaurantId &&
        existingItems.length > 0
      ) {
        return NextResponse.json(
          {
            data: null,
            error: ERRORS.CART_DIFFERENT_RESTAURANT.message,
            code: ERRORS.CART_DIFFERENT_RESTAURANT.code,
            success: false,
          },
          { status: 409 }
        );
      }

      // Update restaurant if cart was empty or had no restaurant
      if (cart.restaurantId === null || existingItems.length === 0) {
        const { error: updateError } = await supabase
          .from("carts")
          .update({ restaurantId: productRestaurantId, updatedAt: new Date().toISOString() })
          .eq("id", cartId);

        if (updateError) {
          console.error("Error updating cart restaurant:", updateError);
          return NextResponse.json(
            { data: null, error: "Error al añadir producto al carrito", success: false },
            { status: 500 }
          );
        }
      }
    }

    // Check if product already exists in cart — if so, increment quantity
    const existingItem = existingItems.find((item) => item.productId === productId);

    if (existingItem) {
      const updatedNotes =
        notes === undefined ? existingItem.notes : (notes ?? existingItem.notes);
      const { error: updateItemError } = await supabase
        .from("cart_items")
        .update({
          quantity: existingItem.quantity + quantity,
          notes: updatedNotes,
        })
        .eq("id", existingItem.id);

      if (updateItemError) {
        console.error("Error updating cart item:", updateItemError);
        return NextResponse.json(
          { data: null, error: "Error al añadir producto al carrito", success: false },
          { status: 500 }
        );
      }
    } else {
      const { error: insertItemError } = await supabase
        .from("cart_items")
        .insert({
          cartId,
          productId,
          quantity,
          notes: notes ?? null,
        });

      if (insertItemError) {
        console.error("Error inserting cart item:", insertItemError);
        return NextResponse.json(
          { data: null, error: "Error al añadir producto al carrito", success: false },
          { status: 500 }
        );
      }
    }

    // Fetch updated cart for response
    const updatedCart = await getCartResponse(supabase, authUser.id);

    return NextResponse.json(
      { data: updatedCart, error: null, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding item to cart:", error);
    return NextResponse.json(
      { data: null, error: "Error al añadir producto al carrito", success: false },
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
