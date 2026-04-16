import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateItemSchema = z.object({
  quantity: z.number().int().min(1, 'La cantidad debe ser al menos 1').optional(),
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { data: null, error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    const { itemId } = await params;

    const body = await request.json();
    const parsed = updateItemSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return NextResponse.json(
        { data: null, error: firstError, success: false },
        { status: 422 }
      );
    }

    // Verify the item belongs to the user's cart
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: { select: { userId: true } } },
    });

    if (!cartItem || cartItem.cart.userId !== session.user.id) {
      return NextResponse.json(
        { data: null, error: 'Ítem no encontrado', success: false },
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

    await prisma.cartItem.update({
      where: { id: itemId },
      data: updateData,
    });

    // Return updated cart
    const updatedCart = await getCartResponse(session.user.id);

    return NextResponse.json({ data: updatedCart, error: null, success: true });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { data: null, error: 'Error al actualizar el ítem', success: false },
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { data: null, error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    const { itemId } = await params;

    // Verify the item belongs to the user's cart
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: { select: { id: true, userId: true } } },
    });

    if (!cartItem || cartItem.cart.userId !== session.user.id) {
      return NextResponse.json(
        { data: null, error: 'Ítem no encontrado', success: false },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    // Check if cart is now empty — if so, clear restaurantId
    const remainingItems = await prisma.cartItem.count({
      where: { cartId: cartItem.cart.id },
    });

    if (remainingItems === 0) {
      await prisma.cart.update({
        where: { id: cartItem.cart.id },
        data: { restaurantId: null },
      });
    }

    // Return updated cart
    const updatedCart = await getCartResponse(session.user.id);

    return NextResponse.json({ data: updatedCart, error: null, success: true });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      { data: null, error: 'Error al eliminar el ítem', success: false },
      { status: 500 }
    );
  }
}

/** Helper to build the cart response DTO */
async function getCartResponse(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      restaurant: { select: { id: true, name: true } },
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
    return { id: null, restaurantId: null, restaurantName: null, items: [], subtotalEur: 0 };
  }

  const items = cart.items.map((item) => ({
    id: item.id,
    productId: item.product.id,
    productName: item.product.name,
    priceEur: Number(item.product.priceEur),
    quantity: item.quantity,
    notes: item.notes,
  }));

  const subtotalEur = items.reduce(
    (sum, item) => sum + item.priceEur * item.quantity,
    0
  );

  return {
    id: cart.id,
    restaurantId: cart.restaurantId,
    restaurantName: cart.restaurant?.name ?? null,
    items,
    subtotalEur: Math.round(subtotalEur * 100) / 100,
  };
}
