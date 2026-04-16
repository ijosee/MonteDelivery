import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { logAudit } from '@/lib/services/audit.service';
import type { UserRole } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    requirePermission(session.user.role as UserRole, 'categories:crud');

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    const where: Record<string, unknown> = {};
    if (restaurantId) where.restaurantId = restaurantId;

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { restaurant: { select: { name: true } } },
    });

    return NextResponse.json({
      data: categories.map((c) => ({
        id: c.id, name: c.name, sortOrder: c.sortOrder,
        restaurantId: c.restaurantId, restaurantName: c.restaurant.name,
      })),
      error: null, success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ data: null, error: message, success: false }, { status: message.includes('permisos') ? 403 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    requirePermission(session.user.role as UserRole, 'categories:crud');

    const body = await request.json();
    if (!body.restaurantId || !body.name?.trim()) {
      return NextResponse.json({ data: null, error: 'restaurantId y name son obligatorios', success: false }, { status: 422 });
    }

    const category = await prisma.category.create({
      data: { restaurantId: body.restaurantId, name: body.name.trim(), sortOrder: body.sortOrder ?? 0 },
    });

    logAudit({ userId: session.user.id, action: 'CATEGORY_CREATED', resourceType: 'category', resourceId: category.id }).catch(() => {});

    return NextResponse.json({ data: { id: category.id, name: category.name }, error: null, success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ data: null, error: message, success: false }, { status: message.includes('permisos') ? 403 : 500 });
  }
}
