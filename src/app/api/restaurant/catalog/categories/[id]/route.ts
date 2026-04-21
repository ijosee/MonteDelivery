import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserWithRole } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/rbac";
import type { Database } from "@/types/database";

/**
 * PATCH /api/restaurant/catalog/categories/[id] — Update a category.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    requirePermission(authUser.role, "categories:crud");

    const { id } = await params;
    const body = await request.json();

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

    // Verify category belongs to user's restaurant
    const { data: existing } = await supabase
      .from("categories")
      .select("id, restaurantId")
      .eq("id", id)
      .single();

    if (!existing || existing.restaurantId !== ru.restaurantId) {
      return NextResponse.json(
        { data: null, error: "Categoría no encontrada", success: false },
        { status: 404 }
      );
    }

    const data: Database['public']['Tables']['categories']['Update'] = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

    const { data: updated, error: updateError } = await supabase
      .from("categories")
      .update(data)
      .eq("id", id)
      .select("id, name, sortOrder")
      .single();

    if (updateError || !updated) {
      console.error("Error updating category:", updateError);
      return NextResponse.json(
        { data: null, error: "Error al actualizar categoría", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { id: updated.id, name: updated.name, sortOrder: updated.sortOrder },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar categoría";
    const status = message.includes("permisos") ? 403 : 500;
    return NextResponse.json(
      { data: null, error: message, success: false },
      { status }
    );
  }
}

/**
 * DELETE /api/restaurant/catalog/categories/[id] — Delete a category and its products.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    requirePermission(authUser.role, "categories:crud");

    const { id } = await params;

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

    const { data: existing } = await supabase
      .from("categories")
      .select("id, restaurantId")
      .eq("id", id)
      .single();

    if (!existing || existing.restaurantId !== ru.restaurantId) {
      return NextResponse.json(
        { data: null, error: "Categoría no encontrada", success: false },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting category:", deleteError);
      return NextResponse.json(
        { data: null, error: "Error al eliminar categoría", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { deleted: true }, error: null, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar categoría";
    const status = message.includes("permisos") ? 403 : 500;
    return NextResponse.json(
      { data: null, error: message, success: false },
      { status }
    );
  }
}
