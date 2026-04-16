'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

const CUISINE_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'Hamburguesas', label: 'Hamburguesas' },
  { value: 'Pizza', label: 'Pizza' },
  { value: 'Mediterránea', label: 'Mediterránea' },
  { value: 'Japonesa', label: 'Japonesa' },
  { value: 'Mexicana', label: 'Mexicana' },
  { value: 'China', label: 'China' },
  { value: 'India', label: 'India' },
  { value: 'Kebab', label: 'Kebab' },
  { value: 'Tradicional', label: 'Tradicional' },
  { value: 'Tapas', label: 'Tapas' },
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
    <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Filtros
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Cuisine type */}
        <div>
          <label htmlFor="filter-type" className="block text-sm font-medium text-gray-600 mb-1">
            Tipo de cocina
          </label>
          <select
            id="filter-type"
            value={type}
            onChange={(e) => updateParams('type', e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {CUISINE_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>
                {ct.label}
              </option>
            ))}
          </select>
        </div>

        {/* Open now toggle */}
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isOpen}
              onChange={(e) =>
                updateParams('is_open', e.target.checked ? 'true' : '')
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Abierto ahora
            </span>
          </label>
        </div>

        {/* Max delivery fee */}
        <div>
          <label htmlFor="filter-delivery-fee" className="block text-sm font-medium text-gray-600 mb-1">
            Envío máximo: {maxDeliveryFee ? `${maxDeliveryFee} €` : 'Sin límite'}
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
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>0 €</span>
            <span>10 €</span>
          </div>
        </div>

        {/* Max min order */}
        <div>
          <label htmlFor="filter-min-order" className="block text-sm font-medium text-gray-600 mb-1">
            Pedido mínimo máx.: {maxMinOrder ? `${maxMinOrder} €` : 'Sin límite'}
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
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>0 €</span>
            <span>30 €</span>
          </div>
        </div>
      </div>
    </div>
  );
}
