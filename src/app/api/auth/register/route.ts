import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { registerSchema } from '@/lib/validators/auth.schema';
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
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return NextResponse.json({ error: firstError }, { status: 422 });
    }

    const { name, email, password } = parsed.data;

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este email.' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (cost factor 10)
    const passwordHash = await hash(password, MVP_CONSTANTS.BCRYPT_COST_FACTOR);

    // Create user with role CUSTOMER and emailVerified set to now for MVP
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'CUSTOMER',
        emailVerified: new Date(), // Auto-verified for MVP
      },
    });

    return NextResponse.json(
      { success: true, message: 'Cuenta creada correctamente.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Ha ocurrido un error al crear la cuenta.' },
      { status: 500 }
    );
  }
}
