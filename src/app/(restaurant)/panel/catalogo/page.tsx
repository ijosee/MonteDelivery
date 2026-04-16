'use client';

import { useState, useEffect, useCallback } from 'react';
import { EU_ALLERGENS } from '@/lib/domain/allergens';

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  priceEur: number;
  imageUrl: string;
  isAvailable: boolean;
  allergenIds: number[];
}

export default function CatalogManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categorySortOrder, setCategorySortOrder] = useState(0);

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productCategoryId, setProductCategoryId] = useState('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImageUrl, setProductImageUrl] = useState('');
  const [productAllergenIds, setProductAllergenIds] = useState<number[]>([]);
  const [productIsAvailable, setProductIsAvailable] = useState(true);

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/restaurant/catalog');
      const json = await res.json();
      if (json.success && json.data) {
        setCategories(json.data);
      }
    } catch {
      setError('Error al cargar el catálogo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // ─── Category CRUD ─────────────────────────────────────────

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      setError('El nombre de la categoría es obligatorio');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const method = editingCategoryId ? 'PATCH' : 'POST';
      const url = editingCategoryId
        ? `/api/restaurant/catalog/categories/${editingCategoryId}`
        : '/api/restaurant/catalog/categories';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName.trim(), sortOrder: categorySortOrder }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchCatalog();
        resetCategoryForm();
      } else {
        setError(json.error ?? 'Error al guardar categoría');
      }
    } catch {
      setError('Error al guardar categoría');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría y todos sus productos?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/restaurant/catalog/categories/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) await fetchCatalog();
      else setError(json.error ?? 'Error al eliminar');
    } catch {
      setError('Error al eliminar categoría');
    } finally {
      setActionLoading(false);
    }
  };

  const resetCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategoryId(null);
    setCategoryName('');
    setCategorySortOrder(0);
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCategoryName(cat.name);
    setCategorySortOrder(cat.sortOrder);
    setShowCategoryForm(true);
  };

  // ─── Product CRUD ──────────────────────────────────────────

  const handleSaveProduct = async () => {
    if (!productName.trim()) { setError('El nombre del producto es obligatorio'); return; }
    if (!productPrice || parseFloat(productPrice) <= 0) { setError('El precio debe ser mayor que 0'); return; }
    if (!editingProductId && !productImageFile) { setError('La imagen del producto es obligatoria.'); return; }
    if (!productCategoryId) { setError('Selecciona una categoría'); return; }

    setActionLoading(true);
    setError(null);

    try {
      let imageUrl = productImageUrl;

      // Upload image if new file selected
      if (productImageFile) {
        const formData = new FormData();
        formData.append('file', productImageFile);
        const uploadRes = await fetch('/api/restaurant/catalog/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadJson = await uploadRes.json();
        if (uploadJson.success && uploadJson.data?.url) {
          imageUrl = uploadJson.data.url;
        } else {
          setError(uploadJson.error ?? 'Error al subir imagen');
          setActionLoading(false);
          return;
        }
      }

      const method = editingProductId ? 'PATCH' : 'POST';
      const url = editingProductId
        ? `/api/restaurant/catalog/products/${editingProductId}`
        : '/api/restaurant/catalog/products';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: productCategoryId,
          name: productName.trim(),
          description: productDescription.trim() || null,
          priceEur: parseFloat(productPrice),
          imageUrl,
          allergenIds: productAllergenIds,
          isAvailable: productIsAvailable,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchCatalog();
        resetProductForm();
      } else {
        setError(json.error ?? 'Error al guardar producto');
      }
    } catch {
      setError('Error al guardar producto');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/restaurant/catalog/products/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) await fetchCatalog();
      else setError(json.error ?? 'Error al eliminar');
    } catch {
      setError('Error al eliminar producto');
    } finally {
      setActionLoading(false);
    }
  };

  const resetProductForm = () => {
    setShowProductForm(false);
    setEditingProductId(null);
    setProductCategoryId('');
    setProductName('');
    setProductDescription('');
    setProductPrice('');
    setProductImageFile(null);
    setProductImageUrl('');
    setProductAllergenIds([]);
    setProductIsAvailable(true);
  };

  const startEditProduct = (product: Product, categoryId: string) => {
    setEditingProductId(product.id);
    setProductCategoryId(categoryId);
    setProductName(product.name);
    setProductDescription(product.description ?? '');
    setProductPrice(product.priceEur.toString());
    setProductImageUrl(product.imageUrl);
    setProductAllergenIds(product.allergenIds);
    setProductIsAvailable(product.isAvailable);
    setShowProductForm(true);
  };

  const toggleAllergen = (id: number) => {
    setProductAllergenIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de catálogo</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { resetCategoryForm(); setShowCategoryForm(true); }}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Categoría
            </button>
            <button
              type="button"
              onClick={() => { resetProductForm(); setShowProductForm(true); }}
              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              + Producto
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button type="button" onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
          </div>
        )}

        {/* Category Form */}
        {showCategoryForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">
              {editingCategoryId ? 'Editar categoría' : 'Nueva categoría'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="catName" className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input id="catName" type="text" value={categoryName} onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej: Entrantes" />
              </div>
              <div>
                <label htmlFor="catOrder" className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                <input id="catOrder" type="number" value={categorySortOrder} onChange={(e) => setCategorySortOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleSaveCategory} disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {actionLoading ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={resetCategoryForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Product Form */}
        {showProductForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">
              {editingProductId ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <div className="space-y-3 mb-3">
              <div>
                <label htmlFor="prodCat" className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select id="prodCat" value={productCategoryId} onChange={(e) => setProductCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Selecciona categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prodName" className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input id="prodName" type="text" value={productName} onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label htmlFor="prodPrice" className="block text-sm font-medium text-gray-700 mb-1">Precio (€) *</label>
                  <input id="prodPrice" type="number" step="0.01" min="0.01" value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="prodDesc" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea id="prodDesc" value={productDescription} onChange={(e) => setProductDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} />
              </div>
              <div>
                <label htmlFor="prodImage" className="block text-sm font-medium text-gray-700 mb-1">
                  Imagen {editingProductId ? '(dejar vacío para mantener)' : '*'}
                </label>
                <input id="prodImage" type="file" accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setProductImageFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Alérgenos</p>
                <div className="flex flex-wrap gap-2">
                  {EU_ALLERGENS.map((a) => (
                    <button key={a.id} type="button" onClick={() => toggleAllergen(a.id)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
                        productAllergenIds.includes(a.id)
                          ? 'bg-orange-100 border-orange-400 text-orange-800'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {a.nameEs}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={productIsAvailable}
                  onChange={(e) => setProductIsAvailable(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-green-600" />
                <span className="text-sm text-gray-700">Disponible</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleSaveProduct} disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {actionLoading ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={resetProductForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Categories and Products */}
        {categories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay categorías. Crea una para empezar.</p>
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEditCategory(cat)}
                      className="text-xs text-blue-600 hover:underline">Editar</button>
                    <button type="button" onClick={() => handleDeleteCategory(cat.id)}
                      className="text-xs text-red-600 hover:underline">Eliminar</button>
                  </div>
                </div>
                {cat.products.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">Sin productos en esta categoría</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {cat.products.map((prod) => (
                      <div key={prod.id} className="flex items-center gap-3 p-3">
                        <div className="w-12 h-12 rounded bg-gray-200 overflow-hidden shrink-0">
                          {prod.imageUrl && (
                            <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${prod.isAvailable ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                            {prod.name}
                          </p>
                          <p className="text-xs text-gray-500">{prod.priceEur.toFixed(2)} €</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button type="button" onClick={() => startEditProduct(prod, cat.id)}
                            className="text-xs text-blue-600 hover:underline">Editar</button>
                          <button type="button" onClick={() => handleDeleteProduct(prod.id)}
                            className="text-xs text-red-600 hover:underline">Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
