import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import RestaurantDetailHeader from './RestaurantDetailHeader';
import CategoryTabs from './CategoryTabs';

export const dynamic = 'force-dynamic';

/** Converts JS getDay() (0=Sunday) to our system (0=Monday, 6=Sunday). */
function jsDayToSystem(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function isRestaurantOpen(
  openingHours: { dayOfWeek: number; openTime: string; closeTime: string }[],
  now: Date
): boolean {
  const dayOfWeek = jsDayToSystem(now.getDay());
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return openingHours.some(
    (h) => h.dayOfWeek === dayOfWeek && currentTime >= h.openTime && currentTime < h.closeTime
  );
}

function getNextOpeningTime(
  openingHours: { dayOfWeek: number; openTime: string; closeTime: string }[],
  now: Date
): string | null {
  if (openingHours.length === 0) return null;
  const currentDayOfWeek = jsDayToSystem(now.getDay());
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Check remaining hours today
  const todayHours = openingHours
    .filter((h) => h.dayOfWeek === currentDayOfWeek && h.openTime > currentTime)
    .sort((a, b) => a.openTime.localeCompare(b.openTime));
  if (todayHours.length > 0) return `Hoy a las ${todayHours[0].openTime}`;

  // Check next 7 days
  for (let offset = 1; offset <= 7; offset++) {
    const targetDay = (currentDayOfWeek + offset) % 7;
    const dayHours = openingHours
      .filter((h) => h.dayOfWeek === targetDay)
      .sort((a, b) => a.openTime.localeCompare(b.openTime));
    if (dayHours.length > 0) {
      return `${DAY_NAMES[targetDay]} a las ${dayHours[0].openTime}`;
    }
  }
  return null;
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      openingHours: {
        orderBy: [{ dayOfWeek: 'asc' }, { openTime: 'asc' }],
      },
      categories: {
        orderBy: { sortOrder: 'asc' },
        include: {
          products: {
            where: { isAvailable: true },
            include: {
              productAllergens: {
                include: { allergen: true },
              },
            },
          },
        },
      },
    },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  const now = new Date();
  const isOpen = isRestaurantOpen(restaurant.openingHours, now);
  const nextOpeningTime = isOpen ? null : getNextOpeningTime(restaurant.openingHours, now);

  const openingHoursFormatted = restaurant.openingHours.map((h) => ({
    dayOfWeek: h.dayOfWeek,
    dayName: DAY_NAMES[h.dayOfWeek],
    openTime: h.openTime,
    closeTime: h.closeTime,
  }));

  const categories = restaurant.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    sortOrder: cat.sortOrder,
    products: cat.products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceEur: Number(p.priceEur),
      imageUrl: p.imageUrl,
      allergens: p.productAllergens.map((pa) => ({
        id: pa.allergen.id,
        code: pa.allergen.code,
        nameEs: pa.allergen.nameEs,
        icon: pa.allergen.icon,
      })),
    })),
  }));

  return (
    <main className="mx-auto w-full max-w-7xl">
      <RestaurantDetailHeader
        name={restaurant.name}
        imageUrl={restaurant.imageUrl}
        cuisineType={restaurant.cuisineType}
        isOpen={isOpen}
        nextOpeningTime={nextOpeningTime}
        deliveryFeeEur={Number(restaurant.deliveryFeeEur)}
        minOrderEur={Number(restaurant.minOrderEur)}
        deliveryRadiusKm={restaurant.deliveryRadiusKm}
        openingHours={openingHoursFormatted}
      />

      {/* Closed notice for SCHEDULED orders */}
      {!isOpen && nextOpeningTime && (
        <div className="mx-4 mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4 sm:mx-6 lg:mx-8">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">⏰ Restaurante cerrado.</span>{' '}
            Próxima apertura: {nextOpeningTime}. Puedes explorar el catálogo y
            programar tu pedido.
          </p>
        </div>
      )}

      {/* Category tabs + products */}
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {categories.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            Este restaurante aún no tiene productos disponibles.
          </p>
        ) : (
          <CategoryTabs categories={categories} />
        )}
      </div>
    </main>
  );
}
