import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth/auth';
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
 * POST /api/consent — Register cookie consent decisions.
 * Stores each consent type in cookie_consents table.
 * Requisitos: 17.3
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

    const session = await auth();
    const userId = session?.user?.id ?? null;
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const userAgent = request.headers.get('user-agent') ?? null;

    const { consents } = parsed.data;

    // Create all consent records
    await prisma.cookieConsent.createMany({
      data: consents.map((c) => ({
        userId,
        consentType: c.consentType as 'NECESSARY' | 'ANALYTICS' | 'MARKETING',
        decision: c.decision,
        ipAddress,
        userAgent,
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /consent] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al registrar consentimiento' },
      { status: 500 }
    );
  }
}
