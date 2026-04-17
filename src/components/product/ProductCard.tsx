import Image from 'next/image';
import AllergenBadge from './AllergenBadge';

interface ProductAllergen {
  id: number;
  code: string;
  nameEs: string;
  icon: string;
}

interface ProductCardProps {
  readonly product: {
    id: string;
    name: string;
    description: string | null;
    priceEur: number;
    imageUrl: string;
    allergens: ProductAllergen[];
  };
  onAdd?: (productId: string) => void;
  isAdded?: boolean;
  cartQuantity?: number;
}

function isPlaceholder(url: string): boolean {
  return url.startsWith('/placeholder');
}

export default function ProductCard({ product, onAdd, isAdded, cartQuantity }: ProductCardProps) {
  const showImage = !isPlaceholder(product.imageUrl);

  return (
    <div className="group flex gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md sm:gap-4 sm:p-4">
      {/* Product image */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-28 sm:w-28">
        {showImage ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="112px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <h3 className="text-sm font-bold text-gray-900 sm:text-base truncate">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 sm:text-sm">
              {product.description}
            </p>
          )}

          {/* Allergens */}
          {product.allergens.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {product.allergens.map((allergen) => (
                <AllergenBadge
                  key={allergen.id}
                  code={allergen.code}
                  nameEs={allergen.nameEs}
                  icon={allergen.icon}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-bold text-green-600 sm:text-base">
            {product.priceEur.toFixed(2)} €
          </span>
          {onAdd && (
            <div className="flex items-center gap-1.5">
              {(cartQuantity ?? 0) >= 1 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-green-100 px-1 text-xs font-bold text-green-700">
                  {cartQuantity}
                </span>
              )}
              <button
                type="button"
                onClick={() => onAdd(product.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:text-sm ${
                  isAdded
                    ? 'bg-green-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isAdded ? '✓ Añadido' : 'Añadir'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
