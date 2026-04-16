import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Converts JS getDay() (0=Sunday) to our system (0=Monday, 6=Sunday).
 */
function jsDayToSystem(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * Determines if a restaurant is currently open based on its opening hours.
 */
function isRestaurantOpen(
  openingHours: { dayOfWeek: number; openTime: string; closeTime: string }[],
  now: Date = new Date()
): boolean {
  const dayOfWeek = jsDayToSystem(now.getDay());
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return openingHours.some(
    (h) =>
      h.dayOfWeek === dayOfWeek &&
      currentTime >= h.openTime &&
      currentTime < h.closeTime
  );
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const isOpenFilter = searchParams.get('is_open');
    const maxDeliveryFee = searchParams.get('max_delivery_fee');
    const maxMinOrder = searchParams.get('max_min_order');

    // Build Prisma where clause
    const where: Record<string, unknown> = { isActive: true };

    if (type) {
      where.cuisineType = type;
    }

    if (maxDeliveryFee) {
      where.deliveryFeeEur = { lte: parseFloat(maxDeliveryFee) };
    }

    if (maxMinOrder) {
      where.minOrderEur = { lte: parseFloat(maxMinOrder) };
    }

    const restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        openingHours: true,
      },
    });

    const now = new Date();

    // Map restaurants with isOpen status
    let result = restaurants.map((r) => {
      const isOpen = isRestaurantOpen(r.openingHours, now);
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        imageUrl: r.imageUrl,
        cuisineType: r.cuisineType,
        isOpen,
        deliveryFeeEur: Number(r.deliveryFeeEur),
        minOrderEur: Number(r.minOrderEur),
        deliveryRadiusKm: r.deliveryRadiusKm,
      };
    });

    // Apply is_open filter (must be done in-memory since it depends on opening hours)
    if (isOpenFilter === 'true') {
      result = result.filter((r) => r.isOpen);
    }

    // Sort: open restaurants first, then closed (Req 1.8)
    result.sort((a, b) => {
      if (a.isOpen === b.isOpen) return 0;
      return a.isOpen ? -1 : 1;
    });

    return Response.json({ data: result, error: null, success: true });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return Response.json(
      { data: null, error: 'Error al obtener restaurantes', success: false },
      { status: 500 }
    );
  }
}
