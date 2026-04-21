import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUserWithRole } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/types/database';

/**
 * GET /api/admin/users — List all users.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }
    requirePermission(authUser.role as UserRole, 'users:manage');

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;
    const role = searchParams.get('role');

    const supabase = await createClient();

    let query = supabase
      .from('users')
      .select('id, name, email, role, emailVerified, createdAt', { count: 'exact' });

    if (role) {
      query = query.eq('role', role as UserRole);
    }

    const { data: users, count, error } = await query
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ data: null, error: 'Error interno del servidor', success: false }, { status: 500 });
    }

    const total = count ?? 0;

    // Get order counts for each user
    const userIds = (users ?? []).map((u) => u.id);
    const orderCounts: Record<string, number> = {};

    if (userIds.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('userId')
        .in('userId', userIds);

      if (orders) {
        for (const o of orders) {
          orderCounts[o.userId] = (orderCounts[o.userId] ?? 0) + 1;
        }
      }
    }

    return NextResponse.json({
      data: {
        users: (users ?? []).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          emailVerified: !!u.emailVerified,
          orderCount: orderCounts[u.id] ?? 0,
          createdAt: u.createdAt,
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
