import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserWithRole } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/rbac";

/**
 * POST /api/restaurant/catalog/products — Create a product.
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

    requirePermission(authUser.role, "products:crud");

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
    const { categoryId, name, description, priceEur, imageUrl, allergenIds, isAvailable } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { data: null, error: "El nombre es obligatorio", success: false },
        { status: 422 }
      );
    }
    if (!imageUrl) {
      return NextResponse.json(
        { data: null, error: "La imagen del producto es obligatoria.", success: false },
        { status: 422 }
      );
    }
    if (!priceEur || priceEur <= 0) {
      return NextResponse.json(
        { data: null, error: "El precio debe ser mayor que 0", success: false },
        { status: 422 }
      );
    }

    // Verify category belongs to user's restaurant
    const { data: category } = await supabase
      .from("categories")
      .select("id, restaurantId")
      .eq("id", categoryId)
      .single();

    if (!category || category.restaurantId !== ru.restaurantId) {
      return NextResponse.json(
        { data: null, error: "Categoría no encontrada", success: false },
        { status: 404 }
      );
    }

    // Create the product
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        categoryId,
        name: name.trim(),
        description: description || null,
        priceEur: Math.round(priceEur * 100) / 100,
        imageUrl,
        isAvailable: isAvailable ?? true,
        updatedAt: new Date().toISOString(),
      })
      .select("id, name")
      .single();

    if (productError || !product) {
      console.error("Error creating product:", productError);
      return NextResponse.json(
        { data: null, error: "Error al crear producto", success: false },
        { status: 500 }
      );
    }

    // Insert allergens if provided
    if (Array.isArray(allergenIds) && allergenIds.length > 0) {
      const { error: allergenError } = await supabase
        .from("product_allergens")
        .insert(
          allergenIds.map((allergenId: number) => ({
            productId: product.id,
            allergenId,
          }))
        );

      if (allergenError) {
        console.error("Error inserting product allergens:", allergenError);
        // Product was created — log but don't fail
      }
    }

    return NextResponse.json(
      {
        data: { id: product.id, name: product.name },
        error: null,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear producto";
    const status = message.includes("permisos") ? 403 : 500;
    return NextResponse.json(
      { data: null, error: message, success: false },
      { status }
    );
  }
}
