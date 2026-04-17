'use client';
import { useCart } from '@/contexts/cart-context';

export default function CartBadge() {
  const { itemCount, isLoading } = useCart();
  if (isLoading || itemCount === 0) return null;
  return (
    <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-green-600 px-1.5 text-xs font-bold text-white">
      {itemCount}
    </span>
  );
}
