import Link from 'next/link';
import Image from 'next/image';
import type { RestaurantDTO } from '@/types';

interface RestaurantCardProps {
  readonly restaurant: RestaurantDTO;
}

const CUISINE_EMOJIS: Record<string, string> = {
  hamburguesas: '🍔',
  tradicional: '🍲',
  pizza: '🍕',
  pollos: '🍗',
  fast_food: '🥙',
};

const CUISINE_LABELS: Record<string, string> = {
  hamburguesas: 'Hamburguesas',
  tradicional: 'Tradicional',
  pizza: 'Pizza',
  pollos: 'Pollos',
  fast_food: 'Fast Food',
};

const CUISINE_COLORS: Record<string, string> = {
  hamburguesas: 'from-amber-400 to-orange-500',
  tradicional: 'from-red-400 to-rose-500',
  pizza: 'from-green-400 to-emerald-500',
  pollos: 'from-yellow-400 to-amber-500',
  fast_food: 'from-purple-400 to-indigo-500',
};

function hasRealImage(imageUrl: string | null): boolean {
  return !!imageUrl && !imageUrl.startsWith('/placeholder');
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const emoji = CUISINE_EMOJIS[restaurant.cuisineType ?? ''] ?? '🍽️';
  const gradient =
    CUISINE_COLORS[restaurant.cuisineType ?? ''] ?? 'from-gray-400 to-gray-500';
  const cuisineLabel =
    CUISINE_LABELS[restaurant.cuisineType ?? ''] ?? restaurant.cuisineType;
  const showImage = hasRealImage(restaurant.imageUrl);

  return (
    <Link
      href={`/restaurante/${restaurant.slug}`}
      className={`group block overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${
        !restaurant.isOpen ? 'opacity-75' : ''
      }`}
    >
      {/* Image area */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {showImage ? (
          <Image
            src={restaurant.imageUrl!}
            alt={restaurant.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}
          >
            <span className="text-6xl drop-shadow-lg">{emoji}</span>
          </div>
        )}

        {/* Dark overlay for text readability */}
        {showImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        )}

        {/* Open/Closed badge */}
        <span
          className={`absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-md backdrop-blur-sm ${
            restaurant.isOpen
              ? 'bg-green-500/90 text-white'
              : 'bg-gray-800/80 text-gray-200'
          }`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              restaurant.isOpen ? 'bg-white' : 'bg-red-400'
            }`}
          />
          {restaurant.isOpen ? 'Abierto' : 'Cerrado'}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-gray-900 group-hover:text-green-600 truncate leading-tight">
            {restaurant.name}
          </h3>
        </div>

        {restaurant.cuisineType && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            <span aria-hidden="true">{emoji}</span>
            {cuisineLabel}
          </span>
        )}

        <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg
              className="h-3.5 w-3.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a3 3 0 0 1-3-3V8.25m19.5 0a3 3 0 0 0-3-3h-1.5m-9 0H3.375m0 0A1.125 1.125 0 0 0 2.25 6.375v4.875"
              />
            </svg>
            Envío {restaurant.deliveryFeeEur.toFixed(2)} €
          </span>
          <span className="text-gray-300">·</span>
          <span>Mín. {restaurant.minOrderEur.toFixed(2)} €</span>
        </div>
      </div>
    </Link>
  );
}
