import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/session';
import { z } from 'zod';

const consentSchema = z.object({
  consents: z.array(
    z.object({
      consentType: z.enum(['NECESSARY', 'ANALYTICS', 'MARKETING']),
      decision: z.boolean(),
    })
  ),
});

/**
 * GET /api/consent — Get current user's consent decisions.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { data: consents, error } = await supabase
      .from('cookie_consents')
      .select('consentType, decision, createdAt')
      .eq('userId', authUser.id)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[API /consent] Error:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener consentimientos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: consents });
  } catch (error) {
    console.error('[API /consent] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener consentimientos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/consent — Register cookie consent decisions.
 * Stores each consent type in cookie_consents table.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = consentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de consentimiento inválidos' },
        { status: 400 }
      );
    }

    const authUser = await getAuthUser();
    const userId = authUser?.id ?? null;
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const userAgent = request.headers.get('user-agent') ?? null;

    const { consents } = parsed.data;

    const supabase = await createClient();

    const { error } = await supabase
      .from('cookie_consents')
      .insert(
        consents.map((c) => ({
          userId,
          consentType: c.consentType as 'NECESSARY' | 'ANALYTICS' | 'MARKETING',
          decision: c.decision,
          ipAddress,
          userAgent,
        }))
      );

    if (error) {
      console.error('[API /consent] Error:', error);
      return NextResponse.json(
        { success: false, error: 'Error al registrar consentimiento' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /consent] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al registrar consentimiento' },
      { status: 500 }
    );
  }
}
