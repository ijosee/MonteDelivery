import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserWithRole } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/rbac";

/**
 * GET /api/restaurant/staff — List staff for the user's restaurant.
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

    // Need at least read access to restaurant
    requirePermission(authUser.role, "restaurants:read");

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

    const { data: members, error: membersError } = await supabase
      .from("restaurant_users")
      .select("role, users(id, name, email)")
      .eq("restaurantId", ru.restaurantId)
      .order("role", { ascending: true });

    if (membersError) {
      console.error("Error fetching staff:", membersError);
      return NextResponse.json(
        { data: null, error: "Error al obtener staff", success: false },
        { status: 500 }
      );
    }

    const data = (members ?? []).map((m) => {
      const user = m.users as unknown as { id: string; name: string; email: string };
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: m.role,
      };
    });

    return NextResponse.json({ data, error: null, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener staff";
    const status = message.includes("permisos") ? 403 : 500;
    return NextResponse.json(
      { data: null, error: message, success: false },
      { status }
    );
  }
}
