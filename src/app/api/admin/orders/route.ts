import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders — All orders with filters.
 * Query: restaurantId, status, fulfillmentType, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }
    requirePermission(session.user.role as UserRole, 'orders:read_own');

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status');
    const fulfillmentType = searchParams.get('fulfillmentType');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (restaurantId) where.restaurantId = restaurantId;
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
          restaurant: { select: { name: true } },
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
          restaurantName: o.restaurant.name,
          status: o.currentStatus,
          fulfillmentType: o.fulfillmentType,
          totalEur: Number(o.totalEur),
          createdAt: o.createdAt.toISOString(),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}
