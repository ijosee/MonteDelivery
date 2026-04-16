'use client';

interface CartSummaryProps {
  readonly subtotalEur: number;
}

/**
 * Displays the cart subtotal in EUR.
 */
export default function CartSummary({ subtotalEur }: CartSummaryProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Subtotal</span>
        <span className="text-lg font-bold text-gray-900">
          {subtotalEur.toFixed(2)} €
        </span>
      </div>
    </div>
  );
}
