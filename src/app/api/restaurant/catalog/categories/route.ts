import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/restaurant/catalog/categories — Create a category.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }

    requirePermission(session.user.role as UserRole, 'categories:crud');

    const ru = await prisma.restaurantUser.findFirst({
      where: { userId: session.user.id },
      select: { restaurantId: true },
    });

    if (!ru) {
      return NextResponse.json({ data: null, error: 'No tienes un restaurante asociado', success: false }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const sortOrder = typeof body.sortOrder === 'number' ? body.sortOrder : 0;

    if (!name) {
      return NextResponse.json({ data: null, error: 'El nombre es obligatorio', success: false }, { status: 422 });
    }

    const category = await prisma.category.create({
      data: { restaurantId: ru.restaurantId, name, sortOrder },
    });

    return NextResponse.json({
      data: { id: category.id, name: category.name, sortOrder: category.sortOrder },
      error: null,
      success: true,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear categoría';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}
