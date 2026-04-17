import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { PrismaClient } from '@/generated/prisma/client';
import { auth } from '@/lib/auth/auth';
import { logAudit } from '@/lib/services/audit.service';

/**
 * POST /api/user/delete-account — Anonymize personal data (GDPR Art. 17).
 * Keeps anonymized order data for fiscal obligations (5 years).
 * Requisitos: 16.4, 16.5
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

    // Log the deletion request BEFORE anonymizing (so we have the userId)
    await logAudit({
      userId,
      action: 'DELETE_ACCOUNT',
      resourceType: 'user',
      resourceId: userId,
      details: { requestedAt: new Date().toISOString() },
      ipAddress: ipAddress ?? undefined,
    });

    // Anonymize user data — keep the record but remove PII
    const anonymizedEmail = `deleted_${userId}@anonimizado.local`;
    const anonymizedName = 'Usuario eliminado';

    await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$use' | '$extends'>) => {
      // 1. Anonymize user record
      await tx.user.update({
        where: { id: userId },
        data: {
          name: anonymizedName,
          email: anonymizedEmail,
          passwordHash: null,
          image: null,
        },
      });

      // 2. Delete addresses (not needed for fiscal obligations)
      await tx.address.deleteMany({ where: { userId } });

      // 3. Delete cart and cart items
      await tx.cart.deleteMany({ where: { userId } });

      // 4. Delete cookie consents
      await tx.cookieConsent.deleteMany({ where: { userId } });

      // 5. Delete auth accounts (OAuth links)
      await tx.authAccount.deleteMany({ where: { userId } });

      // 6. Delete sessions
      await tx.session.deleteMany({ where: { userId } });

      // Orders are kept with anonymized user for fiscal obligations (5 years)
      // The user record remains but with anonymized data
    });

    return NextResponse.json({
      success: true,
      message: 'Cuenta eliminada. Tus datos personales han sido anonimizados.',
    });
  } catch (error) {
    console.error('[API /user/delete-account] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la cuenta' },
      { status: 500 }
    );
  }
}
