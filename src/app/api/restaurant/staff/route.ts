import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/restaurant/staff — List staff for the user's restaurant.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }

    // Need at least read access to restaurant
    requirePermission(session.user.role as UserRole, 'restaurants:read');

    const ru = await prisma.restaurantUser.findFirst({
      where: { userId: session.user.id },
      select: { restaurantId: true },
    });

    if (!ru) {
      return NextResponse.json({ data: null, error: 'No tienes un restaurante asociado', success: false }, { status: 403 });
    }

    const members = await prisma.restaurantUser.findMany({
      where: { restaurantId: ru.restaurantId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { role: 'asc' },
    });

    const data = members.map((m: typeof members[number]) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    }));

    return NextResponse.json({ data, error: null, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener staff';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}
