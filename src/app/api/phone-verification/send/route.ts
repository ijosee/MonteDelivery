import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/session';
import { z } from 'zod';

const sendCodeSchema = z.object({
  phone: z.string().regex(/^\+34\d{9}$/, {
    message: 'El teléfono debe tener el formato +34XXXXXXXXX.',
  }),
});

/**
 * POST /api/phone-verification/send
 * Generates a 6-digit OTP and stores it. In dev, logs to console.
 * Rate-limited: max 1 code per phone per 60 seconds.
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = sendCodeSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return NextResponse.json(
        { data: null, error: firstError, success: false },
        { status: 422 }
      );
    }

    const { phone } = parsed.data;

    const supabase = await createClient();

    // Rate limit: check if a code was sent in the last 60 seconds
    const sixtySecondsAgo = new Date(Date.now() - 60_000).toISOString();

    const { data: recentCodes } = await supabase
      .from('phone_verifications')
      .select('createdAt')
      .eq('userId', authUser.id)
      .eq('phone', phone)
      .gte('createdAt', sixtySecondsAgo)
      .order('createdAt', { ascending: false })
      .limit(1);

    if (recentCodes && recentCodes.length > 0) {
      const createdAt = new Date(recentCodes[0].createdAt).getTime();
      const secondsLeft = Math.ceil((createdAt + 60_000 - Date.now()) / 1000);
      return NextResponse.json(
        {
          data: null,
          error: `Espera ${secondsLeft}s antes de solicitar otro código.`,
          success: false,
        },
        { status: 429 }
      );
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Store verification record (expires in 10 minutes)
    const { error } = await supabase
      .from('phone_verifications')
      .insert({
        userId: authUser.id,
        phone,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (error) {
      console.error('Error creating phone verification:', error);
      return NextResponse.json(
        { data: null, error: 'Error al enviar el código', success: false },
        { status: 500 }
      );
    }

    // In development: log to console AND return in response for easy testing
    // In production: integrate with SMS provider (Twilio, etc.)
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.log(`\n📱 [DEV] Código de verificación para ${phone}: ${code}\n`);
    }

    return NextResponse.json({
      data: {
        sent: true,
        // Only expose code in development for testing convenience
        ...(isDev ? { devCode: code } : {}),
      },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error sending phone verification:', error);
    return NextResponse.json(
      { data: null, error: 'Error al enviar el código', success: false },
      { status: 500 }
    );
  }
}
