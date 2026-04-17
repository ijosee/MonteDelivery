import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import RestaurantCard from '@/components/restaurant/RestaurantCard';
import RestaurantFilters from '@/components/restaurant/RestaurantFilters';
import type { RestaurantDTO } from '@/types';

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
  now: Date
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

async function getRestaurants(searchParams: {
  type?: string;
  is_open?: string;
  max_delivery_fee?: string;
  max_min_order?: string;
}): Promise<RestaurantDTO[]> {
  const where: Record<string, unknown> = { isActive: true };

  if (searchParams.type) {
    where.cuisineType = searchParams.type;
  }

  if (searchParams.max_delivery_fee) {
    where.deliveryFeeEur = { lte: parseFloat(searchParams.max_delivery_fee) };
  }

  if (searchParams.max_min_order) {
    where.minOrderEur = { lte: parseFloat(searchParams.max_min_order) };
  }

  const restaurants = await prisma.restaurant.findMany({
    where,
    include: { openingHours: true },
  });

  const now = new Date();

  let result: RestaurantDTO[] = restaurants.map((r: typeof restaurants[number]) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    imageUrl: r.imageUrl,
    cuisineType: r.cuisineType,
    isOpen: isRestaurantOpen(r.openingHours, now),
    deliveryFeeEur: Number(r.deliveryFeeEur),
    minOrderEur: Number(r.minOrderEur),
    deliveryRadiusKm: r.deliveryRadiusKm,
  }));

  // Apply is_open filter in-memory
  if (searchParams.is_open === 'true') {
    result = result.filter((r) => r.isOpen);
  }

  // Sort: open restaurants first (Req 1.8)
  result.sort((a, b) => {
    if (a.isOpen === b.isOpen) return 0;
    return a.isOpen ? -1 : 1;
  });

  return result;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const filters = {
    type: typeof params.type === 'string' ? params.type : undefined,
    is_open: typeof params.is_open === 'string' ? params.is_open : undefined,
    max_delivery_fee:
      typeof params.max_delivery_fee === 'string'
        ? params.max_delivery_fee
        : undefined,
    max_min_order:
      typeof params.max_min_order === 'string'
        ? params.max_min_order
        : undefined,
  };

  const restaurants = await getRestaurants(filters);

  return (
    <>
      {/* Hero section */}
      <section className="bg-gradient-to-br from-green-600 to-green-700">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Comida a domicilio en tu pueblo
          </h1>
          <p className="mt-3 max-w-xl text-base text-green-100 sm:text-lg">
            Pide de los mejores restaurantes de Andalucía
          </p>
        </div>
      </section>

      {/* Main content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <RestaurantFilters />
        </Suspense>

        {restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 px-4 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z"
              />
            </svg>
            <p className="mt-4 text-base font-medium text-gray-600">
              No se encontraron restaurantes con estos filtros. Prueba a cambiar
              los criterios de búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
