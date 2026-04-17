import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/services/email.service';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/orders/[id]/confirm — Register legal acceptance and send confirmation email.
 * Called after order creation from the confirmation page.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { data: null, error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch order with details
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
          },
        },
        items: {
          select: {
            productName: true,
            productPriceEur: true,
            quantity: true,
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

    // Get IP address for legal acceptance
    const headersList = await headers();
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headersList.get('x-real-ip') ??
      null;

    // Register legal acceptance (terms + privacy)
    await prisma.legalAcceptance.createMany({
      data: [
        {
          userId: session.user.id,
          documentType: 'terms_of_service',
          documentVersion: '1.0',
          ipAddress,
        },
        {
          userId: session.user.id,
          documentType: 'privacy_policy',
          documentVersion: '1.0',
          ipAddress,
        },
      ],
    });

    // Format ETA for email
    let etaText = '';
    if (order.fulfillmentType === 'SCHEDULED' && order.eta && order.etaWindowEnd) {
      const eta = order.eta;
      const end = order.etaWindowEnd;
      const etaTime = `${String(eta.getHours()).padStart(2, '0')}:${String(eta.getMinutes()).padStart(2, '0')}`;
      const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
      etaText = `${etaTime}–${endTime}`;
    } else if (order.eta) {
      etaText = order.eta.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // Send confirmation email (fire-and-forget)
    sendOrderConfirmationEmail(session.user.email, {
      orderNumber: order.orderNumber,
      restaurantName: order.restaurant.name,
      items: order.items.map((item: typeof order.items[number]) => ({
        name: item.productName,
        quantity: item.quantity,
        priceEur: Number(item.productPriceEur),
      })),
      subtotalEur: Number(order.subtotalEur),
      deliveryFeeEur: Number(order.deliveryFeeEur),
      totalEur: Number(order.totalEur),
      eta: etaText,
      deliveryAddress: `${order.address.street}, ${order.address.municipality}, ${order.address.postalCode}`,
      fulfillmentType: order.fulfillmentType,
    }).catch((err) => {
      console.error('[OrderConfirm] Failed to send confirmation email:', err);
    });

    return NextResponse.json({
      data: { confirmed: true },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error confirming order:', error);
    return NextResponse.json(
      { data: null, error: 'Error al confirmar el pedido', success: false },
      { status: 500 }
    );
  }
}
