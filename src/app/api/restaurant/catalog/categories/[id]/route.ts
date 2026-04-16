import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/restaurant/catalog/categories/[id] — Update a category.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }

    requirePermission(session.user.role as UserRole, 'categories:crud');

    const { id } = await params;
    const body = await request.json();

    const ru = await prisma.restaurantUser.findFirst({
      where: { userId: session.user.id },
      select: { restaurantId: true },
    });

    if (!ru) {
      return NextResponse.json({ data: null, error: 'No tienes un restaurante asociado', success: false }, { status: 403 });
    }

    // Verify category belongs to user's restaurant
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.restaurantId !== ru.restaurantId) {
      return NextResponse.json({ data: null, error: 'Categoría no encontrada', success: false }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;

    const updated = await prisma.category.update({ where: { id }, data });

    return NextResponse.json({
      data: { id: updated.id, name: updated.name, sortOrder: updated.sortOrder },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar categoría';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}

/**
 * DELETE /api/restaurant/catalog/categories/[id] — Delete a category and its products.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }

    requirePermission(session.user.role as UserRole, 'categories:crud');

    const { id } = await params;

    const ru = await prisma.restaurantUser.findFirst({
      where: { userId: session.user.id },
      select: { restaurantId: true },
    });

    if (!ru) {
      return NextResponse.json({ data: null, error: 'No tienes un restaurante asociado', success: false }, { status: 403 });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.restaurantId !== ru.restaurantId) {
      return NextResponse.json({ data: null, error: 'Categoría no encontrada', success: false }, { status: 404 });
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ data: { deleted: true }, error: null, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar categoría';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}
