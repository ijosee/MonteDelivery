import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cart — Get the authenticated user's cart with items and product details.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { data: null, error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        restaurant: { select: { id: true, name: true, deliveryFeeEur: true } },
        items: {
          include: {
            product: {
              select: { id: true, name: true, priceEur: true, imageUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
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

    return NextResponse.json({
      data: {
        id: cart.id,
        restaurantId: cart.restaurantId,
        restaurantName: cart.restaurant?.name ?? null,
        deliveryFeeEur: cart.restaurant?.deliveryFeeEur ? Number(cart.restaurant.deliveryFeeEur) : null,
        items,
        subtotalEur: Math.round(subtotalEur * 100) / 100,
      },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { data: null, error: 'Error al obtener el carrito', success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart — Clear the authenticated user's cart (remove all items).
 */
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { data: null, error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.update({
        where: { id: cart.id },
        data: { restaurantId: null },
      });
    }

    return NextResponse.json({
      data: { id: cart?.id ?? null, restaurantId: null, restaurantName: null, deliveryFeeEur: null, items: [], subtotalEur: 0 },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { data: null, error: 'Error al vaciar el carrito', success: false },
      { status: 500 }
    );
  }
}
