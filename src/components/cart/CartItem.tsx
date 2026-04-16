'use client';

import type { CartItemDTO } from '@/types';

interface CartItemProps {
  readonly item: CartItemDTO;
  readonly onUpdateQuantity: (itemId: string, quantity: number) => void;
  readonly onRemove: (itemId: string) => void;
}

/**
 * A single cart item row with name, quantity controls, price, notes, and delete button.
 */
export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const lineTotal = item.priceEur * item.quantity;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 truncate">
          {item.productName}
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">
          {item.priceEur.toFixed(2)} € / ud.
        </p>
        {item.notes && (
          <p className="mt-1 text-xs text-gray-400 italic truncate">
            📝 {item.notes}
          </p>
        )}
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            if (item.quantity <= 1) {
              onRemove(item.id);
            } else {
              onUpdateQuantity(item.id, item.quantity - 1);
            }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label={item.quantity <= 1 ? `Eliminar ${item.productName}` : `Reducir cantidad de ${item.productName}`}
        >
          {item.quantity <= 1 ? '🗑️' : '−'}
        </button>
        <span className="w-6 text-center text-sm font-medium text-gray-900">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label={`Aumentar cantidad de ${item.productName}`}
        >
          +
        </button>
      </div>

      {/* Line total + delete */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
          {lineTotal.toFixed(2)} €
        </span>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="text-xs text-red-500 hover:text-red-700 transition-colors"
          aria-label={`Eliminar ${item.productName} del carrito`}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
