import AllergenBadge from './AllergenBadge';

interface ProductAllergen {
  id: number;
  code: string;
  nameEs: string;
  icon: string;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    priceEur: number;
    imageUrl: string;
    allergens: ProductAllergen[];
  };
  onAdd?: (productId: string) => void;
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <div className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:gap-4">
      {/* Product image */}
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 sm:h-28 sm:w-28">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 sm:text-base truncate">
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
          <span className="text-sm font-bold text-gray-900 sm:text-base">
            {product.priceEur.toFixed(2)} €
          </span>
          {onAdd && (
            <button
              type="button"
              onClick={() => onAdd(product.id)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors sm:text-sm"
            >
              Añadir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
