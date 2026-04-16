'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface OrderSummary {
  id: string;
  orderNumber: number;
  restaurantName: string;
  status: string;
  fulfillmentType: 'ASAP' | 'SCHEDULED';
  totalEur: number;
  eta: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Pendiente',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
  PREPARING: 'En preparación',
  READY_FOR_PICKUP: 'Listo',
  OUT_FOR_DELIVERY: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  PLACED: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY_FOR_PICKUP: 'bg-purple-100 text-purple-800',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders?page=${p}&limit=10`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(json.data.orders);
        setPagination(json.data.pagination);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [page, fetchOrders]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis pedidos</h1>

        {isLoading && orders.length === 0 && (
          <p className="text-gray-500 text-center py-8">Cargando pedidos...</p>
        )}

        {!isLoading && orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No tienes pedidos todavía.</p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Explorar restaurantes
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/pedidos/${order.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    Pedido #{order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-500">{order.restaurantName}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{formatDate(order.createdAt)}</span>
                <span className="font-medium text-gray-900">
                  {order.totalEur.toFixed(2)} €
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-500">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
