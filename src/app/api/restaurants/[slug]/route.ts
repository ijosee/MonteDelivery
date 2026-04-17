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

/** Day names in Spanish */
const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * Finds the next opening time for a restaurant that is currently closed.
 */
function getNextOpeningTime(
  openingHours: { dayOfWeek: number; openTime: string; closeTime: string }[],
  now: Date = new Date()
): string | null {
  if (openingHours.length === 0) return null;

  const currentDayOfWeek = jsDayToSystem(now.getDay());
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Check remaining hours today
  const todayHours = openingHours
    .filter((h) => h.dayOfWeek === currentDayOfWeek && h.openTime > currentTime)
    .sort((a, b) => a.openTime.localeCompare(b.openTime));

  if (todayHours.length > 0) {
    return `Hoy a las ${todayHours[0].openTime}`;
  }

  // Check next 7 days
  for (let offset = 1; offset <= 7; offset++) {
    const targetDay = (currentDayOfWeek + offset) % 7;
    const dayHours = openingHours
      .filter((h) => h.dayOfWeek === targetDay)
      .sort((a, b) => a.openTime.localeCompare(b.openTime));

    if (dayHours.length > 0) {
      const dayName = DAY_NAMES[targetDay];
      return `${dayName} a las ${dayHours[0].openTime}`;
    }
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        openingHours: {
          orderBy: [{ dayOfWeek: 'asc' }, { openTime: 'asc' }],
        },
        deliveryZones: true,
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            products: {
              where: { isAvailable: true },
              include: {
                productAllergens: {
                  include: {
                    allergen: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!restaurant || !restaurant.isActive) {
      return Response.json(
        { data: null, error: 'Restaurante no encontrado', success: false },
        { status: 404 }
      );
    }

    const now = new Date();
    const isOpen = isRestaurantOpen(restaurant.openingHours, now);
    const nextOpeningTime = isOpen ? null : getNextOpeningTime(restaurant.openingHours, now);

    const data = {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      imageUrl: restaurant.imageUrl,
      cuisineType: restaurant.cuisineType,
      isOpen,
      nextOpeningTime,
      deliveryFeeEur: Number(restaurant.deliveryFeeEur),
      minOrderEur: Number(restaurant.minOrderEur),
      deliveryRadiusKm: restaurant.deliveryRadiusKm,
      lat: restaurant.lat,
      lng: restaurant.lng,
      openingHours: restaurant.openingHours.map((h: typeof restaurant.openingHours[number]) => ({
        dayOfWeek: h.dayOfWeek,
        dayName: DAY_NAMES[h.dayOfWeek],
        openTime: h.openTime,
        closeTime: h.closeTime,
      })),
      deliveryZones: restaurant.deliveryZones.map((z: typeof restaurant.deliveryZones[number]) => ({
        radiusKm: z.radiusKm,
        lat: z.lat,
        lng: z.lng,
      })),
      categories: restaurant.categories.map((cat: typeof restaurant.categories[number]) => ({
        id: cat.id,
        name: cat.name,
        sortOrder: cat.sortOrder,
        products: cat.products.map((p: typeof cat.products[number]) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          priceEur: Number(p.priceEur),
          imageUrl: p.imageUrl,
          isAvailable: p.isAvailable,
          allergens: p.productAllergens.map((pa: typeof p.productAllergens[number]) => ({
            id: pa.allergen.id,
            code: pa.allergen.code,
            nameEs: pa.allergen.nameEs,
            icon: pa.allergen.icon,
          })),
        })),
      })),
    };

    return Response.json({ data, error: null, success: true });
  } catch (error) {
    console.error('Error fetching restaurant detail:', error);
    return Response.json(
      { data: null, error: 'Error al obtener el restaurante', success: false },
      { status: 500 }
    );
  }
}
