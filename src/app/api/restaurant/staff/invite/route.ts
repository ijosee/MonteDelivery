import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { logAudit } from '@/lib/services/audit.service';
import type { UserRole } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/restaurant/staff/invite — Invite staff by email.
 * Body: { email: string }
 * Only RESTAURANT_OWNER can invite staff.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { data: null, error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    requirePermission(session.user.role as UserRole, 'staff:manage');

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json(
        { data: null, error: 'El email es obligatorio', success: false },
        { status: 422 }
      );
    }

    // Find the restaurant the owner belongs to
    const ownerRu = await prisma.restaurantUser.findFirst({
      where: { userId: session.user.id, role: 'OWNER' },
      select: { restaurantId: true },
    });

    if (!ownerRu) {
      return NextResponse.json(
        { data: null, error: 'No tienes un restaurante asociado', success: false },
        { status: 403 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { data: null, error: 'No se encontró un usuario con ese email. El usuario debe registrarse primero.', success: false },
        { status: 404 }
      );
    }

    // Check if already associated
    const existing = await prisma.restaurantUser.findUnique({
      where: { userId_restaurantId: { userId: user.id, restaurantId: ownerRu.restaurantId } },
    });

    if (existing) {
      return NextResponse.json(
        { data: null, error: 'Este usuario ya está asociado al restaurante', success: false },
        { status: 409 }
      );
    }

    // Create association and update user role
    await prisma.$transaction(async (tx) => {
      await tx.restaurantUser.create({
        data: {
          userId: user.id,
          restaurantId: ownerRu.restaurantId,
          role: 'STAFF',
        },
      });

      // Update user role to RESTAURANT_STAFF if they are currently CUSTOMER
      await tx.user.update({
        where: { id: user.id },
        data: { role: 'RESTAURANT_STAFF' },
      });
    });

    logAudit({
      userId: session.user.id,
      action: 'STAFF_INVITED',
      resourceType: 'restaurant_user',
      resourceId: user.id,
      details: { email, restaurantId: ownerRu.restaurantId },
    }).catch(() => {});

    return NextResponse.json({
      data: { userId: user.id, name: user.name, email: user.email, role: 'STAFF' },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al invitar staff';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}
