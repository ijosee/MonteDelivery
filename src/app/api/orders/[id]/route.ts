import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders/[id] — Get order details for the authenticated user.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { data: null, error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: { select: { name: true } },
        address: {
          select: {
            street: true,
            municipality: true,
            city: true,
            postalCode: true,
            floorDoor: true,
          },
        },
        items: {
          select: {
            id: true,
            productName: true,
            productPriceEur: true,
            quantity: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: {
            fromStatus: true,
            toStatus: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order || order.userId !== session.user.id) {
      return NextResponse.json(
        { data: null, error: 'Pedido no encontrado', success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        restaurantName: order.restaurant.name,
        status: order.currentStatus,
        fulfillmentType: order.fulfillmentType,
        scheduledFor: order.scheduledFor?.toISOString() ?? null,
        subtotalEur: Number(order.subtotalEur),
        deliveryFeeEur: Number(order.deliveryFeeEur),
        totalEur: Number(order.totalEur),
        eta: order.eta?.toISOString() ?? null,
        etaWindowEnd: order.etaWindowEnd?.toISOString() ?? null,
        phone: order.phone,
        address: {
          street: order.address.street,
          municipality: order.address.municipality,
          city: order.address.city,
          postalCode: order.address.postalCode,
          floorDoor: order.address.floorDoor,
        },
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          productPriceEur: Number(item.productPriceEur),
          quantity: item.quantity,
        })),
        statusHistory: order.statusHistory.map((h) => ({
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          reason: h.reason,
          createdAt: h.createdAt.toISOString(),
        })),
        createdAt: order.createdAt.toISOString(),
      },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { data: null, error: 'Error al obtener el pedido', success: false },
      { status: 500 }
    );
  }
}
