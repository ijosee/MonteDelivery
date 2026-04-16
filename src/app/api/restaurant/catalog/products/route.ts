import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/restaurant/catalog/products — Create a product.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }

    requirePermission(session.user.role as UserRole, 'products:crud');

    const ru = await prisma.restaurantUser.findFirst({
      where: { userId: session.user.id },
      select: { restaurantId: true },
    });

    if (!ru) {
      return NextResponse.json({ data: null, error: 'No tienes un restaurante asociado', success: false }, { status: 403 });
    }

    const body = await request.json();
    const { categoryId, name, description, priceEur, imageUrl, allergenIds, isAvailable } = body;

    if (!name?.trim()) {
      return NextResponse.json({ data: null, error: 'El nombre es obligatorio', success: false }, { status: 422 });
    }
    if (!imageUrl) {
      return NextResponse.json({ data: null, error: 'La imagen del producto es obligatoria.', success: false }, { status: 422 });
    }
    if (!priceEur || priceEur <= 0) {
      return NextResponse.json({ data: null, error: 'El precio debe ser mayor que 0', success: false }, { status: 422 });
    }

    // Verify category belongs to user's restaurant
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.restaurantId !== ru.restaurantId) {
      return NextResponse.json({ data: null, error: 'Categoría no encontrada', success: false }, { status: 404 });
    }

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          categoryId,
          name: name.trim(),
          description: description || null,
          priceEur: Math.round(priceEur * 100) / 100,
          imageUrl,
          isAvailable: isAvailable ?? true,
        },
      });

      if (Array.isArray(allergenIds) && allergenIds.length > 0) {
        await tx.productAllergen.createMany({
          data: allergenIds.map((allergenId: number) => ({
            productId: p.id,
            allergenId,
          })),
        });
      }

      return p;
    });

    return NextResponse.json({
      data: { id: product.id, name: product.name },
      error: null,
      success: true,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear producto';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}
