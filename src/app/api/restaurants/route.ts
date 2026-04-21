import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Converts JS getDay() (0=Sunday) to our system (0=Monday, 6=Sunday).
 */
function jsDayToSystem(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * Determines if a restaurant is currently open based on its opening hours.
 */
function isRestaurantOpen(
  openingHours: { dayOfWeek: number; openTime: string; closeTime: string }[],
  now: Date = new Date()
): boolean {
  const dayOfWeek = jsDayToSystem(now.getDay());
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return openingHours.some(
    (h) =>
      h.dayOfWeek === dayOfWeek &&
      currentTime >= h.openTime &&
      currentTime < h.closeTime
  );
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const isOpenFilter = searchParams.get("is_open");
    const maxDeliveryFee = searchParams.get("max_delivery_fee");
    const maxMinOrder = searchParams.get("max_min_order");

    const supabase = await createClient();

    // Build Supabase query with filters
    let query = supabase
      .from("restaurants")
      .select("*, opening_hours(*)")
      .eq("isActive", true);

    if (type) {
      query = query.eq("cuisineType", type);
    }

    if (maxDeliveryFee) {
      query = query.lte("deliveryFeeEur", Number.parseFloat(maxDeliveryFee));
    }

    if (maxMinOrder) {
      query = query.lte("minOrderEur", Number.parseFloat(maxMinOrder));
    }

    const { data: restaurants, error } = await query;

    if (error) {
      console.error("Error fetching restaurants:", error);
      return Response.json(
        { data: null, error: "Error al obtener restaurantes", success: false },
        { status: 500 }
      );
    }

    const now = new Date();

    // Map restaurants with isOpen status
    let result = (restaurants ?? []).map((r) => {
      const isOpen = isRestaurantOpen(r.opening_hours ?? [], now);
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        imageUrl: r.imageUrl,
        cuisineType: r.cuisineType,
        isOpen,
        deliveryFeeEur: Number(r.deliveryFeeEur),
        minOrderEur: Number(r.minOrderEur),
        deliveryRadiusKm: r.deliveryRadiusKm,
      };
    });

    // Apply is_open filter (must be done in-memory since it depends on opening hours)
    if (isOpenFilter === "true") {
      result = result.filter((r) => r.isOpen);
    }

    // Sort: open restaurants first, then closed (Req 1.8)
    result.sort((a, b) => {
      if (a.isOpen === b.isOpen) return 0;
      return a.isOpen ? -1 : 1;
    });

    return Response.json({ data: result, error: null, success: true });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return Response.json(
      { data: null, error: "Error al obtener restaurantes", success: false },
      { status: 500 }
    );
  }
}
