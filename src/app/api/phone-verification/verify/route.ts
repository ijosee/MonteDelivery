import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const verifyCodeSchema = z.object({
  phone: z.string().regex(/^\+34\d{9}$/, {
    message: 'El teléfono debe tener el formato +34XXXXXXXXX.',
  }),
  code: z.string().length(6, 'El código debe tener 6 dígitos.'),
});

const MAX_ATTEMPTS = 5;

/**
 * POST /api/phone-verification/verify
 * Verifies the OTP code for a phone number.
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
    const parsed = verifyCodeSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return NextResponse.json(
        { data: null, error: firstError, success: false },
        { status: 422 }
      );
    }

    const { phone, code } = parsed.data;

    // Find the latest non-expired, non-verified code for this user+phone
    const verification = await prisma.phoneVerification.findFirst({
      where: {
        userId: session.user.id,
        phone,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return NextResponse.json(
        { data: null, error: 'No hay código pendiente. Solicita uno nuevo.', success: false },
        { status: 422 }
      );
    }

    // Check max attempts
    if (verification.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { data: null, error: 'Demasiados intentos. Solicita un nuevo código.', success: false },
        { status: 429 }
      );
    }

    // Increment attempts
    await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });

    // Check code
    if (verification.code !== code) {
      const remaining = MAX_ATTEMPTS - verification.attempts - 1;
      return NextResponse.json(
        {
          data: null,
          error: remaining > 0
            ? `Código incorrecto. Te quedan ${remaining} intento${remaining === 1 ? '' : 's'}.`
            : 'Código incorrecto. Solicita un nuevo código.',
          success: false,
        },
        { status: 422 }
      );
    }

    // Mark as verified
    await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    });

    return NextResponse.json({
      data: { verified: true, phone },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error verifying phone:', error);
    return NextResponse.json(
      { data: null, error: 'Error al verificar el código', success: false },
      { status: 500 }
    );
  }
}
