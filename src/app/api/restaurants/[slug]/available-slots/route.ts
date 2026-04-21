import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAvailableSlots } from "@/lib/domain/slot-generator";

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
    const date = searchParams.get("date");

    // Validate date parameter
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          data: null,
          error: "El parámetro date es obligatorio con formato YYYY-MM-DD.",
          success: false,
        },
        { status: 422 }
      );
    }

    const supabase = await createClient();

    // Try finding by slug first
    let { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("id, isActive, opening_hours(dayOfWeek, openTime, closeTime)")
      .eq("slug", slug)
      .single();

    // If not found by slug, try by id
    if (error?.code === "PGRST116" || !restaurant) {
      const result = await supabase
        .from("restaurants")
        .select("id, isActive, opening_hours(dayOfWeek, openTime, closeTime)")
        .eq("id", slug)
        .single();

      restaurant = result.data;
      error = result.error;
    }

    if (error || !restaurant?.isActive) {
      if (error && error.code !== "PGRST116") {
        console.error("Error fetching restaurant for slots:", error);
        return NextResponse.json(
          {
            data: null,
            error: "Error al obtener los slots disponibles",
            success: false,
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { data: null, error: "Restaurante no encontrado", success: false },
        { status: 404 }
      );
    }

    const slots = getAvailableSlots({
      openingHours: restaurant.opening_hours ?? [],
      date,
      now: new Date(),
    });

    return NextResponse.json({
      data: { date, slots },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      {
        data: null,
        error: "Error al obtener los slots disponibles",
        success: false,
      },
      { status: 500 }
    );
  }
}
