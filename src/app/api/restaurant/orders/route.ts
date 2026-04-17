import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Helper: get the restaurant ID for the current user via RestaurantUser table.
 */
async function getUserRestaurantId(userId: string): Promise<string | null> {
  const ru = await prisma.restaurantUser.findFirst({
    where: { userId },
    select: { restaurantId: true },
  });
  return ru?.restaurantId ?? null;
}

/**
 * GET /api/restaurant/orders — Orders for the user's restaurant.
 * Query params: status, fulfillmentType, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { data: null, error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    requirePermission(session.user.role as UserRole, 'orders:read_restaurant');

    const restaurantId = await getUserRestaurantId(session.user.id);
    if (!restaurantId) {
      return NextResponse.json(
        { data: null, error: 'No tienes un restaurante asociado', success: false },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const fulfillmentType = searchParams.get('fulfillmentType');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { restaurantId };
    if (status) where.currentStatus = status;
    if (fulfillmentType) where.fulfillmentType = fulfillmentType;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
          address: {
            select: { street: true, municipality: true, postalCode: true, floorDoor: true },
          },
          items: {
            select: { productName: true, productPriceEur: true, quantity: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      data: {
        orders: orders.map((o: typeof orders[number]) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.user.name,
          customerEmail: o.user.email,
          status: o.currentStatus,
          fulfillmentType: o.fulfillmentType,
          scheduledFor: o.scheduledFor?.toISOString() ?? null,
          subtotalEur: Number(o.subtotalEur),
          deliveryFeeEur: Number(o.deliveryFeeEur),
          totalEur: Number(o.totalEur),
          eta: o.eta?.toISOString() ?? null,
          phone: o.phone,
          address: o.address,
          items: o.items.map((i: typeof o.items[number]) => ({
            productName: i.productName,
            productPriceEur: Number(i.productPriceEur),
            quantity: i.quantity,
          })),
          createdAt: o.createdAt.toISOString(),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener pedidos';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json(
      { data: null, error: message, success: false },
      { status }
    );
  }
}
