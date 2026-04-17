import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { validateTransition } from '@/lib/domain/order-fsm';
import { logAudit } from '@/lib/services/audit.service';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/generated/prisma/client';
import type { PrismaClient } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/restaurant/orders/[id]/reject — PLACED → REJECTED
 * Body: { reason: string } (required)
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

    requirePermission(session.user.role as UserRole, 'orders:accept_reject');

    const { id } = await params;
    const body = await request.json();
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

    if (!reason) {
      return NextResponse.json(
        { data: null, error: 'El motivo de rechazo es obligatorio', success: false },
        { status: 422 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, currentStatus: true, fulfillmentType: true, scheduledFor: true, restaurantId: true, orderNumber: true },
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
      targetStatus: 'REJECTED',
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

    const updated = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$use' | '$extends'>) => {
      const u = await tx.order.update({
        where: { id },
        data: { currentStatus: 'REJECTED' },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.currentStatus,
          toStatus: 'REJECTED',
          changedByUserId: session.user!.id!,
          reason,
        },
      });

      return u;
    });

    logAudit({
      userId: session.user.id,
      action: 'ORDER_REJECTED',
      resourceType: 'order',
      resourceId: id,
      details: { orderNumber: order.orderNumber, reason },
    }).catch(() => {});

    return NextResponse.json({
      data: { id: updated.id, orderNumber: updated.orderNumber, status: updated.currentStatus },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al rechazar el pedido';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}
