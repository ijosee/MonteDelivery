import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { validateTransition } from '@/lib/domain/order-fsm';
import { computeEta } from '@/lib/domain/eta-calculator';
import { distanceKm } from '@/lib/domain/haversine';
import { logAudit } from '@/lib/services/audit.service';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole, OrderStatus } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/restaurant/orders/[id]/status — Change order status per FSM.
 * Body: { status: OrderStatus }
 */
export async function POST(
  request: NextRequest,
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

    requirePermission(session.user.role as UserRole, 'orders:change_status');

    const { id } = await params;
    const body = await request.json();
    const targetStatus = body.status as OrderStatus;

    if (!targetStatus) {
      return NextResponse.json(
        { data: null, error: 'El estado destino es obligatorio', success: false },
        { status: 422 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: { select: { id: true, lat: true, lng: true } },
        address: { select: { lat: true, lng: true } },
        items: { select: { quantity: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { data: null, error: 'Pedido no encontrado', success: false },
        { status: 404 }
      );
    }

    const ru = await prisma.restaurantUser.findFirst({
      where: { userId: session.user.id, restaurantId: order.restaurantId },
    });

    if (!ru) {
      return NextResponse.json(
        { data: null, error: 'No tienes permisos para este pedido', success: false },
        { status: 403 }
      );
    }

    const result = validateTransition({
      currentStatus: order.currentStatus,
      targetStatus,
      userRole: session.user.role as 'RESTAURANT_OWNER' | 'RESTAURANT_STAFF',
      fulfillmentType: order.fulfillmentType,
      scheduledFor: order.scheduledFor,
    });

    if (!result.success) {
      return NextResponse.json(
        { data: null, error: result.error, success: false },
        { status: 422 }
      );
    }

    // Recalculate ETA on status change
    const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
    const dist = distanceKm(order.address.lat, order.address.lng, order.restaurant.lat, order.restaurant.lng);
    const activeCount = await prisma.order.count({
      where: {
        restaurantId: order.restaurantId,
        currentStatus: { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'] },
      },
    });
    const etaResult = computeEta({
      fulfillmentType: order.fulfillmentType,
      itemCount: totalItems,
      distanceKm: dist,
      activeOrderCount: activeCount,
      scheduledFor: order.scheduledFor,
    });

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.order.update({
        where: { id },
        data: {
          currentStatus: targetStatus,
          eta: etaResult.eta,
          etaWindowEnd: etaResult.etaWindowEnd ?? null,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.currentStatus,
          toStatus: targetStatus,
          changedByUserId: session.user!.id!,
        },
      });

      return u;
    });

    logAudit({
      userId: session.user.id,
      action: 'ORDER_STATUS_CHANGED',
      resourceType: 'order',
      resourceId: id,
      details: {
        orderNumber: order.orderNumber,
        fromStatus: order.currentStatus,
        toStatus: targetStatus,
      },
    }).catch(() => {});

    return NextResponse.json({
      data: { id: updated.id, orderNumber: updated.orderNumber, status: updated.currentStatus },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al cambiar estado';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}
