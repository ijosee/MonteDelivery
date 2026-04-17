'use client';

import { useState, useCallback, useRef } from 'react';
import ProductCard from '@/components/product/ProductCard';
import { Dialog } from '@/components/ui';
import { useCart } from '@/contexts/cart-context';

interface ProductAllergen {
  id: number;
  code: string;
  nameEs: string;
  icon: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  priceEur: number;
  imageUrl: string;
  allergens: ProductAllergen[];
}

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  products: Product[];
}

interface CategoryTabsProps {
  readonly categories: Category[];
}

export default function CategoryTabs({ categories }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? '');
  const [conflictOpen, setConflictOpen] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const { addItem, clearAndAdd, cart } = useCart();

  // Ref to track the success feedback timeout so we can clean it up
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAdd = useCallback(
    async (productId: string) => {
      const result = await addItem(productId);

      if (result.success) {
        // Clear any existing feedback timer
        if (feedbackTimerRef.current) {
          clearTimeout(feedbackTimerRef.current);
        }
        setAddedProductId(productId);
        feedbackTimerRef.current = setTimeout(() => {
          setAddedProductId(null);
          feedbackTimerRef.current = null;
        }, 1500);
      } else if (result.conflict) {
        setPendingProductId(productId);
        setConflictOpen(true);
      }
    },
    [addItem]
  );

  const handleConfirmConflict = useCallback(async () => {
    if (!pendingProductId) return;

    const result = await clearAndAdd(pendingProductId);
    setConflictOpen(false);
    setPendingProductId(null);

    if (result?.success) {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
      setAddedProductId(pendingProductId);
      feedbackTimerRef.current = setTimeout(() => {
        setAddedProductId(null);
        feedbackTimerRef.current = null;
      }, 1500);
    }
  }, [pendingProductId, clearAndAdd]);

  const handleCloseConflict = useCallback(() => {
    setConflictOpen(false);
    setPendingProductId(null);
  }, []);

  const currentCategory = categories.find((c) => c.id === activeCategory);

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex gap-1" aria-label="Categorías">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors sm:text-base ${
                activeCategory === cat.id
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {cat.name}
              {cat.products.length > 0 && (
                <span className="ml-1.5 text-xs text-gray-400">
                  ({cat.products.length})
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Products grid */}
      <div className="mt-4">
        {currentCategory && currentCategory.products.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {currentCategory.products.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={handleAdd} isAdded={addedProductId === product.id} cartQuantity={cart.items.find(i => i.productId === product.id)?.quantity ?? 0} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">
            No hay productos disponibles en esta categoría.
          </p>
        )}
      </div>

      {/* Restaurant conflict dialog */}
      <Dialog
        open={conflictOpen}
        onClose={handleCloseConflict}
        title="¿Cambiar de restaurante?"
      >
        <p className="text-sm text-gray-600">
          Tu carrito contiene productos de otro restaurante. Si continúas, se
          vaciará el carrito actual y se añadirá el nuevo producto.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCloseConflict}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmConflict}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            Cambiar restaurante
          </button>
        </div>
      </Dialog>
    </div>
  );
}
