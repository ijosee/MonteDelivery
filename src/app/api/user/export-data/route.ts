import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth/auth';
import { logAudit } from '@/lib/services/audit.service';

/**
 * POST /api/user/export-data — Export all personal data as JSON (GDPR Art. 20).
 * Requisitos: 16.3
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

    // Fetch all personal data
    const [user, addresses, orders, cookieConsents, legalAcceptances] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.address.findMany({
          where: { userId },
          select: {
            id: true,
            label: true,
            street: true,
            municipality: true,
            city: true,
            postalCode: true,
            floorDoor: true,
            createdAt: true,
          },
        }),
        prisma.order.findMany({
          where: { userId },
          select: {
            id: true,
            orderNumber: true,
            fulfillmentType: true,
            subtotalEur: true,
            deliveryFeeEur: true,
            totalEur: true,
            currentStatus: true,
            createdAt: true,
            items: {
              select: {
                productName: true,
                productPriceEur: true,
                quantity: true,
              },
            },
          },
        }),
        prisma.cookieConsent.findMany({
          where: { userId },
          select: {
            consentType: true,
            decision: true,
            createdAt: true,
          },
        }),
        prisma.legalAcceptance.findMany({
          where: { userId },
          select: {
            documentType: true,
            documentVersion: true,
            createdAt: true,
          },
        }),
      ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user,
      addresses,
      orders,
      cookieConsents,
      legalAcceptances,
    };

    // Log the export in audit
    await logAudit({
      userId,
      action: 'EXPORT_DATA',
      resourceType: 'user',
      resourceId: userId,
      details: { exportedAt: new Date().toISOString() },
      ipAddress: ipAddress ?? undefined,
    });

    return NextResponse.json({ success: true, data: exportData });
  } catch (error) {
    console.error('[API /user/export-data] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al exportar datos' },
      { status: 500 }
    );
  }
}
