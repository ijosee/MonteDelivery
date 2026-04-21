import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUserWithRole } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/rbac';
import { logAudit } from '@/lib/services/audit.service';
import type { UserRole, Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    requirePermission(authUser.role as UserRole, 'categories:crud');

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    const supabase = await createClient();

    let query = supabase
      .from('categories')
      .select('id, name, sortOrder, restaurantId, restaurants(name)');

    if (restaurantId) {
      query = query.eq('restaurantId', restaurantId);
    }

    const { data: categories, error } = await query
      .order('sortOrder', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ data: null, error: 'Error interno del servidor', success: false }, { status: 500 });
    }

    return NextResponse.json({
      data: (categories ?? []).map((c: Record<string, unknown>) => {
        const restaurant = c.restaurants as { name: string } | null;
        return {
          id: c.id,
          name: c.name,
          sortOrder: c.sortOrder,
          restaurantId: c.restaurantId,
          restaurantName: restaurant?.name ?? '',
        };
      }),
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
    requirePermission(authUser.role as UserRole, 'categories:crud');

    const body = await request.json();
    if (!body.restaurantId || !body.name?.trim()) {
      return NextResponse.json({ data: null, error: 'restaurantId y name son obligatorios', success: false }, { status: 422 });
    }

    const supabase = await createClient();

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        restaurantId: body.restaurantId,
        name: body.name.trim(),
        sortOrder: body.sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return NextResponse.json({ data: null, error: 'Error al crear categoría', success: false }, { status: 500 });
    }

    logAudit({ userId: authUser.id, action: 'CATEGORY_CREATED', resourceType: 'category', resourceId: category.id }).catch(() => {});

    return NextResponse.json({ data: { id: category.id, name: category.name }, error: null, success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ data: null, error: message, success: false }, { status: message.includes('permisos') ? 403 : 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    requirePermission(authUser.role as UserRole, 'categories:crud');

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ data: null, error: 'ID es obligatorio', success: false }, { status: 422 });
    }

    const data: Database['public']['Tables']['categories']['Update'] = {};
    if (typeof updates.name === 'string') data.name = updates.name.trim();
    if (typeof updates.sortOrder === 'number') data.sortOrder = updates.sortOrder;

    const supabase = await createClient();

    const { data: updated, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select('id, name, sortOrder')
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return NextResponse.json({ data: null, error: 'Error al actualizar categoría', success: false }, { status: 500 });
    }

    logAudit({ userId: authUser.id, action: 'CATEGORY_UPDATED', resourceType: 'category', resourceId: id }).catch(() => {});

    return NextResponse.json({ data: { id: updated.id, name: updated.name, sortOrder: updated.sortOrder }, error: null, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ data: null, error: message, success: false }, { status: message.includes('permisos') ? 403 : 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    requirePermission(authUser.role as UserRole, 'categories:crud');

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ data: null, error: 'ID es obligatorio', success: false }, { status: 422 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json({ data: null, error: 'Error al eliminar categoría', success: false }, { status: 500 });
    }

    logAudit({ userId: authUser.id, action: 'CATEGORY_DELETED', resourceType: 'category', resourceId: id }).catch(() => {});

    return NextResponse.json({ data: null, error: null, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ data: null, error: message, success: false }, { status: message.includes('permisos') ? 403 : 500 });
  }
}
