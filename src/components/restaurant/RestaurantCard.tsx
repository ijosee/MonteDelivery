import Link from 'next/link';
import type { RestaurantDTO } from '@/types';

interface RestaurantCardProps {
  restaurant: RestaurantDTO;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link
      href={`/restaurante/${restaurant.slug}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
        {restaurant.imageUrl ? (
          <img
            src={restaurant.imageUrl}
            alt={`Imagen de ${restaurant.name}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <svg
              className="h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
        )}

        {/* Open/Closed badge */}
        <span
          className={`absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            restaurant.isOpen
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {restaurant.isOpen ? 'Abierto' : 'Cerrado'}
        </span>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 truncate">
          {restaurant.name}
        </h3>

        {restaurant.cuisineType && (
          <p className="mt-0.5 text-sm text-gray-500">{restaurant.cuisineType}</p>
        )}

        <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h.008M21 12.75V6.375c0-.621-.504-1.125-1.125-1.125H5.25c-.621 0-1.125.504-1.125 1.125v8.25" />
            </svg>
            {restaurant.deliveryFeeEur.toFixed(2)} €
          </span>
          <span className="text-gray-300">|</span>
          <span>
            Mín. {restaurant.minOrderEur.toFixed(2)} €
          </span>
        </div>
      </div>
    </Link>
  );
}
