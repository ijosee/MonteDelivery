import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RestaurantDetailHeader from './RestaurantDetailHeader';
import CategoryTabs from './CategoryTabs';

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
  const supabase = await createClient();

  // Fetch restaurant with opening hours
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .eq('isActive', true)
    .single();

  if (!restaurant) {
    notFound();
  }

  // Fetch opening hours
  const { data: openingHours } = await supabase
    .from('opening_hours')
    .select('*')
    .eq('restaurantId', restaurant.id)
    .order('dayOfWeek', { ascending: true })
    .order('openTime', { ascending: true });

  // Fetch categories with products and allergens
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurantId', restaurant.id)
    .order('sortOrder', { ascending: true });

  // Fetch products for all categories
  const categoryIds = (categoriesData ?? []).map((c) => c.id);
  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .in('categoryId', categoryIds.length > 0 ? categoryIds : ['__none__'])
    .eq('isAvailable', true);

  // Fetch product allergens with allergen details
  const productIds = (productsData ?? []).map((p) => p.id);
  const { data: productAllergensData } = await supabase
    .from('product_allergens')
    .select('*, allergens(*)')
    .in('productId', productIds.length > 0 ? productIds : ['__none__']);

  const hours = openingHours ?? [];
  const now = new Date();
  const isOpen = isRestaurantOpen(hours, now);
  const nextOpeningTime = isOpen ? null : getNextOpeningTime(hours, now);

  const openingHoursFormatted = hours.map((h) => ({
    dayOfWeek: h.dayOfWeek,
    dayName: DAY_NAMES[h.dayOfWeek],
    openTime: h.openTime,
    closeTime: h.closeTime,
  }));

  // Build allergens map: productId -> allergens[]
  const allergensMap = new Map<string, { id: number; code: string; nameEs: string; icon: string }[]>();
  for (const pa of productAllergensData ?? []) {
    const allergen = pa.allergens as unknown as { id: number; code: string; nameEs: string; icon: string } | null;
    if (!allergen) continue;
    const existing = allergensMap.get(pa.productId) ?? [];
    existing.push(allergen);
    allergensMap.set(pa.productId, existing);
  }

  const categories = (categoriesData ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    sortOrder: cat.sortOrder,
    products: (productsData ?? [])
      .filter((p) => p.categoryId === cat.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        priceEur: Number(p.priceEur),
        imageUrl: p.imageUrl,
        allergens: allergensMap.get(p.id) ?? [],
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
