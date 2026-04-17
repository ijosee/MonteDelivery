import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { logAudit } from '@/lib/services/audit.service';
import type { UserRole } from '@/generated/prisma/client';
import type { PrismaClient } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    requirePermission(session.user.role as UserRole, 'products:crud');

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

    const where: Record<string, unknown> = {};
    if (categoryId) where.categoryId = categoryId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { name: true, restaurant: { select: { name: true } } } },
          productAllergens: { select: { allergenId: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      data: {
        products: products.map((p: typeof products[number]) => ({
          id: p.id, name: p.name, description: p.description,
          priceEur: Number(p.priceEur), imageUrl: p.imageUrl, isAvailable: p.isAvailable,
          categoryName: p.category.name, restaurantName: p.category.restaurant.name,
          allergenIds: p.productAllergens.map((pa: typeof p.productAllergens[number]) => pa.allergenId),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
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
    requirePermission(session.user.role as UserRole, 'products:crud');

    const body = await request.json();
    if (!body.categoryId || !body.name?.trim() || !body.imageUrl) {
      return NextResponse.json({ data: null, error: 'categoryId, name e imageUrl son obligatorios', success: false }, { status: 422 });
    }

    const product = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$use' | '$extends'>) => {
      const p = await tx.product.create({
        data: {
          categoryId: body.categoryId, name: body.name.trim(),
          description: body.description || null,
          priceEur: body.priceEur ?? 0, imageUrl: body.imageUrl,
          isAvailable: body.isAvailable ?? true,
        },
      });
      if (Array.isArray(body.allergenIds) && body.allergenIds.length > 0) {
        await tx.productAllergen.createMany({
          data: body.allergenIds.map((aid: number) => ({ productId: p.id, allergenId: aid })),
        });
      }
      return p;
    });

    logAudit({ userId: session.user.id, action: 'PRODUCT_CREATED', resourceType: 'product', resourceId: product.id }).catch(() => {});

    return NextResponse.json({ data: { id: product.id, name: product.name }, error: null, success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ data: null, error: message, success: false }, { status: message.includes('permisos') ? 403 : 500 });
  }
}
