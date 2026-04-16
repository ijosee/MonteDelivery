import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { MVP_CONSTANTS } from '@/lib/constants';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const forgotPasswordSchema = z.object({
  email: z.email({ message: 'El email no es válido.' }),
});

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

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return NextResponse.json({ error: firstError }, { status: 422 });
    }

    const { email } = parsed.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(
      Date.now() + MVP_CONSTANTS.RESET_PASSWORD_EXPIRY_HOURS * 60 * 60 * 1000
    );

    // Store token with expiry using a JSON field in the user record
    // For MVP, we store the token in the passwordHash field temporarily
    // In production, this would be a separate table or field
    // Using a session-based approach: store in a separate mechanism
    // For MVP: store reset token info via a simple approach using the Session table
    await prisma.session.create({
      data: {
        sessionToken: `reset:${resetToken}`,
        userId: user.id,
        expires: resetTokenExpiry,
      },
    });

    // MVP: Log to console instead of sending email
    const resetUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    console.log('──────────────────────────────────────────');
    console.log('📧 Email de restablecimiento de contraseña');
    console.log(`   Para: ${email}`);
    console.log(`   Enlace: ${resetUrl}`);
    console.log(`   Expira: ${resetTokenExpiry.toISOString()}`);
    console.log('──────────────────────────────────────────');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Ha ocurrido un error.' },
      { status: 500 }
    );
  }
}
