import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { validateTransition } from '@/lib/domain/order-fsm';
import { logAudit } from '@/lib/services/audit.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/orders/[id]/cancel — Cancel an order.
 * Uses FSM validation to check if cancellation is allowed.
 */
export async function POST(
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
      select: {
        id: true,
        userId: true,
        currentStatus: true,
        fulfillmentType: true,
        scheduledFor: true,
        orderNumber: true,
      },
    });

    if (!order || order.userId !== session.user.id) {
      return NextResponse.json(
        { data: null, error: 'Pedido no encontrado', success: false },
        { status: 404 }
      );
    }

    // Validate transition using FSM
    const result = validateTransition({
      currentStatus: order.currentStatus,
      targetStatus: 'CANCELLED',
      userRole: 'CUSTOMER',
      fulfillmentType: order.fulfillmentType,
      scheduledFor: order.scheduledFor,
    });

    if (!result.success) {
      return NextResponse.json(
        { data: null, error: result.error, success: false },
        { status: 422 }
      );
    }

    // Perform cancellation in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { currentStatus: 'CANCELLED' },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.currentStatus,
          toStatus: 'CANCELLED',
          changedByUserId: session.user!.id!,
          reason: 'Cancelado por el cliente',
        },
      });

      return updated;
    });

    // Audit log (fire-and-forget)
    logAudit({
      userId: session.user.id,
      action: 'ORDER_CANCELLED',
      resourceType: 'order',
      resourceId: id,
      details: {
        orderNumber: order.orderNumber,
        fromStatus: order.currentStatus,
      },
    }).catch(() => {});

    return NextResponse.json({
      data: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.currentStatus,
      },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { data: null, error: 'Error al cancelar el pedido', success: false },
      { status: 500 }
    );
  }
}
