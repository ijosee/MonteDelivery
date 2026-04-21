import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUserWithRole } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/rbac';
import { logAudit } from '@/lib/services/audit.service';
import type { UserRole, Database } from '@/types/database';

/**
 * GET /api/admin/restaurants — List all restaurants with stats.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }
    requirePermission(authUser.role as UserRole, 'restaurants:list');

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;

    const supabase = await createClient();

    const { data: restaurants, count, error } = await supabase
      .from('restaurants')
      .select('id, name, slug, cuisineType, isActive, deliveryFeeEur, minOrderEur, createdAt', { count: 'exact' })
      .order('name', { ascending: true })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error('Error fetching restaurants:', error);
      return NextResponse.json({ data: null, error: 'Error interno del servidor', success: false }, { status: 500 });
    }

    const total = count ?? 0;

    // Get order counts per restaurant
    const restaurantIds = (restaurants ?? []).map((r) => r.id);
    const orderCounts: Record<string, number> = {};

    if (restaurantIds.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('restaurantId')
        .in('restaurantId', restaurantIds);

      if (orders) {
        for (const o of orders) {
          orderCounts[o.restaurantId] = (orderCounts[o.restaurantId] ?? 0) + 1;
        }
      }
    }

    return NextResponse.json({
      data: {
        restaurants: (restaurants ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          cuisineType: r.cuisineType,
          isActive: r.isActive,
          deliveryFeeEur: Number(r.deliveryFeeEur),
          minOrderEur: Number(r.minOrderEur),
          orderCount: orderCounts[r.id] ?? 0,
          createdAt: r.createdAt,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}

/**
 * POST /api/admin/restaurants — Create a restaurant.
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }
    requirePermission(authUser.role as UserRole, 'restaurants:create');

    const body = await request.json();
    const { name, slug, description, cuisineType, deliveryFeeEur, minOrderEur, deliveryRadiusKm, lat, lng } = body;

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ data: null, error: 'Nombre y slug son obligatorios', success: false }, { status: 422 });
    }

    const supabase = await createClient();

    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        description: description || null,
        cuisineType: cuisineType || null,
        deliveryFeeEur: deliveryFeeEur ?? 0,
        minOrderEur: minOrderEur ?? 0,
        deliveryRadiusKm: deliveryRadiusKm ?? 5,
        lat: lat ?? 0,
        lng: lng ?? 0,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating restaurant:', error);
      return NextResponse.json({ data: null, error: 'Error al crear restaurante', success: false }, { status: 500 });
    }

    logAudit({
      userId: authUser.id,
      action: 'RESTAURANT_CREATED',
      resourceType: 'restaurant',
      resourceId: restaurant.id,
      details: { name: restaurant.name },
    }).catch(() => {});

    return NextResponse.json({
      data: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug },
      error: null,
      success: true,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}

/**
 * PATCH /api/admin/restaurants — Update a restaurant (pass id in body).
 */
export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }
    requirePermission(authUser.role as UserRole, 'restaurants:edit');

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ data: null, error: 'ID es obligatorio', success: false }, { status: 422 });
    }

    const data: Database['public']['Tables']['restaurants']['Update'] = {};
    if (typeof updates.name === 'string') data.name = updates.name.trim();
    if (typeof updates.description === 'string') data.description = updates.description;
    if (typeof updates.cuisineType === 'string') data.cuisineType = updates.cuisineType;
    if (typeof updates.isActive === 'boolean') data.isActive = updates.isActive;
    if (typeof updates.deliveryFeeEur === 'number') data.deliveryFeeEur = updates.deliveryFeeEur;
    if (typeof updates.minOrderEur === 'number') data.minOrderEur = updates.minOrderEur;
    data.updatedAt = new Date().toISOString();

    const supabase = await createClient();

    const { data: updated, error } = await supabase
      .from('restaurants')
      .update(data)
      .eq('id', id)
      .select('id, name, isActive')
      .single();

    if (error) {
      console.error('Error updating restaurant:', error);
      return NextResponse.json({ data: null, error: 'Error al actualizar restaurante', success: false }, { status: 500 });
    }

    logAudit({
      userId: authUser.id,
      action: updates.isActive !== undefined ? 'RESTAURANT_TOGGLED' : 'RESTAURANT_UPDATED',
      resourceType: 'restaurant',
      resourceId: id,
      details: data,
    }).catch(() => {});

    return NextResponse.json({
      data: { id: updated.id, name: updated.name, isActive: updated.isActive },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}
