import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserWithRole } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/services/audit.service";

/**
 * POST /api/restaurant/staff/invite — Invite staff by email.
 * Body: { email: string }
 * Only RESTAURANT_OWNER can invite staff.
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

    requirePermission(authUser.role, "staff:manage");

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        { data: null, error: "El email es obligatorio", success: false },
        { status: 422 }
      );
    }

    const supabase = await createClient();

    // Find the restaurant the owner belongs to
    const { data: ownerRu } = await supabase
      .from("restaurant_users")
      .select("restaurantId")
      .eq("userId", authUser.id)
      .eq("role", "OWNER")
      .limit(1)
      .single();

    if (!ownerRu) {
      return NextResponse.json(
        { data: null, error: "No tienes un restaurante asociado", success: false },
        { status: 403 }
      );
    }

    // Find the user by email
    const { data: user } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("email", email)
      .single();

    if (!user) {
      return NextResponse.json(
        {
          data: null,
          error: "No se encontró un usuario con ese email. El usuario debe registrarse primero.",
          success: false,
        },
        { status: 404 }
      );
    }

    // Check if already associated
    const { data: existing } = await supabase
      .from("restaurant_users")
      .select("id")
      .eq("userId", user.id)
      .eq("restaurantId", ownerRu.restaurantId)
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json(
        { data: null, error: "Este usuario ya está asociado al restaurante", success: false },
        { status: 409 }
      );
    }

    // Create association
    const { error: insertError } = await supabase
      .from("restaurant_users")
      .insert({
        userId: user.id,
        restaurantId: ownerRu.restaurantId,
        role: "STAFF",
      });

    if (insertError) {
      console.error("Error creating restaurant_user:", insertError);
      return NextResponse.json(
        { data: null, error: "Error al invitar staff", success: false },
        { status: 500 }
      );
    }

    // Update user role to RESTAURANT_STAFF
    const { error: updateError } = await supabase
      .from("users")
      .update({ role: "RESTAURANT_STAFF", updatedAt: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating user role:", updateError);
      // Association was created — log but don't fail
    }

    // Audit log (fire-and-forget)
    logAudit({
      userId: authUser.id,
      action: "STAFF_INVITED",
      resourceType: "restaurant_user",
      resourceId: user.id,
      details: { email, restaurantId: ownerRu.restaurantId },
    }).catch(() => {});

    return NextResponse.json({
      data: { userId: user.id, name: user.name, email: user.email, role: "STAFF" },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al invitar staff";
    const status = message.includes("permisos") ? 403 : 500;
    return NextResponse.json(
      { data: null, error: message, success: false },
      { status }
    );
  }
}
