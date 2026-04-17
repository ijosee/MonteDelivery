import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/restaurant/catalog — Get categories and products for the user's restaurant.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }

    // At minimum, need to read products
    requirePermission(session.user.role as UserRole, 'products:read');

    const ru = await prisma.restaurantUser.findFirst({
      where: { userId: session.user.id },
      select: { restaurantId: true },
    });

    if (!ru) {
      return NextResponse.json({ data: null, error: 'No tienes un restaurante asociado', success: false }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
      where: { restaurantId: ru.restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          orderBy: { name: 'asc' },
          include: {
            productAllergens: { select: { allergenId: true } },
          },
        },
      },
    });

    const data = categories.map((cat: typeof categories[number]) => ({
      id: cat.id,
      name: cat.name,
      sortOrder: cat.sortOrder,
      products: cat.products.map((p: typeof cat.products[number]) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        priceEur: Number(p.priceEur),
        imageUrl: p.imageUrl,
        isAvailable: p.isAvailable,
        allergenIds: p.productAllergens.map((pa: typeof p.productAllergens[number]) => pa.allergenId),
      })),
    }));

    return NextResponse.json({ data, error: null, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener catálogo';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}
