import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserWithRole } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/rbac";

/**
 * POST /api/restaurant/catalog/categories — Create a category.
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    requirePermission(authUser.role, "categories:crud");

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

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : 0;

    if (!name) {
      return NextResponse.json(
        { data: null, error: "El nombre es obligatorio", success: false },
        { status: 422 }
      );
    }

    const { data: category, error: insertError } = await supabase
      .from("categories")
      .insert({ restaurantId: ru.restaurantId, name, sortOrder })
      .select("id, name, sortOrder")
      .single();

    if (insertError || !category) {
      console.error("Error creating category:", insertError);
      return NextResponse.json(
        { data: null, error: "Error al crear categoría", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: { id: category.id, name: category.name, sortOrder: category.sortOrder },
        error: null,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear categoría";
    const status = message.includes("permisos") ? 403 : 500;
    return NextResponse.json(
      { data: null, error: message, success: false },
      { status }
    );
  }
}
