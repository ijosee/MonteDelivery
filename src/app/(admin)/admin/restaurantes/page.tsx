'use client';

import { useState, useEffect, useCallback } from 'react';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  cuisineType: string | null;
  isActive: boolean;
  deliveryFeeEur: number;
  minOrderEur: number;
  orderCount: number;
  createdAt: string;
}

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurants?limit=50');
      const json = await res.json();
      if (json.success && json.data) {
        setRestaurants(json.data.restaurants);
      }
    } catch {
      setError('Error al cargar restaurantes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const toggleActive = async (id: string, currentActive: boolean) => {
    setActionLoading(id);
    setError(null);
    try {
      const res = await fetch('/api/admin/restaurants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      const json = await res.json();
      if (json.success) {
        setRestaurants((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isActive: !currentActive } : r))
        );
      } else {
        setError(json.error);
      }
    } catch {
      setError('Error al actualizar');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Cargando...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Restaurantes</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Tipo</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700">Estado</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700">Pedidos</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Envío</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Mín.</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {restaurants.map((r) => (
                  <tr key={r.id} className={!r.isActive ? 'bg-gray-50 opacity-60' : ''}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-400">/{r.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.cuisineType ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        r.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {r.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{r.orderCount}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.deliveryFeeEur.toFixed(2)} €</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.minOrderEur.toFixed(2)} €</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleActive(r.id, r.isActive)}
                        disabled={actionLoading === r.id}
                        className={`text-xs px-3 py-1 rounded-lg font-medium disabled:opacity-50 ${
                          r.isActive
                            ? 'border border-red-300 text-red-700 hover:bg-red-50'
                            : 'border border-green-300 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {r.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
