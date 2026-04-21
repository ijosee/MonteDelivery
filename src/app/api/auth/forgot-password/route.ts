import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const forgotPasswordSchema = z.object({
  email: z.email({ message: "El email no es válido." }),
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

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Datos inválidos.";
      return NextResponse.json({ error: firstError }, { status: 422 });
    }

    const { email } = parsed.data;

    const supabase = await createClient();

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // Delegate password reset to Supabase Auth.
    // Supabase sends the recovery email with a link that goes through the
    // callback route, which exchanges the code for a session and then
    // redirects to /auth/reset-password.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/api/auth/callback?type=recovery`,
    });

    if (error) {
      console.error("Supabase resetPasswordForEmail error:", error);
    }

    // Always return success regardless of whether the email exists
    // to prevent email enumeration (security best practice).
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Ha ocurrido un error." },
      { status: 500 }
    );
  }
}
