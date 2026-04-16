'use client';

import Link from 'next/link';

interface FABCartProps {
  readonly itemCount: number;
  readonly subtotalEur: number;
}

/**
 * Floating Action Button for the cart.
 * Visible on mobile when the cart has items.
 * Shows item count and subtotal, links to /carrito.
 */
export default function FABCart({ itemCount, subtotalEur }: FABCartProps) {
  if (itemCount === 0) return null;

  return (
    <Link
      href="/carrito"
      className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700 active:scale-95 sm:bottom-6 md:hidden"
      aria-label={`Ver carrito: ${itemCount} artículo${itemCount === 1 ? '' : 's'}, ${subtotalEur.toFixed(2)} €`}
    >
      <span className="text-lg" aria-hidden="true">🛒</span>
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
          {itemCount}
        </span>
        <span>{subtotalEur.toFixed(2)} €</span>
      </span>
    </Link>
  );
}
