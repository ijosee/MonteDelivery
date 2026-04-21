import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserWithRole } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/rbac";
import type { Database } from "@/types/database";

/**
 * PATCH /api/restaurant/catalog/products/[id] — Update a product.
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

    requirePermission(authUser.role, "products:crud");

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

    // Verify product belongs to user's restaurant
    const { data: existing } = await supabase
      .from("products")
      .select("id, categoryId, categories(restaurantId)")
      .eq("id", id)
      .single();

    if (
      !existing ||
      (existing.categories as unknown as { restaurantId: string })?.restaurantId !== ru.restaurantId
    ) {
      return NextResponse.json(
        { data: null, error: "Producto no encontrado", success: false },
        { status: 404 }
      );
    }

    const data: Database['public']['Tables']['products']['Update'] = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (body.description !== undefined) data.description = body.description || null;
    if (typeof body.priceEur === "number" && body.priceEur > 0)
      data.priceEur = Math.round(body.priceEur * 100) / 100;
    if (typeof body.imageUrl === "string" && body.imageUrl) data.imageUrl = body.imageUrl;
    if (typeof body.isAvailable === "boolean") data.isAvailable = body.isAvailable;
    if (typeof body.categoryId === "string") {
      // Verify new category belongs to same restaurant
      const { data: newCat } = await supabase
        .from("categories")
        .select("id, restaurantId")
        .eq("id", body.categoryId)
        .single();

      if (newCat && newCat.restaurantId === ru.restaurantId) {
        data.categoryId = body.categoryId;
      }
    }

    data.updatedAt = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("products")
      .update(data)
      .eq("id", id)
      .select("id, name")
      .single();

    if (updateError || !updated) {
      console.error("Error updating product:", updateError);
      return NextResponse.json(
        { data: null, error: "Error al actualizar producto", success: false },
        { status: 500 }
      );
    }

    // Update allergens if provided
    if (Array.isArray(body.allergenIds)) {
      // Delete existing allergens
      const { error: deleteAllergenError } = await supabase
        .from("product_allergens")
        .delete()
        .eq("productId", id);

      if (deleteAllergenError) {
        console.error("Error deleting product allergens:", deleteAllergenError);
      }

      // Insert new allergens
      if (body.allergenIds.length > 0) {
        const { error: insertAllergenError } = await supabase
          .from("product_allergens")
          .insert(
            body.allergenIds.map((allergenId: number) => ({
              productId: id,
              allergenId,
            }))
          );

        if (insertAllergenError) {
          console.error("Error inserting product allergens:", insertAllergenError);
        }
      }
    }

    return NextResponse.json({
      data: { id: updated.id, name: updated.name },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar producto";
    const status = message.includes("permisos") ? 403 : 500;
    return NextResponse.json(
      { data: null, error: message, success: false },
      { status }
    );
  }
}

/**
 * DELETE /api/restaurant/catalog/products/[id] — Delete a product.
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

    requirePermission(authUser.role, "products:crud");

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
      .from("products")
      .select("id, categoryId, categories(restaurantId)")
      .eq("id", id)
      .single();

    if (
      !existing ||
      (existing.categories as unknown as { restaurantId: string })?.restaurantId !== ru.restaurantId
    ) {
      return NextResponse.json(
        { data: null, error: "Producto no encontrado", success: false },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting product:", deleteError);
      return NextResponse.json(
        { data: null, error: "Error al eliminar producto", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { deleted: true }, error: null, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar producto";
    const status = message.includes("permisos") ? 403 : 500;
    return NextResponse.json(
      { data: null, error: message, success: false },
      { status }
    );
  }
}
