import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const newPasswordSchema = z.object({
  password: z.string().min(8, {
    message: "La contraseña debe tener al menos 8 caracteres.",
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 attempts/min/IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const rateCheck = checkRateLimit(ip);
    if (rateCheck.limited) {
      return NextResponse.json(
        { error: "Demasiados intentos. Inténtalo de nuevo en unos minutos." },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfterSeconds ?? 60) },
        }
      );
    }

    const body = await request.json();

    // Validate new password
    const parsed = newPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Datos inválidos.";
      return NextResponse.json({ error: firstError }, { status: 422 });
    }

    const { password } = parsed.data;

    // The user arrives here after clicking the reset link in their email,
    // which sets up the Supabase session via the callback route.
    // We just need to update the password using the active session.
    const supabase = await createClient();

    // Verify the user has an active session (set by the callback route)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "El enlace de restablecimiento no es válido o ha expirado." },
        { status: 401 }
      );
    }

    // Update the password via Supabase Auth (Req 6.2)
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("Supabase updateUser error:", error);
      return NextResponse.json(
        { error: "Ha ocurrido un error al restablecer la contraseña." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada correctamente.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Ha ocurrido un error al restablecer la contraseña." },
      { status: 500 }
    );
  }
}
