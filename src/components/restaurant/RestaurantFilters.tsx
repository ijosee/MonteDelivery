'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

const CUISINE_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'hamburguesas', label: '🍔 Hamburguesas' },
  { value: 'pizza', label: '🍕 Pizza' },
  { value: 'tradicional', label: '🍲 Tradicional' },
  { value: 'pollos', label: '🍗 Pollos' },
  { value: 'fast_food', label: '🥙 Fast Food' },
];

export default function RestaurantFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const type = searchParams.get('type') ?? '';
  const isOpen = searchParams.get('is_open') === 'true';
  const maxDeliveryFee = searchParams.get('max_delivery_fee') ?? '';
  const maxMinOrder = searchParams.get('max_min_order') ?? '';

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="mb-8 space-y-4">
      {/* Cuisine type pills */}
      <div className="flex flex-wrap items-center gap-2">
        {CUISINE_TYPES.map((ct) => {
          const isActive = type === ct.value;
          return (
            <button
              key={ct.value}
              type="button"
              onClick={() => updateParams('type', ct.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300'
              }`}
            >
              {ct.label}
            </button>
          );
        })}

        {/* Divider */}
        <span className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" />

        {/* Open now toggle */}
        <button
          type="button"
          onClick={() => updateParams('is_open', isOpen ? '' : 'true')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            isOpen
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300'
          }`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isOpen ? 'bg-white' : 'bg-green-500'
            }`}
          />
          Abierto ahora
        </button>
      </div>

      {/* Range filters row */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Max delivery fee */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="filter-delivery-fee"
            className="whitespace-nowrap text-sm text-gray-600"
          >
            Envío máx:{' '}
            <span className="font-semibold text-gray-900">
              {maxDeliveryFee ? `${maxDeliveryFee} €` : 'Sin límite'}
            </span>
          </label>
          <input
            id="filter-delivery-fee"
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={maxDeliveryFee || '10'}
            onChange={(e) =>
              updateParams(
                'max_delivery_fee',
                e.target.value === '10' ? '' : e.target.value
              )
            }
            className="w-28 accent-green-600"
          />
        </div>

        {/* Max min order */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="filter-min-order"
            className="whitespace-nowrap text-sm text-gray-600"
          >
            Pedido mín. máx:{' '}
            <span className="font-semibold text-gray-900">
              {maxMinOrder ? `${maxMinOrder} €` : 'Sin límite'}
            </span>
          </label>
          <input
            id="filter-min-order"
            type="range"
            min="0"
            max="30"
            step="1"
            value={maxMinOrder || '30'}
            onChange={(e) =>
              updateParams(
                'max_min_order',
                e.target.value === '30' ? '' : e.target.value
              )
            }
            className="w-28 accent-green-600"
          />
        </div>
      </div>
    </div>
  );
}
