import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/metrics — Dashboard metrics.
 * Returns: orders today/week/month, by status, revenue EUR, active restaurants.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }
    requirePermission(session.user.role as UserRole, 'metrics:read_all');

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      ordersToday,
      ordersWeek,
      ordersMonth,
      ordersByStatus,
      revenueToday,
      revenueWeek,
      revenueMonth,
      activeRestaurants,
      totalUsers,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.groupBy({
        by: ['currentStatus'],
        _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: startOfDay }, currentStatus: { notIn: ['CANCELLED', 'REJECTED'] } },
        _sum: { totalEur: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: startOfWeek }, currentStatus: { notIn: ['CANCELLED', 'REJECTED'] } },
        _sum: { totalEur: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: startOfMonth }, currentStatus: { notIn: ['CANCELLED', 'REJECTED'] } },
        _sum: { totalEur: true },
      }),
      prisma.restaurant.count({ where: { isActive: true } }),
      prisma.user.count(),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const s of ordersByStatus) {
      statusCounts[s.currentStatus] = s._count.id;
    }

    return NextResponse.json({
      data: {
        orders: {
          today: ordersToday,
          week: ordersWeek,
          month: ordersMonth,
          byStatus: statusCounts,
        },
        revenue: {
          todayEur: Number(revenueToday._sum.totalEur ?? 0),
          weekEur: Number(revenueWeek._sum.totalEur ?? 0),
          monthEur: Number(revenueMonth._sum.totalEur ?? 0),
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
