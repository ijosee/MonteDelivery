'use client';

import { useState, useEffect, useCallback } from 'react';

interface Address {
  id: string;
  label: string | null;
  street: string;
  municipality: string;
  city: string;
  postalCode: string;
  floorDoor: string | null;
}

/**
 * Página de gestión de direcciones guardadas.
 * Listar, añadir y eliminar direcciones.
 * Requisitos: 5.14
 */
export default function DireccionesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/addresses');
      const json = await res.json();
      if (json.success && json.data) {
        setAddresses(json.data.addresses ?? json.data ?? []);
      }
    } catch {
      setError('Error al cargar las direcciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      } else {
        setError('Error al eliminar la dirección');
      }
    } catch {
      setError('Error al eliminar la dirección');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Mis direcciones</h1>
      <p className="mt-1 text-sm text-gray-600">
        Gestiona tus direcciones de entrega guardadas.
      </p>

      {error && (
        <div role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 text-center text-sm text-gray-500">
          Cargando direcciones...
        </div>
      ) : addresses.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            No tienes direcciones guardadas. Puedes añadir una durante el checkout.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex items-start justify-between rounded-lg border border-gray-200 p-4"
            >
              <div>
                {addr.label && (
                  <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {addr.label}
                  </span>
                )}
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {addr.street}
                </p>
                <p className="text-sm text-gray-500">
                  {addr.municipality}, {addr.city} {addr.postalCode}
                </p>
                {addr.floorDoor && (
                  <p className="text-sm text-gray-500">{addr.floorDoor}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(addr.id)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label={`Eliminar dirección ${addr.street}`}
              >
                <span aria-hidden="true">🗑️</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
