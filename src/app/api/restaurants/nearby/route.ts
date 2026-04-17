import { type NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { distanceKm } from '@/lib/domain/haversine';

export const dynamic = 'force-dynamic';

/**
 * GET /api/restaurants/nearby?addressId=X&excludeId=Z
 * Returns active restaurants that can deliver to the user's address,
 * sorted by distance. Optionally excludes a restaurant by ID.
 * Requires authentication (address ownership is verified).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { data: null, error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('addressId');
    const excludeId = searchParams.get('excludeId') ?? undefined;

    if (!addressId) {
      return Response.json(
        { data: null, error: 'Parámetro addressId requerido', success: false },
        { status: 422 }
      );
    }

    // Fetch address (verify ownership)
    const address = await prisma.address.findUnique({
      where: { id: addressId },
      select: { userId: true, lat: true, lng: true },
    });

    if (!address || address.userId !== session.user.id) {
      return Response.json(
        { data: null, error: 'Dirección no encontrada', success: false },
        { status: 404 }
      );
    }

    const { lat, lng } = address;

    const restaurants = await prisma.restaurant.findMany({
      where: {
        isActive: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      include: {
        openingHours: {
          select: { dayOfWeek: true, openTime: true, closeTime: true },
        },
        categories: {
          include: {
            products: {
              where: { isAvailable: true },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    const now = new Date();
    const jsDay = now.getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const nearby = restaurants
      .map((r) => {
        const dist = distanceKm(lat, lng, r.lat, r.lng);
        const canDeliver = dist <= r.deliveryRadiusKm;
        const isOpen = r.openingHours.some(
          (h) =>
            h.dayOfWeek === dayOfWeek &&
            currentTime >= h.openTime &&
            currentTime < h.closeTime
        );
        const hasProducts = r.categories.some((c) => c.products.length > 0);

        return {
          id: r.id,
          name: r.name,
          slug: r.slug,
          imageUrl: r.imageUrl,
          cuisineType: r.cuisineType,
          deliveryFeeEur: Number(r.deliveryFeeEur),
          distanceKm: Math.round(dist * 10) / 10,
          canDeliver,
          isOpen,
          hasProducts,
        };
      })
      .filter((r) => r.canDeliver && r.hasProducts)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 10);

    return Response.json({ data: nearby, error: null, success: true });
  } catch (error) {
    console.error('Error fetching nearby restaurants:', error);
    return Response.json(
      { data: null, error: 'Error al buscar restaurantes cercanos', success: false },
      { status: 500 }
    );
  }
}
