'use client';

interface StatusHistoryEntry {
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  createdAt: string;
}

interface OrderTimelineProps {
  statusHistory: StatusHistoryEntry[];
  currentStatus: string;
}

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Pedido realizado',
  ACCEPTED: 'Aceptado por el restaurante',
  REJECTED: 'Rechazado',
  PREPARING: 'En preparación',
  READY_FOR_PICKUP: 'Listo para recoger',
  OUT_FOR_DELIVERY: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_ICONS: Record<string, string> = {
  PLACED: '📋',
  ACCEPTED: '✅',
  REJECTED: '❌',
  PREPARING: '👨‍🍳',
  READY_FOR_PICKUP: '📦',
  OUT_FOR_DELIVERY: '🚗',
  DELIVERED: '🎉',
  CANCELLED: '🚫',
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OrderTimeline({ statusHistory, currentStatus }: OrderTimelineProps) {
  return (
    <div className="space-y-0" role="list" aria-label="Línea de tiempo del pedido">
      {statusHistory.map((entry, index) => {
        const isLast = index === statusHistory.length - 1;
        const isCurrent = entry.toStatus === currentStatus;
        const isTerminal = ['DELIVERED', 'REJECTED', 'CANCELLED'].includes(entry.toStatus);

        return (
          <div key={`${entry.toStatus}-${entry.createdAt}`} className="flex gap-3" role="listitem">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                  isCurrent
                    ? isTerminal
                      ? entry.toStatus === 'DELIVERED'
                        ? 'bg-green-100 ring-2 ring-green-500'
                        : 'bg-red-100 ring-2 ring-red-500'
                      : 'bg-green-100 ring-2 ring-green-500'
                    : 'bg-gray-100'
                }`}
              >
                {STATUS_ICONS[entry.toStatus] ?? '•'}
              </div>
              {!isLast && (
                <div className="w-0.5 h-8 bg-gray-200" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 min-w-0">
              <p
                className={`text-sm font-medium ${
                  isCurrent ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                {STATUS_LABELS[entry.toStatus] ?? entry.toStatus}
              </p>
              <p className="text-xs text-gray-400">
                {formatTimestamp(entry.createdAt)}
              </p>
              {entry.reason && (
                <p className="text-xs text-gray-500 mt-0.5 italic">
                  {entry.reason}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
