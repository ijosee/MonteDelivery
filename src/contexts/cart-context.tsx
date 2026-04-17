'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { CartDTO } from '@/types';

const EMPTY_CART: CartDTO = {
  id: '',
  restaurantId: null,
  restaurantName: null,
  deliveryFeeEur: null,
  items: [],
  subtotalEur: 0,
};

interface AddItemResult {
  success: boolean;
  conflict: boolean;
  message: string | null;
}

interface CartContextValue {
  cart: CartDTO;
  isLoading: boolean;
  error: string | null;
  itemCount: number;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number, notes?: string | null) => Promise<AddItemResult>;
  updateItem: (itemId: string, data: { quantity?: number; notes?: string | null }) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  clearAndAdd: (productId: string, quantity?: number, notes?: string | null) => Promise<AddItemResult | undefined>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { readonly children: ReactNode }) {
  const [cart, setCart] = useState<CartDTO>(EMPTY_CART);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/cart');
      const json = await res.json();
      if (json.success && json.data) {
        setCart(json.data);
      } else {
        setCart(EMPTY_CART);
      }
    } catch {
      setError('Error al cargar el carrito');
      setCart(EMPTY_CART);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(
    async (productId: string, quantity: number = 1, notes?: string | null): Promise<AddItemResult> => {
      try {
        setError(null);
        const res = await fetch('/api/cart/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity, notes: notes ?? null }),
        });
        const json = await res.json();

        if (res.status === 409) {
          return { success: false, conflict: true, message: json.error as string };
        }

        if (json.success && json.data) {
          setCart(json.data);
          return { success: true, conflict: false, message: null };
        }

        setError(json.error ?? 'Error al añadir producto');
        return { success: false, conflict: false, message: json.error as string };
      } catch {
        setError('Error al añadir producto');
        return { success: false, conflict: false, message: 'Error al añadir producto' };
      }
    },
    []
  );

  const updateItem = useCallback(
    async (itemId: string, data: { quantity?: number; notes?: string | null }) => {
      try {
        setError(null);
        const res = await fetch(`/api/cart/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setCart(json.data);
        } else {
          setError(json.error ?? 'Error al actualizar ítem');
        }
      } catch {
        setError('Error al actualizar ítem');
      }
    },
    []
  );

  const removeItem = useCallback(async (itemId: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCart(json.data);
      } else {
        setError(json.error ?? 'Error al eliminar ítem');
      }
    } catch {
      setError('Error al eliminar ítem');
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/cart', { method: 'DELETE' });
      const json = await res.json();
      if (json.success && json.data) {
        setCart(json.data);
      } else {
        setCart(EMPTY_CART);
      }
    } catch {
      setError('Error al vaciar el carrito');
    }
  }, []);

  const clearAndAdd = useCallback(
    async (productId: string, quantity: number = 1, notes?: string | null) => {
      await clearCart();
      return addItem(productId, quantity, notes);
    },
    [clearCart, addItem]
  );

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo<CartContextValue>(() => ({
    cart,
    isLoading,
    error,
    itemCount,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    clearAndAdd,
  }), [cart, isLoading, error, itemCount, fetchCart, addItem, updateItem, removeItem, clearCart, clearAndAdd]);

  return (
    <CartContext value={value}>
      {children}
    </CartContext>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
