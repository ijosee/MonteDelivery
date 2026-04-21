import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Invalidate the session in Supabase Auth (Req 5.1)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return NextResponse.json(
        { error: "Ha ocurrido un error al cerrar sesión." },
        { status: 500 }
      );
    }

    // Redirect to login page after logout (Req 5.3)
    // Cookies are cleaned automatically by Supabase SSR on signOut (Req 5.2)
    return NextResponse.json(
      { success: true, redirectTo: "/auth/login" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Ha ocurrido un error al cerrar sesión." },
      { status: 500 }
    );
  }
}
