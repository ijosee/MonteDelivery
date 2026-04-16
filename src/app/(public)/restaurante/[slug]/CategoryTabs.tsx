'use client';

import { useState } from 'react';
import ProductCard from '@/components/product/ProductCard';

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
  categories: Category[];
}

export default function CategoryTabs({ categories }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? '');

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
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">
            No hay productos disponibles en esta categoría.
          </p>
        )}
      </div>
    </div>
  );
}
