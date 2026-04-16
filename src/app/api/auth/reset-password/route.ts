import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { resetPasswordSchema } from '@/lib/validators/auth.schema';
import { prisma } from '@/lib/db';
import { MVP_CONSTANTS } from '@/lib/constants';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 attempts/min/IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rateCheck = checkRateLimit(ip);
    if (rateCheck.limited) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Inténtalo de nuevo en unos minutos.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds ?? 60) } }
      );
    }

    const body = await request.json();

    // Validate with Zod
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return NextResponse.json({ error: firstError }, { status: 422 });
    }

    const { token, password } = parsed.data;

    // Find the reset token session
    const resetSession = await prisma.session.findUnique({
      where: { sessionToken: `reset:${token}` },
      include: { user: true },
    });

    if (!resetSession) {
      return NextResponse.json(
        { error: 'El enlace de restablecimiento no es válido o ha expirado.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (resetSession.expires < new Date()) {
      // Clean up expired token
      await prisma.session.delete({
        where: { id: resetSession.id },
      });
      return NextResponse.json(
        { error: 'El enlace de restablecimiento ha expirado. Solicita uno nuevo.' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hash(password, MVP_CONSTANTS.BCRYPT_COST_FACTOR);

    // Update user password and clear token in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetSession.userId },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.session.delete({
        where: { id: resetSession.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Ha ocurrido un error al restablecer la contraseña.' },
      { status: 500 }
    );
  }
}
