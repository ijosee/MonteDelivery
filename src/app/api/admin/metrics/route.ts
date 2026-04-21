import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUserWithRole } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/types/database';

/**
 * GET /api/admin/metrics — Dashboard metrics.
 * Returns: orders today/week/month, by status, revenue EUR, active restaurants.
 */
export async function GET() {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }
    requirePermission(authUser.role as UserRole, 'metrics:read_all');

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const supabase = await createClient();

    // Count orders by time period using head: true for count only
    const [
      ordersTodayRes,
      ordersWeekRes,
      ordersMonthRes,
      activeRestaurantsRes,
      totalUsersRes,
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('createdAt', startOfDay.toISOString()),
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('createdAt', startOfWeek.toISOString()),
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('createdAt', startOfMonth.toISOString()),
      supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('isActive', true),
      supabase.from('users').select('*', { count: 'exact', head: true }),
    ]);

    const ordersToday = ordersTodayRes.count ?? 0;
    const ordersWeek = ordersWeekRes.count ?? 0;
    const ordersMonth = ordersMonthRes.count ?? 0;
    const activeRestaurants = activeRestaurantsRes.count ?? 0;
    const totalUsers = totalUsersRes.count ?? 0;

    // Get orders by status
    const { data: allOrders } = await supabase
      .from('orders')
      .select('currentStatus');

    const statusCounts: Record<string, number> = {};
    if (allOrders) {
      for (const o of allOrders) {
        statusCounts[o.currentStatus] = (statusCounts[o.currentStatus] ?? 0) + 1;
      }
    }

    // Get revenue by time period (exclude CANCELLED and REJECTED)
    const { data: revenueOrdersToday } = await supabase
      .from('orders')
      .select('totalEur')
      .gte('createdAt', startOfDay.toISOString())
      .not('currentStatus', 'in', '(CANCELLED,REJECTED)');

    const { data: revenueOrdersWeek } = await supabase
      .from('orders')
      .select('totalEur')
      .gte('createdAt', startOfWeek.toISOString())
      .not('currentStatus', 'in', '(CANCELLED,REJECTED)');

    const { data: revenueOrdersMonth } = await supabase
      .from('orders')
      .select('totalEur')
      .gte('createdAt', startOfMonth.toISOString())
      .not('currentStatus', 'in', '(CANCELLED,REJECTED)');

    const sumTotal = (orders: { totalEur: number }[] | null) =>
      (orders ?? []).reduce((sum, o) => sum + Number(o.totalEur), 0);

    return NextResponse.json({
      data: {
        orders: {
          today: ordersToday,
          week: ordersWeek,
          month: ordersMonth,
          byStatus: statusCounts,
        },
        revenue: {
          todayEur: sumTotal(revenueOrdersToday),
          weekEur: sumTotal(revenueOrdersWeek),
          monthEur: sumTotal(revenueOrdersMonth),
        },
        activeRestaurants,
        totalUsers,
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
