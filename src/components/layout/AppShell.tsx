'use client';

import Header from './Header';
import BottomNav from './BottomNav';
import FABCart from '@/components/cart/FABCart';
import { useCart } from '@/hooks/use-cart';
import type { ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
}

/**
 * AppShell — Wraps pages with Header, BottomNav, and FABCart.
 * Provides the main layout structure for public and customer pages.
 */
export default function AppShell({ children }: Props) {
  const { itemCount, cart } = useCart();

  return (
    <>
      <Header />
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <BottomNav />
      <FABCart itemCount={itemCount} subtotalEur={cart.subtotalEur} />
    </>
  );
}
