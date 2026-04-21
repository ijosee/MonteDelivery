import { type NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { distanceKm } from "@/lib/domain/haversine";

/**
 * GET /api/restaurants/nearby?addressId=X&excludeId=Z
 * Returns active restaurants that can deliver to the user's address,
 * sorted by distance. Optionally excludes a restaurant by ID.
 * Requires authentication (address ownership is verified).
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return Response.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get("addressId");
    const excludeId = searchParams.get("excludeId") ?? undefined;

    if (!addressId) {
      return Response.json(
        { data: null, error: "Parámetro addressId requerido", success: false },
        { status: 422 }
      );
    }

    const supabase = await createClient();

    // Fetch address (verify ownership)
    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .select("userId, lat, lng")
      .eq("id", addressId)
      .single();

    if (addressError || address?.userId !== authUser.id) {
      return Response.json(
        { data: null, error: "Dirección no encontrada", success: false },
        { status: 404 }
      );
    }

    const { lat, lng } = address;

    // Fetch active restaurants with opening hours and categories (with available products)
    let query = supabase
      .from("restaurants")
      .select("*, opening_hours(dayOfWeek, openTime, closeTime), categories(id, products(id, isAvailable))")
      .eq("isActive", true);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data: restaurants, error: restaurantsError } = await query;

    if (restaurantsError) {
      console.error("Error fetching restaurants:", restaurantsError);
      return Response.json(
        { data: null, error: "Error al buscar restaurantes cercanos", success: false },
        { status: 500 }
      );
    }

    const now = new Date();
    const jsDay = now.getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const nearby = (restaurants ?? [])
      .map((r) => {
        const dist = distanceKm(lat, lng, r.lat, r.lng);
        const canDeliver = dist <= r.deliveryRadiusKm;
        const isOpen = (r.opening_hours ?? []).some(
          (h: { dayOfWeek: number; openTime: string; closeTime: string }) =>
            h.dayOfWeek === dayOfWeek &&
            currentTime >= h.openTime &&
            currentTime < h.closeTime
        );
        const hasProducts = (r.categories ?? []).some(
          (c: { id: string; products: { id: string; isAvailable: boolean }[] }) =>
            (c.products ?? []).some((p) => p.isAvailable)
        );

        return {
          id: r.id,
          name: r.name,
          slug: r.slug,
          imageUrl: r.imageUrl,
          cuisineType: r.cuisineType,
          deliveryFeeEur: Number(r.deliveryFeeEur),
          distanceKm: Math.round(dist * 10) / 10,
          canDeliver,
          isOpen,
          hasProducts,
        };
      })
      .filter((r) => r.canDeliver && r.hasProducts)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 10);

    return Response.json({ data: nearby, error: null, success: true });
  } catch (error) {
    console.error("Error fetching nearby restaurants:", error);
    return Response.json(
      { data: null, error: "Error al buscar restaurantes cercanos", success: false },
      { status: 500 }
    );
  }
}
