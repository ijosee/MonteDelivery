import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { createAddressSchema } from '@/lib/validators/address.schema';
import { geocodeAddress } from '@/lib/services/geocoding.service';
import { ERRORS } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/addresses — List the authenticated user's saved addresses.
 * GDPR: lat/lng are NOT exposed in the response.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { data: null, error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        street: true,
        municipality: true,
        city: true,
        postalCode: true,
        floorDoor: true,
        createdAt: true,
        // lat and lng intentionally excluded (GDPR)
      },
    });

    return NextResponse.json({
      data: addresses,
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { data: null, error: 'Error al obtener las direcciones', success: false },
      { status: 500 }
    );
  }
}

/**
 * POST /api/addresses — Create a new address with geocoding via CartoCiudad.
 * 1. Validate with createAddressSchema
 * 2. Geocode via geocodeAddress()
 * 3. If not in Andalucía → 422 OUTSIDE_SERVICE_AREA
 * 4. If geocoding fails → 422 ADDRESS_NOT_FOUND
 * 5. Store address with lat/lng
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
    const parsed = createAddressSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return NextResponse.json(
        { data: null, error: firstError, success: false },
        { status: 422 }
      );
    }

    const { street, municipality, city, postalCode, floorDoor, label } = parsed.data;

    // Build full address string for geocoding
    const fullAddress = `${street}, ${municipality}, ${city}, ${postalCode}`;

    // Geocode the address via CartoCiudad
    let geocodingResult;
    try {
      geocodingResult = await geocodeAddress(fullAddress);
    } catch (err: unknown) {
      const error = err as { code?: string; httpStatus?: number; message?: string };
      if (error.code === ERRORS.OUTSIDE_SERVICE_AREA.code) {
        return NextResponse.json(
          {
            data: null,
            error: ERRORS.OUTSIDE_SERVICE_AREA.message,
            code: ERRORS.OUTSIDE_SERVICE_AREA.code,
            title: ERRORS.OUTSIDE_SERVICE_AREA.title,
            action: ERRORS.OUTSIDE_SERVICE_AREA.action,
            success: false,
          },
          { status: 422 }
        );
      }
      if (error.code === ERRORS.ADDRESS_NOT_FOUND.code) {
        return NextResponse.json(
          {
            data: null,
            error: ERRORS.ADDRESS_NOT_FOUND.message,
            code: ERRORS.ADDRESS_NOT_FOUND.code,
            title: ERRORS.ADDRESS_NOT_FOUND.title,
            action: ERRORS.ADDRESS_NOT_FOUND.action,
            success: false,
          },
          { status: 422 }
        );
      }
      // Unknown geocoding error
      return NextResponse.json(
        {
          data: null,
          error: ERRORS.ADDRESS_NOT_FOUND.message,
          code: ERRORS.ADDRESS_NOT_FOUND.code,
          title: ERRORS.ADDRESS_NOT_FOUND.title,
          action: ERRORS.ADDRESS_NOT_FOUND.action,
          success: false,
        },
        { status: 422 }
      );
    }

    // Store address with lat/lng
    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        label: label ?? null,
        street,
        municipality,
        city,
        postalCode,
        floorDoor: floorDoor ?? null,
        lat: geocodingResult.lat,
        lng: geocodingResult.lng,
      },
      select: {
        id: true,
        label: true,
        street: true,
        municipality: true,
        city: true,
        postalCode: true,
        floorDoor: true,
        createdAt: true,
        // lat and lng intentionally excluded (GDPR)
      },
    });

    return NextResponse.json(
      { data: address, error: null, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { data: null, error: 'Error al crear la dirección', success: false },
      { status: 500 }
    );
  }
}
