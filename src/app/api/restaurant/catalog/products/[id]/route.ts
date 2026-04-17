import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/generated/prisma/client';
import type { PrismaClient } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/restaurant/catalog/products/[id] — Update a product.
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

    requirePermission(session.user.role as UserRole, 'products:crud');

    const { id } = await params;
    const body = await request.json();

    const ru = await prisma.restaurantUser.findFirst({
      where: { userId: session.user.id },
      select: { restaurantId: true },
    });

    if (!ru) {
      return NextResponse.json({ data: null, error: 'No tienes un restaurante asociado', success: false }, { status: 403 });
    }

    // Verify product belongs to user's restaurant
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { restaurantId: true } } },
    });

    if (!existing || existing.category.restaurantId !== ru.restaurantId) {
      return NextResponse.json({ data: null, error: 'Producto no encontrado', success: false }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (body.description !== undefined) data.description = body.description || null;
    if (typeof body.priceEur === 'number' && body.priceEur > 0) data.priceEur = Math.round(body.priceEur * 100) / 100;
    if (typeof body.imageUrl === 'string' && body.imageUrl) data.imageUrl = body.imageUrl;
    if (typeof body.isAvailable === 'boolean') data.isAvailable = body.isAvailable;
    if (typeof body.categoryId === 'string') {
      // Verify new category belongs to same restaurant
      const newCat = await prisma.category.findUnique({ where: { id: body.categoryId } });
      if (newCat && newCat.restaurantId === ru.restaurantId) {
        data.categoryId = body.categoryId;
      }
    }

    const updated = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$use' | '$extends'>) => {
      const p = await tx.product.update({ where: { id }, data });

      // Update allergens if provided
      if (Array.isArray(body.allergenIds)) {
        await tx.productAllergen.deleteMany({ where: { productId: id } });
        if (body.allergenIds.length > 0) {
          await tx.productAllergen.createMany({
            data: body.allergenIds.map((allergenId: number) => ({
              productId: id,
              allergenId,
            })),
          });
        }
      }

      return p;
    });

    return NextResponse.json({
      data: { id: updated.id, name: updated.name },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar producto';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}

/**
 * DELETE /api/restaurant/catalog/products/[id] — Delete a product.
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

    requirePermission(session.user.role as UserRole, 'products:crud');

    const { id } = await params;

    const ru = await prisma.restaurantUser.findFirst({
      where: { userId: session.user.id },
      select: { restaurantId: true },
    });

    if (!ru) {
      return NextResponse.json({ data: null, error: 'No tienes un restaurante asociado', success: false }, { status: 403 });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { restaurantId: true } } },
    });

    if (!existing || existing.category.restaurantId !== ru.restaurantId) {
      return NextResponse.json({ data: null, error: 'Producto no encontrado', success: false }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ data: { deleted: true }, error: null, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar producto';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}
