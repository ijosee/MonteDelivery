'use client';

interface ETADisplayProps {
  fulfillmentType: 'ASAP' | 'SCHEDULED';
  eta: string | null;
  etaWindowEnd?: string | null;
  status: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function ETADisplay({ fulfillmentType, eta, etaWindowEnd, status }: ETADisplayProps) {
  const isTerminal = ['DELIVERED', 'REJECTED', 'CANCELLED'].includes(status);

  if (isTerminal) {
    if (status === 'DELIVERED') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm font-medium text-green-800">🎉 Pedido entregado</p>
        </div>
      );
    }
    if (status === 'CANCELLED') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-800">🚫 Pedido cancelado</p>
        </div>
      );
    }
    if (status === 'REJECTED') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-800">❌ Pedido rechazado</p>
        </div>
      );
    }
  }

  if (!eta) return null;

  if (fulfillmentType === 'SCHEDULED' && etaWindowEnd) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Entrega programada</p>
        <p className="text-lg font-bold text-blue-900 mt-1">
          {formatTime(eta)} – {formatTime(etaWindowEnd)}
        </p>
        <p className="text-xs text-blue-600 mt-0.5">{formatDate(eta)}</p>
      </div>
    );
  }

  // ASAP
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
      <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Entrega estimada</p>
      <p className="text-lg font-bold text-green-900 mt-1">
        {formatTime(eta)}
      </p>
    </div>
  );
}
