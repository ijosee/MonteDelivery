'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderConfirmation {
  id: string;
  orderNumber: number;
  status: string;
  fulfillmentType: 'ASAP' | 'SCHEDULED';
  subtotalEur: number;
  deliveryFeeEur: number;
  totalEur: number;
  eta: string | null;
  etaWindowEnd: string | null;
  createdAt: string;
}

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [legalRegistered, setLegalRegistered] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setOrder(json.data);
        } else {
          router.push('/');
        }
      } catch {
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [orderId, router]);

  // Register legal acceptance and send confirmation email
  useEffect(() => {
    if (!orderId || legalRegistered) return;

    async function registerLegalAndEmail() {
      try {
        await fetch(`/api/orders/${orderId}/confirm`, {
          method: 'POST',
        });
        setLegalRegistered(true);
      } catch {
        // Non-blocking — legal acceptance and email are best-effort
        console.error('Error registering legal acceptance');
      }
    }

    registerLegalAndEmail();
  }, [orderId, legalRegistered]);

  const formatEta = (o: OrderConfirmation): string => {
    if (o.fulfillmentType === 'SCHEDULED' && o.eta && o.etaWindowEnd) {
      const eta = new Date(o.eta);
      const end = new Date(o.etaWindowEnd);
      const etaTime = `${String(eta.getHours()).padStart(2, '0')}:${String(eta.getMinutes()).padStart(2, '0')}`;
      const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
      return `Entrega prevista: ${etaTime}–${endTime}`;
    }
    if (o.eta) {
      const eta = new Date(o.eta);
      return `Entrega estimada: ${eta.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return 'ETA calculándose...';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando confirmación...</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Success icon */}
        <div className="text-6xl mb-4">✅</div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Pedido confirmado!
        </h1>

        <p className="text-gray-600 mb-6">
          Tu pedido ha sido registrado correctamente.
        </p>

        {/* Order details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Número de pedido</span>
            <span className="font-bold text-gray-900">#{order.orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total</span>
            <span className="font-bold text-green-700">
              {order.totalEur.toFixed(2)} €
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tipo</span>
            <span className="text-gray-900">
              {order.fulfillmentType === 'ASAP' ? 'Lo antes posible' : 'Programado'}
            </span>
          </div>
          <hr />
          <p className="text-sm font-medium text-green-700">
            {formatEta(order)}
          </p>
        </div>

        <p className="text-xs text-gray-400 mb-6">
          Pago: Contra entrega (efectivo)
        </p>

        {/* CTA */}
        <Link
          href={`/pedidos/${order.id}`}
          className="block w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors mb-3"
        >
          Ver seguimiento
        </Link>

        <Link
          href="/"
          className="block w-full py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Cargando confirmación...</p>
        </div>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  );
}
