'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';

export default function CarritoPage() {
  const { cart, isLoading, itemCount, updateItem, removeItem, clearCart } = useCart();
  const [showClearDialog, setShowClearDialog] = useState(false);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900">Tu carrito</h1>
        <div className="mt-6 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </main>
    );
  }

  // Empty state
  if (itemCount === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900">Tu carrito</h1>
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <span className="text-5xl" aria-hidden="true">🛒</span>
          <p className="text-gray-500">
            Tu carrito está vacío. ¡Explora los restaurantes!
          </p>
          <Link
            href="/"
            className="mt-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Ver restaurantes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tu carrito</h1>
        <button
          type="button"
          onClick={() => setShowClearDialog(true)}
          className="text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          Vaciar carrito
        </button>
      </div>

      {/* Restaurant name */}
      {cart.restaurantName && (
        <p className="mt-1 text-sm text-gray-500">
          Pedido de <span className="font-medium text-gray-700">{cart.restaurantName}</span>
        </p>
      )}

      {/* Cart items */}
      <div className="mt-6 flex flex-col gap-3">
        {cart.items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onUpdateQuantity={(itemId, quantity) =>
              updateItem(itemId, { quantity })
            }
            onRemove={removeItem}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6">
        <CartSummary subtotalEur={cart.subtotalEur} />
      </div>

      {/* Checkout button */}
      <div className="mt-6">
        <Link
          href="/checkout"
          className="block w-full rounded-md bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Ir al checkout
        </Link>
      </div>

      {/* Clear cart confirmation dialog */}
      {showClearDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <dialog
            open
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
            aria-labelledby="clear-cart-title"
          >
            <h2 id="clear-cart-title" className="text-lg font-semibold text-gray-900">
              ¿Vaciar carrito?
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Se eliminarán todos los productos de tu carrito. Esta acción no se puede deshacer.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearDialog(false)}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setShowClearDialog(false);
                }}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Vaciar y eliminar
              </button>
            </div>
          </dialog>
        </div>
      )}
    </main>
  );
}
