import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { logAudit } from '@/lib/services/audit.service';
import type { UserRole } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/restaurants — List all restaurants with stats.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }
    requirePermission(session.user.role as UserRole, 'restaurants:list');

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          _count: { select: { orders: true } },
        },
      }),
      prisma.restaurant.count(),
    ]);

    return NextResponse.json({
      data: {
        restaurants: restaurants.map((r: typeof restaurants[number]) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          cuisineType: r.cuisineType,
          isActive: r.isActive,
          deliveryFeeEur: Number(r.deliveryFeeEur),
          minOrderEur: Number(r.minOrderEur),
          orderCount: r._count.orders,
          createdAt: r.createdAt.toISOString(),
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }
    requirePermission(session.user.role as UserRole, 'restaurants:create');

    const body = await request.json();
    const { name, slug, description, cuisineType, deliveryFeeEur, minOrderEur, deliveryRadiusKm, lat, lng } = body;

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ data: null, error: 'Nombre y slug son obligatorios', success: false }, { status: 422 });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        description: description || null,
        cuisineType: cuisineType || null,
        deliveryFeeEur: deliveryFeeEur ?? 0,
        minOrderEur: minOrderEur ?? 0,
        deliveryRadiusKm: deliveryRadiusKm ?? 5,
        lat: lat ?? 0,
        lng: lng ?? 0,
      },
    });

    logAudit({
      userId: session.user.id,
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }
    requirePermission(session.user.role as UserRole, 'restaurants:edit');

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ data: null, error: 'ID es obligatorio', success: false }, { status: 422 });
    }

    const data: Record<string, unknown> = {};
    if (typeof updates.name === 'string') data.name = updates.name.trim();
    if (typeof updates.description === 'string') data.description = updates.description;
    if (typeof updates.cuisineType === 'string') data.cuisineType = updates.cuisineType;
    if (typeof updates.isActive === 'boolean') data.isActive = updates.isActive;
    if (typeof updates.deliveryFeeEur === 'number') data.deliveryFeeEur = updates.deliveryFeeEur;
    if (typeof updates.minOrderEur === 'number') data.minOrderEur = updates.minOrderEur;

    const updated = await prisma.restaurant.update({ where: { id }, data });

    logAudit({
      userId: session.user.id,
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
