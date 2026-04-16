'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePolling } from '@/hooks/use-polling';
import { MVP_CONSTANTS } from '@/lib/constants';

interface OrderItem {
  productName: string;
  productPriceEur: number;
  quantity: number;
}

interface RestaurantOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  status: string;
  fulfillmentType: 'ASAP' | 'SCHEDULED';
  scheduledFor: string | null;
  totalEur: number;
  eta: string | null;
  phone: string;
  address: {
    street: string;
    municipality: string;
    postalCode: string;
    floorDoor: string | null;
  };
  items: OrderItem[];
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Nuevo',
  ACCEPTED: 'Aceptado',
  PREPARING: 'Preparando',
  READY_FOR_PICKUP: 'Listo',
  OUT_FOR_DELIVERY: 'En camino',
  DELIVERED: 'Entregado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
};

const NEXT_STATUS: Record<string, string> = {
  PLACED: 'ACCEPTED',
  ACCEPTED: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  PLACED: 'Aceptar',
  ACCEPTED: 'Preparar',
  PREPARING: 'Listo para recoger',
  READY_FOR_PICKUP: 'En camino',
  OUT_FOR_DELIVERY: 'Entregado',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function classifyScheduled(order: RestaurantOrder): 'proximos' | 'a_preparar' {
  if (!order.scheduledFor) return 'a_preparar';
  const minutesUntil = (new Date(order.scheduledFor).getTime() - Date.now()) / 60000;
  return minutesUntil > MVP_CONSTANTS.PREP_WINDOW_MIN ? 'proximos' : 'a_preparar';
}

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const prevOrderCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/restaurant/orders?limit=50');
    const json = await res.json();
    if (json.success && json.data) return json.data.orders as RestaurantOrder[];
    return [];
  }, []);

  const { data: polledOrders } = usePolling<RestaurantOrder[]>({
    fetcher,
    interval: MVP_CONSTANTS.POLLING_ACTIVE_MS,
    enabled: true,
    onData: (data) => {
      if (data) setOrders(data);
    },
  });

  // Sound notification for new orders
  useEffect(() => {
    if (!polledOrders) return;
    const newCount = polledOrders.filter((o) => o.status === 'PLACED').length;
    if (newCount > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
      // Play notification sound
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH+Jj4yHfnBkWFRYYm50fIWLjYqEe3BkWFRYYm50fIWLjYqEe3BkWFRYYm50fIWLjQ==');
        }
        audioRef.current.play().catch(() => {});
      } catch {
        // Audio not available
      }
    }
    prevOrderCountRef.current = newCount;
  }, [polledOrders]);

  const handleAccept = async (orderId: string) => {
    setActionLoading(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/restaurant/orders/${orderId}/accept`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) setError(json.error);
      else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'ACCEPTED' } : o))
        );
      }
    } catch {
      setError('Error al aceptar el pedido');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!rejectReason.trim()) {
      setError('El motivo de rechazo es obligatorio');
      return;
    }
    setActionLoading(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/restaurant/orders/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const json = await res.json();
      if (!json.success) setError(json.error);
      else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'REJECTED' } : o))
        );
        setRejectingId(null);
        setRejectReason('');
      }
    } catch {
      setError('Error al rechazar el pedido');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdvanceStatus = async (orderId: string, targetStatus: string) => {
    setActionLoading(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/restaurant/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
      const json = await res.json();
      if (!json.success) setError(json.error);
      else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: targetStatus } : o))
        );
      }
    } catch {
      setError('Error al cambiar estado');
    } finally {
      setActionLoading(null);
    }
  };

  // Classify orders
  const activeStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'];
  const activeOrders = orders.filter((o) => activeStatuses.includes(o.status));
  const asapOrders = activeOrders
    .filter((o) => o.fulfillmentType === 'ASAP')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const scheduledOrders = activeOrders.filter((o) => o.fulfillmentType === 'SCHEDULED');
  const proximosOrders = scheduledOrders.filter((o) => classifyScheduled(o) === 'proximos');
  const aPreparar = scheduledOrders.filter((o) => classifyScheduled(o) === 'a_preparar');

  const newOrderCount = orders.filter((o) => o.status === 'PLACED').length;

  // Average ETA
  const ordersWithEta = activeOrders.filter((o) => o.eta);
  const avgEtaMinutes = ordersWithEta.length > 0
    ? Math.round(
        ordersWithEta.reduce((sum, o) => {
          const mins = (new Date(o.eta!).getTime() - Date.now()) / 60000;
          return sum + Math.max(0, mins);
        }, 0) / ordersWithEta.length
      )
    : 0;

  const renderOrderCard = (order: RestaurantOrder) => {
    const isNew = order.status === 'PLACED';
    const nextStatus = NEXT_STATUS[order.status];
    const nextLabel = NEXT_STATUS_LABEL[order.status];

    return (
      <div
        key={order.id}
        className={`bg-white rounded-lg border p-4 ${
          isNew ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-gray-200'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-bold text-gray-900">#{order.orderNumber}</p>
            <p className="text-sm text-gray-500">{order.customerName}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            isNew ? 'bg-yellow-100 text-yellow-800 animate-pulse' : 'bg-gray-100 text-gray-700'
          }`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* Items */}
        <div className="text-sm text-gray-600 mb-2 space-y-0.5">
          {order.items.map((item, i) => (
            <p key={i}>{item.quantity}x {item.productName}</p>
          ))}
        </div>

        <div className="text-sm text-gray-500 mb-2">
          <p>📍 {order.address.street}, {order.address.municipality}</p>
          <p>📞 {order.phone}</p>
          {order.fulfillmentType === 'SCHEDULED' && order.scheduledFor && (
            <p>📅 {formatTime(order.scheduledFor)}</p>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-green-700">{order.totalEur.toFixed(2)} €</span>
          <span className="text-xs text-gray-400">{formatTime(order.createdAt)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isNew && (
            <>
              <button
                type="button"
                onClick={() => handleAccept(order.id)}
                disabled={actionLoading === order.id}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                ✅ Aceptar
              </button>
              <button
                type="button"
                onClick={() => setRejectingId(order.id)}
                disabled={actionLoading === order.id}
                className="px-3 py-2 border border-red-300 text-red-700 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
              >
                ❌
              </button>
            </>
          )}
          {!isNew && nextStatus && (
            <button
              type="button"
              onClick={() => handleAdvanceStatus(order.id, nextStatus)}
              disabled={actionLoading === order.id}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              → {nextLabel}
            </button>
          )}
        </div>

        {/* Reject dialog */}
        {rejectingId === order.id && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg">
            <label htmlFor={`reject-${order.id}`} className="block text-sm font-medium text-red-800 mb-1">
              Motivo de rechazo *
            </label>
            <input
              id={`reject-${order.id}`}
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej: Sin stock de ingredientes"
              className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-2"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleReject(order.id)}
                disabled={actionLoading === order.id}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Confirmar rechazo
              </button>
              <button
                type="button"
                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel de restaurante</h1>

        {/* Metrics bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
            <p className="text-xs text-gray-500">Pedidos activos</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className={`text-2xl font-bold ${newOrderCount > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
              {newOrderCount}
            </p>
            <p className="text-xs text-gray-500">Nuevos</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{avgEtaMinutes} min</p>
            <p className="text-xs text-gray-500">ETA promedio</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ASAP Queue */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            ⚡ Pedidos ASAP ({asapOrders.length})
          </h2>
          {asapOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No hay pedidos ASAP activos</p>
          ) : (
            <div className="space-y-3">
              {asapOrders.map(renderOrderCard)}
            </div>
          )}
        </section>

        {/* Scheduled — A preparar */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            🔥 A preparar — ≤45 min ({aPreparar.length})
          </h2>
          {aPreparar.length === 0 ? (
            <p className="text-sm text-gray-500">No hay pedidos programados próximos</p>
          ) : (
            <div className="space-y-3">
              {aPreparar.map(renderOrderCard)}
            </div>
          )}
        </section>

        {/* Scheduled — Próximos */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            📅 Próximos — &gt;45 min ({proximosOrders.length})
          </h2>
          {proximosOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No hay pedidos programados lejanos</p>
          ) : (
            <div className="space-y-3">
              {proximosOrders.map(renderOrderCard)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
