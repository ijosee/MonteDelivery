'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePolling } from '@/hooks/use-polling';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { ETADisplay } from '@/components/order/ETADisplay';
import { isTerminalStatus } from '@/lib/domain/order-fsm';
import { MVP_CONSTANTS } from '@/lib/constants';

interface OrderDetail {
  id: string;
  orderNumber: number;
  restaurantName: string;
  status: string;
  fulfillmentType: 'ASAP' | 'SCHEDULED';
  scheduledFor: string | null;
  subtotalEur: number;
  deliveryFeeEur: number;
  totalEur: number;
  eta: string | null;
  etaWindowEnd: string | null;
  phone: string;
  address: {
    street: string;
    municipality: string;
    city: string;
    postalCode: string;
    floorDoor: string | null;
  };
  items: Array<{
    id: string;
    productName: string;
    productPriceEur: number;
    quantity: number;
  }>;
  statusHistory: Array<{
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    createdAt: string;
  }>;
  createdAt: string;
}

const ACTIVE_FAST_STATES = ['PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'];

function getPollingInterval(status: string): number {
  if (isTerminalStatus(status as Parameters<typeof isTerminalStatus>[0])) return 0;
  if (ACTIVE_FAST_STATES.includes(status)) return MVP_CONSTANTS.POLLING_ACTIVE_MS;
  return MVP_CONSTANTS.POLLING_INACTIVE_MS;
}

/** Check if customer can cancel this order based on FSM rules */
function canCancel(status: string, fulfillmentType: string, scheduledFor: string | null): boolean {
  if (status === 'PLACED') return true;
  if (status === 'ACCEPTED' && fulfillmentType === 'SCHEDULED' && scheduledFor) {
    const minutesUntil = (new Date(scheduledFor).getTime() - Date.now()) / 60000;
    return minutesUntil > 60;
  }
  return false;
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const status = order?.status ?? 'PLACED';
  const interval = getPollingInterval(status);
  const isTerminal = isTerminalStatus(status as Parameters<typeof isTerminalStatus>[0]);

  const fetcher = useCallback(async () => {
    const res = await fetch(`/api/orders/${id}`);
    const json = await res.json();
    if (json.success && json.data) return json.data as OrderDetail;
    throw new Error(json.error ?? 'Error');
  }, [id]);

  usePolling<OrderDetail>({
    fetcher,
    interval: interval || MVP_CONSTANTS.POLLING_INACTIVE_MS,
    enabled: !isTerminal,
    onData: setOrder,
  });

  // Also do initial fetch via polling (enabled handles it)
  // But we need to handle the case where polling is disabled (terminal)
  usePolling<OrderDetail>({
    fetcher,
    interval: 999999,
    enabled: isTerminal || !order,
    onData: (data) => {
      if (!order) setOrder(data);
    },
  });

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        // Refresh order data
        const refreshRes = await fetch(`/api/orders/${id}`);
        const refreshJson = await refreshRes.json();
        if (refreshJson.success && refreshJson.data) {
          setOrder(refreshJson.data);
        }
      } else {
        setCancelError(json.error ?? 'Error al cancelar');
      }
    } catch {
      setCancelError('Error al cancelar el pedido');
    } finally {
      setCancelling(false);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando pedido...</p>
      </div>
    );
  }

  const showCancel = canCancel(order.status, order.fulfillmentType, order.scheduledFor);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <button
          type="button"
          onClick={() => router.push('/pedidos')}
          className="text-sm text-green-700 hover:text-green-800 mb-4 inline-flex items-center gap-1"
        >
          ← Mis pedidos
        </button>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">
            Pedido #{order.orderNumber}
          </h1>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
            {order.fulfillmentType === 'ASAP' ? '⚡ ASAP' : '📅 Programado'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-6">{order.restaurantName}</p>

        {/* ETA */}
        <div className="mb-6">
          <ETADisplay
            fulfillmentType={order.fulfillmentType}
            eta={order.eta}
            etaWindowEnd={order.etaWindowEnd}
            status={order.status}
          />
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Estado del pedido</h2>
          <OrderTimeline
            statusHistory={order.statusHistory}
            currentStatus={order.status}
          />
        </div>

        {/* Cancel button */}
        {showCancel && (
          <div className="mb-6">
            {cancelError && (
              <p className="text-sm text-red-600 mb-2">{cancelError}</p>
            )}
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full py-2.5 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? 'Cancelando...' : 'Cancelar pedido'}
            </button>
          </div>
        )}

        {/* Order details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Detalle del pedido</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.quantity}x {item.productName}
                </span>
                <span className="text-gray-900 font-medium">
                  {(item.productPriceEur * item.quantity).toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
          <hr className="my-3" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{order.subtotalEur.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Envío</span>
              <span>{order.deliveryFeeEur.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-bold text-base mt-1">
              <span>Total</span>
              <span className="text-green-700">{order.totalEur.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Dirección de entrega</h2>
          <p className="text-sm text-gray-700">{order.address.street}</p>
          <p className="text-sm text-gray-500">
            {order.address.municipality}, {order.address.postalCode}
          </p>
          {order.address.floorDoor && (
            <p className="text-sm text-gray-500">{order.address.floorDoor}</p>
          )}
        </div>
      </div>
    </div>
  );
}
