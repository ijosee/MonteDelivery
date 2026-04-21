import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserWithRole } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/rbac";

/**
 * GET /api/restaurant/catalog — Get categories and products for the user's restaurant.
 */
export async function GET() {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    // At minimum, need to read products
    requirePermission(authUser.role, "products:read");

    const supabase = await createClient();

    const { data: ru } = await supabase
      .from("restaurant_users")
      .select("restaurantId")
      .eq("userId", authUser.id)
      .limit(1)
      .single();

    if (!ru) {
      return NextResponse.json(
        { data: null, error: "No tienes un restaurante asociado", success: false },
        { status: 403 }
      );
    }

    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("*, products(*, product_allergens(allergenId))")
      .eq("restaurantId", ru.restaurantId)
      .order("sortOrder", { ascending: true });

    if (catError) {
      console.error("Error fetching catalog:", catError);
      return NextResponse.json(
        { data: null, error: "Error al obtener catálogo", success: false },
        { status: 500 }
      );
    }

    const data = (categories ?? []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      sortOrder: cat.sortOrder,
      products: (cat.products ?? []).map((p: Record<string, unknown> & { product_allergens?: { allergenId: number }[] }) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        priceEur: Number(p.priceEur),
        imageUrl: p.imageUrl,
        isAvailable: p.isAvailable,
        allergenIds: (p.product_allergens ?? []).map((pa) => pa.allergenId),
      })),
    }));

    return NextResponse.json({ data, error: null, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener catálogo";
    const status = message.includes("permisos") ? 403 : 500;
    return NextResponse.json(
      { data: null, error: message, success: false },
      { status }
    );
  }
}
