import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

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
    const session = await auth();
    if (!session?.user?.id) {
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

    // Rate limit: check if a code was sent in the last 60 seconds
    const recentCode = await prisma.phoneVerification.findFirst({
      where: {
        userId: session.user.id,
        phone,
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentCode) {
      const secondsLeft = Math.ceil(
        (recentCode.createdAt.getTime() + 60_000 - Date.now()) / 1000
      );
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
    await prisma.phoneVerification.create({
      data: {
        userId: session.user.id,
        phone,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

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
