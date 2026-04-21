import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUserWithRole } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/rbac';
import { logAudit } from '@/lib/services/audit.service';
import type { UserRole } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    requirePermission(authUser.role as UserRole, 'products:crud');

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;

    const supabase = await createClient();

    let query = supabase
      .from('products')
      .select('id, name, description, priceEur, imageUrl, isAvailable, categoryId, categories(name, restaurantId, restaurants(name)), product_allergens(allergenId)', { count: 'exact' });

    if (categoryId) {
      query = query.eq('categoryId', categoryId);
    }

    const { data: products, count, error } = await query
      .order('name', { ascending: true })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ data: null, error: 'Error interno del servidor', success: false }, { status: 500 });
    }

    const total = count ?? 0;

    return NextResponse.json({
      data: {
        products: (products ?? []).map((p: Record<string, unknown>) => {
          const category = p.categories as { name: string; restaurantId: string; restaurants: { name: string } } | null;
          const allergens = p.product_allergens as { allergenId: number }[] | null;
          return {
            id: p.id,
            name: p.name,
            description: p.description,
            priceEur: Number(p.priceEur),
            imageUrl: p.imageUrl,
            isAvailable: p.isAvailable,
            categoryName: category?.name ?? '',
            restaurantName: category?.restaurants?.name ?? '',
            allergenIds: (allergens ?? []).map((pa) => pa.allergenId),
          };
        }),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      error: null, success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ data: null, error: message, success: false }, { status: message.includes('permisos') ? 403 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    requirePermission(authUser.role as UserRole, 'products:crud');

    const body = await request.json();
    if (!body.categoryId || !body.name?.trim() || !body.imageUrl) {
      return NextResponse.json({ data: null, error: 'categoryId, name e imageUrl son obligatorios', success: false }, { status: 422 });
    }

    const supabase = await createClient();

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        categoryId: body.categoryId,
        name: body.name.trim(),
        description: body.description || null,
        priceEur: body.priceEur ?? 0,
        imageUrl: body.imageUrl,
        isAvailable: body.isAvailable ?? true,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (productError) {
      console.error('Error creating product:', productError);
      return NextResponse.json({ data: null, error: 'Error al crear producto', success: false }, { status: 500 });
    }

    // Create allergen associations
    if (Array.isArray(body.allergenIds) && body.allergenIds.length > 0) {
      const { error: allergenError } = await supabase
        .from('product_allergens')
        .insert(body.allergenIds.map((aid: number) => ({ productId: product.id, allergenId: aid })));

      if (allergenError) {
        console.error('Error creating product allergens:', allergenError);
      }
    }

    logAudit({ userId: authUser.id, action: 'PRODUCT_CREATED', resourceType: 'product', resourceId: product.id }).catch(() => {});

    return NextResponse.json({ data: { id: product.id, name: product.name }, error: null, success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ data: null, error: message, success: false }, { status: message.includes('permisos') ? 403 : 500 });
  }
}
