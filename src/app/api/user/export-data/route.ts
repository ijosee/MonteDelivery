import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/session';
import { logAudit } from '@/lib/services/audit.service';

/**
 * POST /api/user/export-data — Export all personal data as JSON (GDPR Art. 20).
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const userId = authUser.id;
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

    const supabase = await createClient();

    // Fetch all personal data
    const [userRes, addressesRes, ordersRes, cookieConsentsRes, legalAcceptancesRes] =
      await Promise.all([
        supabase
          .from('users')
          .select('id, name, email, role, createdAt, updatedAt')
          .eq('id', userId)
          .single(),
        supabase
          .from('addresses')
          .select('id, label, street, municipality, city, postalCode, floorDoor, createdAt')
          .eq('userId', userId),
        supabase
          .from('orders')
          .select('id, orderNumber, fulfillmentType, subtotalEur, deliveryFeeEur, totalEur, currentStatus, createdAt, order_items(productName, productPriceEur, quantity)')
          .eq('userId', userId),
        supabase
          .from('cookie_consents')
          .select('consentType, decision, createdAt')
          .eq('userId', userId),
        supabase
          .from('legal_acceptances')
          .select('documentType, documentVersion, createdAt')
          .eq('userId', userId),
      ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user: userRes.data,
      addresses: addressesRes.data ?? [],
      orders: (ordersRes.data ?? []).map((o: Record<string, unknown>) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        fulfillmentType: o.fulfillmentType,
        subtotalEur: o.subtotalEur,
        deliveryFeeEur: o.deliveryFeeEur,
        totalEur: o.totalEur,
        currentStatus: o.currentStatus,
        createdAt: o.createdAt,
        items: o.order_items,
      })),
      cookieConsents: cookieConsentsRes.data ?? [],
      legalAcceptances: legalAcceptancesRes.data ?? [],
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
