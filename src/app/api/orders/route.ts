import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { createOrderSchema } from '@/lib/validators/order.schema';
import { ERRORS, formatError } from '@/lib/errors';
import { distanceKm, isInsideDeliveryZone } from '@/lib/domain/haversine';
import { computeEta } from '@/lib/domain/eta-calculator';
import { getAvailableSlots } from '@/lib/domain/slot-generator';
import { logAudit } from '@/lib/services/audit.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders — Paginated order history for the authenticated user.
 * Query params: page (default 1), limit (default 10)
 * Ordered by createdAt desc.
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          restaurant: { select: { name: true } },
        },
      }),
      prisma.order.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      data: {
        orders: orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          restaurantName: o.restaurant.name,
          status: o.currentStatus,
          fulfillmentType: o.fulfillmentType,
          totalEur: Number(o.totalEur),
          eta: o.eta?.toISOString() ?? null,
          createdAt: o.createdAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { data: null, error: 'Error al obtener los pedidos', success: false },
      { status: 500 }
    );
  }
}

/**
 * Helper: check if restaurant is currently open.
 */
function isRestaurantOpen(
  openingHours: { dayOfWeek: number; openTime: string; closeTime: string }[],
  now: Date = new Date()
): boolean {
  const jsDay = now.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return openingHours.some(
    (h) =>
      h.dayOfWeek === dayOfWeek &&
      currentTime >= h.openTime &&
      currentTime < h.closeTime
  );
}

/**
 * POST /api/orders — Create a new order.
 *
 * Flow:
 * 1. Validate with createOrderSchema (Zod)
 * 2. Check idempotency_key: if duplicate, return existing order (409)
 * 3. Verify restaurant is open for ASAP (error RESTAURANT_CLOSED)
 * 4. Verify slot is valid for SCHEDULED (error SLOT_UNAVAILABLE)
 * 5. Verify delivery zone with Haversine (error OUTSIDE_DELIVERY_ZONE)
 * 6. Verify all cart products are available (error PRODUCT_UNAVAILABLE)
 * 7. Calculate ETA with computeEta
 * 8. Create order + order_items (snapshot) + order_status_history (PLACED)
 * 9. Clear cart after creating order
 * 10. Log to audit service
 * 11. Use Prisma transaction for atomicity
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
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return NextResponse.json(
        { data: null, error: firstError, success: false },
        { status: 422 }
      );
    }

    const { addressId, phone, fulfillmentType, scheduledFor, idempotencyKey } = parsed.data;

    // 2. Check idempotency_key: if duplicate, return existing order
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey },
      select: {
        id: true,
        orderNumber: true,
        currentStatus: true,
        totalEur: true,
        eta: true,
        etaWindowEnd: true,
        fulfillmentType: true,
        createdAt: true,
      },
    });

    if (existingOrder) {
      return NextResponse.json(
        {
          data: {
            id: existingOrder.id,
            orderNumber: existingOrder.orderNumber,
            status: existingOrder.currentStatus,
            totalEur: Number(existingOrder.totalEur),
            eta: existingOrder.eta?.toISOString() ?? null,
            etaWindowEnd: existingOrder.etaWindowEnd?.toISOString() ?? null,
            fulfillmentType: existingOrder.fulfillmentType,
            createdAt: existingOrder.createdAt.toISOString(),
          },
          error: null,
          success: true,
        },
        { status: 409 }
      );
    }

    // Fetch user's address (with lat/lng for zone validation)
    const address = await prisma.address.findUnique({
      where: { id: addressId },
      select: {
        id: true,
        userId: true,
        street: true,
        municipality: true,
        city: true,
        postalCode: true,
        lat: true,
        lng: true,
      },
    });

    if (!address || address.userId !== session.user.id) {
      return NextResponse.json(
        { data: null, error: 'Dirección no encontrada', success: false },
        { status: 404 }
      );
    }

    // Fetch user's cart with items and product details
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                priceEur: true,
                isAvailable: true,
                categoryId: true,
                category: {
                  select: { restaurantId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { data: null, error: ERRORS.CART_EMPTY.message, code: ERRORS.CART_EMPTY.code, success: false },
        { status: 422 }
      );
    }

    const restaurantId = cart.restaurantId;
    if (!restaurantId) {
      return NextResponse.json(
        { data: null, error: 'El carrito no tiene restaurante asociado', success: false },
        { status: 422 }
      );
    }

    // Fetch restaurant details
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        openingHours: {
          select: { dayOfWeek: true, openTime: true, closeTime: true },
        },
      },
    });

    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json(
        { data: null, error: 'Restaurante no encontrado o inactivo', success: false },
        { status: 404 }
      );
    }

    const now = new Date();

    // 3. Verify restaurant is open for ASAP
    if (fulfillmentType === 'ASAP') {
      if (!isRestaurantOpen(restaurant.openingHours, now)) {
        return NextResponse.json(
          {
            data: null,
            error: ERRORS.RESTAURANT_CLOSED.message,
            code: ERRORS.RESTAURANT_CLOSED.code,
            title: ERRORS.RESTAURANT_CLOSED.title,
            action: ERRORS.RESTAURANT_CLOSED.action,
            success: false,
          },
          { status: 422 }
        );
      }
    }

    // 4. Verify slot is valid for SCHEDULED
    if (fulfillmentType === 'SCHEDULED' && scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      const dateStr = scheduledDate.toISOString().split('T')[0];

      const availableSlots = getAvailableSlots({
        openingHours: restaurant.openingHours,
        date: dateStr,
        now,
      });

      const requestedSlot = `${String(scheduledDate.getHours()).padStart(2, '0')}:${String(scheduledDate.getMinutes()).padStart(2, '0')}`;

      if (!availableSlots.includes(requestedSlot)) {
        return NextResponse.json(
          {
            data: null,
            error: ERRORS.SLOT_UNAVAILABLE.message,
            code: ERRORS.SLOT_UNAVAILABLE.code,
            title: ERRORS.SLOT_UNAVAILABLE.title,
            action: ERRORS.SLOT_UNAVAILABLE.action,
            success: false,
          },
          { status: 422 }
        );
      }
    }

    // 5. Verify delivery zone with Haversine
    const distance = distanceKm(
      address.lat,
      address.lng,
      restaurant.lat,
      restaurant.lng
    );

    if (!isInsideDeliveryZone(address.lat, address.lng, restaurant.lat, restaurant.lng, restaurant.deliveryRadiusKm)) {
      const errorMsg = formatError(ERRORS.OUTSIDE_DELIVERY_ZONE, {
        maxRadius: restaurant.deliveryRadiusKm.toFixed(1),
        distance: distance.toFixed(1),
      });
      return NextResponse.json(
        {
          data: null,
          error: errorMsg.message,
          code: ERRORS.OUTSIDE_DELIVERY_ZONE.code,
          title: ERRORS.OUTSIDE_DELIVERY_ZONE.title,
          action: ERRORS.OUTSIDE_DELIVERY_ZONE.action,
          success: false,
        },
        { status: 422 }
      );
    }

    // 6. Verify all cart products are available
    for (const item of cart.items) {
      if (!item.product.isAvailable) {
        const errorMsg = formatError(ERRORS.PRODUCT_UNAVAILABLE, {
          productName: item.product.name,
        });
        return NextResponse.json(
          {
            data: null,
            error: errorMsg.message,
            code: ERRORS.PRODUCT_UNAVAILABLE.code,
            title: ERRORS.PRODUCT_UNAVAILABLE.title,
            action: ERRORS.PRODUCT_UNAVAILABLE.action,
            success: false,
          },
          { status: 422 }
        );
      }
    }

    // Calculate subtotal and total
    const subtotalEur = cart.items.reduce(
      (sum, item) => sum + Number(item.product.priceEur) * item.quantity,
      0
    );
    const deliveryFeeEur = Number(restaurant.deliveryFeeEur);
    const totalEur = subtotalEur + deliveryFeeEur;

    // Count total items for ETA
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // Count active orders for queue factor
    const activeOrderCount = await prisma.order.count({
      where: {
        restaurantId,
        currentStatus: {
          in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'],
        },
      },
    });

    // 7. Calculate ETA
    const scheduledForDate = scheduledFor ? new Date(scheduledFor) : null;
    const etaResult = computeEta({
      fulfillmentType,
      itemCount: totalItems,
      distanceKm: distance,
      activeOrderCount,
      scheduledFor: scheduledForDate,
      now,
    });

    // 8. Create order + order_items + order_status_history in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: session.user!.id!,
          restaurantId,
          addressId,
          phone,
          fulfillmentType,
          scheduledFor: scheduledForDate,
          subtotalEur: Math.round(subtotalEur * 100) / 100,
          deliveryFeeEur: Math.round(deliveryFeeEur * 100) / 100,
          totalEur: Math.round(totalEur * 100) / 100,
          currentStatus: 'PLACED',
          eta: etaResult.eta,
          etaWindowEnd: etaResult.etaWindowEnd ?? null,
          idempotencyKey,
        },
      });

      // Create order items (snapshot name and price)
      await tx.orderItem.createMany({
        data: cart.items.map((item) => ({
          orderId: newOrder.id,
          productId: item.product.id,
          productName: item.product.name,
          productPriceEur: item.product.priceEur,
          quantity: item.quantity,
        })),
      });

      // Create initial status history entry (PLACED)
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          fromStatus: null,
          toStatus: 'PLACED',
          changedByUserId: session.user!.id!,
        },
      });

      // 9. Clear cart after creating order
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { restaurantId: null },
      });

      return newOrder;
    });

    // 10. Log to audit service (fire-and-forget, outside transaction)
    logAudit({
      userId: session.user.id,
      action: 'ORDER_CREATED',
      resourceType: 'order',
      resourceId: order.id,
      details: {
        orderNumber: order.orderNumber,
        restaurantId,
        fulfillmentType,
        totalEur,
      },
    }).catch(() => {
      // Audit logging should not block the response
    });

    return NextResponse.json(
      {
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.currentStatus,
          fulfillmentType: order.fulfillmentType,
          subtotalEur: Number(order.subtotalEur),
          deliveryFeeEur: Number(order.deliveryFeeEur),
          totalEur: Number(order.totalEur),
          eta: order.eta?.toISOString() ?? null,
          etaWindowEnd: order.etaWindowEnd?.toISOString() ?? null,
          createdAt: order.createdAt.toISOString(),
        },
        error: null,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { data: null, error: 'Error al crear el pedido', success: false },
      { status: 500 }
    );
  }
}
