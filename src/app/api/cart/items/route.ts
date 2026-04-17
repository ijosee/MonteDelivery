import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { ERRORS } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const addItemSchema = z.object({
  productId: z.string().min(1, 'productId es obligatorio'),
  quantity: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
  notes: z.string().max(200).nullable().optional(),
});

/**
 * POST /api/cart/items — Add an item to the cart.
 * Detects restaurant change and returns 409 if cart has items from a different restaurant.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { data: null, error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = addItemSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return NextResponse.json(
        { data: null, error: firstError, success: false },
        { status: 422 }
      );
    }

    const { productId, quantity, notes } = parsed.data;

    // Fetch the product with its category → restaurant
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          include: { restaurant: { select: { id: true, name: true } } },
        },
      },
    });

    if (!product?.isAvailable) {
      return NextResponse.json(
        { data: null, error: 'Producto no disponible', success: false },
        { status: 404 }
      );
    }

    const productRestaurantId = product.category.restaurant.id;

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
          restaurantId: productRestaurantId,
        },
        include: { items: true },
      });
    }

    // Check for restaurant conflict
    if (
      cart.restaurantId &&
      cart.restaurantId !== productRestaurantId &&
      cart.items.length > 0
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
    if (cart.restaurantId === null || cart.items.length === 0) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { restaurantId: productRestaurantId },
      });
    }

    // Check if product already exists in cart — if so, increment quantity
    const existingItem = cart.items.find((item: typeof cart.items[number]) => item.productId === productId);

    if (existingItem) {
      const updatedNotes = notes === undefined ? existingItem.notes : (notes ?? existingItem.notes);
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          notes: updatedNotes,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          notes: notes ?? null,
        },
      });
    }

    // Fetch updated cart for response
    const updatedCart = await getCartResponse(session.user.id);

    return NextResponse.json(
      { data: updatedCart, error: null, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return NextResponse.json(
      { data: null, error: 'Error al añadir producto al carrito', success: false },
      { status: 500 }
    );
  }
}

/** Helper to build the cart response DTO */
async function getCartResponse(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      restaurant: { select: { id: true, name: true, deliveryFeeEur: true } },
      items: {
        include: {
          product: {
            select: { id: true, name: true, priceEur: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!cart) {
    return { id: null, restaurantId: null, restaurantName: null, deliveryFeeEur: null, items: [], subtotalEur: 0 };
  }

  const items = cart.items.map((item: typeof cart.items[number]) => ({
    id: item.id,
    productId: item.product.id,
    productName: item.product.name,
    priceEur: Number(item.product.priceEur),
    quantity: item.quantity,
    notes: item.notes,
  }));

  const subtotalEur = items.reduce(
    (sum: number, item: typeof items[number]) => sum + item.priceEur * item.quantity,
    0
  );

  return {
    id: cart.id,
    restaurantId: cart.restaurantId,
    restaurantName: cart.restaurant?.name ?? null,
    deliveryFeeEur: cart.restaurant?.deliveryFeeEur ? Number(cart.restaurant.deliveryFeeEur) : null,
    items,
    subtotalEur: Math.round(subtotalEur * 100) / 100,
  };
}
