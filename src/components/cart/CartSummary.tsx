'use client';

interface CartSummaryProps {
  readonly subtotalEur: number;
  readonly deliveryFeeEur?: number | null;
}

/**
 * Displays the cart subtotal, delivery fee, and estimated total in EUR.
 */
export default function CartSummary({ subtotalEur, deliveryFeeEur }: CartSummaryProps) {
  const hasFee = deliveryFeeEur != null;
  const total = hasFee ? (subtotalEur + deliveryFeeEur).toFixed(2) : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      {/* Subtotal */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Subtotal</span>
        <span className="text-lg font-bold text-gray-900">
          {subtotalEur.toFixed(2)} €
        </span>
      </div>

      {/* Delivery fee */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Envío</span>
        <span className="text-sm text-gray-700">
          {hasFee ? `${deliveryFeeEur.toFixed(2)} €` : 'Consultar en checkout'}
        </span>
      </div>

      {/* Estimated total */}
      {hasFee && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-sm font-semibold text-gray-900">Total estimado</span>
          <span className="text-lg font-bold text-gray-900">
            {total} €
          </span>
        </div>
      )}
    </div>
  );
}
