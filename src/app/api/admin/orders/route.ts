import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUserWithRole } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole, OrderStatus, FulfillmentType } from '@/types/database';

/**
 * GET /api/admin/orders — All orders with filters.
 * Query: restaurantId, status, fulfillmentType, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }
    requirePermission(authUser.role as UserRole, 'orders:read_own');

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status');
    const fulfillmentType = searchParams.get('fulfillmentType');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;

    const supabase = await createClient();

    let query = supabase
      .from('orders')
      .select('id, orderNumber, userId, restaurantId, currentStatus, fulfillmentType, totalEur, createdAt, users(name, email), restaurants(name)', { count: 'exact' });

    if (restaurantId) query = query.eq('restaurantId', restaurantId);
    if (status) query = query.eq('currentStatus', status as OrderStatus);
    if (fulfillmentType) query = query.eq('fulfillmentType', fulfillmentType as FulfillmentType);

    const { data: orders, count, error } = await query
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ data: null, error: 'Error interno del servidor', success: false }, { status: 500 });
    }

    const total = count ?? 0;

    return NextResponse.json({
      data: {
        orders: (orders ?? []).map((o: Record<string, unknown>) => {
          const user = o.users as { name: string; email: string } | null;
          const restaurant = o.restaurants as { name: string } | null;
          return {
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: user?.name ?? '',
            customerEmail: user?.email ?? '',
            restaurantName: restaurant?.name ?? '',
            status: o.currentStatus,
            fulfillmentType: o.fulfillmentType,
            totalEur: Number(o.totalEur),
            createdAt: o.createdAt,
          };
        }),
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
