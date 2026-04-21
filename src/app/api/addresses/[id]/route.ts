import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { z } from "zod";

const updateAddressSchema = z.object({
  label: z.string().nullable().optional(),
  floorDoor: z.string().nullable().optional(),
});

/**
 * PATCH /api/addresses/[id] — Update a saved address (label, floorDoor).
 * Only the owner of the address can update it.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    const { id } = await params;

    const body = await request.json();
    const parsed = updateAddressSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
      return NextResponse.json(
        { data: null, error: firstError, success: false },
        { status: 422 }
      );
    }

    const supabase = await createClient();

    // Verify the address belongs to the authenticated user
    const { data: existing, error: findError } = await supabase
      .from("addresses")
      .select("id, userId")
      .eq("id", id)
      .single();

    if (findError || existing?.userId !== authUser.id) {
      return NextResponse.json(
        { data: null, error: "Dirección no encontrada", success: false },
        { status: 404 }
      );
    }

    const updateData: { label?: string | null; floorDoor?: string | null } = {};
    if (parsed.data.label !== undefined) {
      updateData.label = parsed.data.label;
    }
    if (parsed.data.floorDoor !== undefined) {
      updateData.floorDoor = parsed.data.floorDoor;
    }

    const { data: address, error: updateError } = await supabase
      .from("addresses")
      .update(updateData)
      .eq("id", id)
      .select("id, label, street, municipality, city, postalCode, floorDoor, createdAt")
      .single();

    if (updateError) {
      console.error("Error updating address:", updateError);
      return NextResponse.json(
        { data: null, error: "Error al actualizar la dirección", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: address,
      error: null,
      success: true,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { data: null, error: "Error al actualizar la dirección", success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/addresses/[id] — Remove a saved address.
 * Only the owner of the address can delete it.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { data: null, error: "No autenticado", success: false },
        { status: 401 }
      );
    }

    const { id } = await params;

    const supabase = await createClient();

    // Verify the address belongs to the authenticated user
    const { data: existing, error: findError } = await supabase
      .from("addresses")
      .select("id, userId")
      .eq("id", id)
      .single();

    if (findError || existing?.userId !== authUser.id) {
      return NextResponse.json(
        { data: null, error: "Dirección no encontrada", success: false },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting address:", deleteError);
      return NextResponse.json(
        { data: null, error: "Error al eliminar la dirección", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: null,
      error: null,
      success: true,
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { data: null, error: "Error al eliminar la dirección", success: false },
      { status: 500 }
    );
  }
}
