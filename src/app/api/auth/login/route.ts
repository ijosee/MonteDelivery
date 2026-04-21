import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators/auth.schema";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 attempts/min/IP (same pattern as register)
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

    // Validate with Zod
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
      return NextResponse.json({ error: firstError }, { status: 422 });
    }

    const { email, password } = parsed.data;

    const supabase = await createClient();

    // Authenticate with Supabase Auth — no manual failed-attempt blocking,
    // brute-force protection is delegated to Supabase Auth.
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      // Generic message: never reveal whether the email exists (Req 4.2)
      return NextResponse.json(
        { error: "Email o contraseña incorrectos" },
        { status: 401 }
      );
    }

    // Supabase Auth handles session cookies via SSR (Req 4.4).
    // Return user data on success.
    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Ha ocurrido un error al iniciar sesión." },
      { status: 500 }
    );
  }
}
