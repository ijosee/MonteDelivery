import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getAuthUser } from '@/lib/auth/session';
import { logAudit } from '@/lib/services/audit.service';

/**
 * POST /api/user/delete-account — Anonymize personal data (GDPR Art. 17).
 * Keeps anonymized order data for fiscal obligations (5 years).
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

    // Log the deletion request BEFORE anonymizing (so we have the userId)
    await logAudit({
      userId,
      action: 'DELETE_ACCOUNT',
      resourceType: 'user',
      resourceId: userId,
      details: { requestedAt: new Date().toISOString() },
      ipAddress: ipAddress ?? undefined,
    });

    const supabase = await createClient();

    // Anonymize user data — keep the record but remove PII
    const anonymizedEmail = `deleted_${userId}@anonimizado.local`;
    const anonymizedName = 'Usuario eliminado';

    // 1. Anonymize user record
    const { error: userError } = await supabase
      .from('users')
      .update({
        name: anonymizedName,
        email: anonymizedEmail,
        passwordHash: null,
        image: null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userError) {
      console.error('[API /user/delete-account] Error anonymizing user:', userError);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar la cuenta' },
        { status: 500 }
      );
    }

    // 2. Delete addresses (not needed for fiscal obligations)
    await supabase.from('addresses').delete().eq('userId', userId);

    // 3. Delete cart and cart items
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('userId', userId)
      .single();

    if (cart) {
      await supabase.from('cart_items').delete().eq('cartId', cart.id);
      await supabase.from('carts').delete().eq('id', cart.id);
    }

    // 4. Delete cookie consents
    await supabase.from('cookie_consents').delete().eq('userId', userId);

    // 5. Delete auth accounts (OAuth links)
    await supabase.from('auth_accounts').delete().eq('userId', userId);

    // 6. Delete sessions
    await supabase.from('sessions').delete().eq('userId', userId);

    // 7. Delete user from Supabase Auth using service role
    const serviceClient = createServiceClient();
    await serviceClient.auth.admin.deleteUser(userId);

    // Orders are kept with anonymized user for fiscal obligations (5 years)
    // The user record remains but with anonymized data

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
