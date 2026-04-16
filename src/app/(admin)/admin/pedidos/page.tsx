'use client';

import { useState, useEffect, useCallback } from 'react';

interface AdminOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  restaurantName: string;
  status: string;
  fulfillmentType: string;
  totalEur: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Pendiente', ACCEPTED: 'Aceptado', REJECTED: 'Rechazado',
  PREPARING: 'Preparando', READY_FOR_PICKUP: 'Listo',
  OUT_FOR_DELIVERY: 'En camino', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
};

const ALL_STATUSES = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('fulfillmentType', typeFilter);

      const res = await fetch(`/api/admin/orders?${params}`);
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
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pedidos</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Todos los estados</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Todos los tipos</option>
            <option value="ASAP">ASAP</option>
            <option value="SCHEDULED">Programado</option>
          </select>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Restaurante</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700">Estado</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700">Tipo</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No hay pedidos</td></tr>
                ) : orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">#{o.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{o.customerName}</p>
                      <p className="text-xs text-gray-400">{o.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{o.restaurantName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{o.fulfillmentType}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{o.totalEur.toFixed(2)} €</td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
                      {new Date(o.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">Anterior</button>
            <span className="text-sm text-gray-500">Página {pagination.page} de {pagination.totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">Siguiente</button>
          </div>
        )}
      </div>
    </div>
  );
}
