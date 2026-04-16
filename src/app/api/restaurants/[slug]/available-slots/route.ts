import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAvailableSlots } from '@/lib/domain/slot-generator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/restaurants/[slug]/available-slots?date=YYYY-MM-DD
 * Returns available delivery slots for a restaurant on a given date.
 * Accepts either a slug or a CUID id as the [slug] parameter.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date');

    // Validate date parameter
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          data: null,
          error: 'El parámetro date es obligatorio con formato YYYY-MM-DD.',
          success: false,
        },
        { status: 422 }
      );
    }

    // Try finding by slug first, then by id (supports both)
    let restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        isActive: true,
        openingHours: {
          select: {
            dayOfWeek: true,
            openTime: true,
            closeTime: true,
          },
        },
      },
    });

    if (!restaurant) {
      restaurant = await prisma.restaurant.findUnique({
        where: { id: slug },
        select: {
          id: true,
          isActive: true,
          openingHours: {
            select: {
              dayOfWeek: true,
              openTime: true,
              closeTime: true,
            },
          },
        },
      });
    }

    if (!restaurant?.isActive) {
      return NextResponse.json(
        { data: null, error: 'Restaurante no encontrado', success: false },
        { status: 404 }
      );
    }

    const slots = getAvailableSlots({
      openingHours: restaurant.openingHours,
      date,
      now: new Date(),
    });

    return NextResponse.json({
      data: { date, slots },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { data: null, error: 'Error al obtener los slots disponibles', success: false },
      { status: 500 }
    );
  }
}
