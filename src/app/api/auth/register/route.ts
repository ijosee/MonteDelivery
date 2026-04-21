import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validators/auth.schema";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

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

    // Validate with Zod
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
      return NextResponse.json({ error: firstError }, { status: 422 });
    }

    const { name, email, password } = parsed.data;

    const supabase = await createClient();

    // Register user in Supabase Auth
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

    if (signUpError) {
      // Supabase returns a specific message for duplicate emails
      if (
        signUpError.message?.toLowerCase().includes("already registered") ||
        signUpError.status === 422
      ) {
        return NextResponse.json(
          { error: "Ya existe una cuenta con este email." },
          { status: 409 }
        );
      }

      console.error("Supabase Auth signUp error:", signUpError);
      return NextResponse.json(
        { error: "Ha ocurrido un error al crear la cuenta." },
        { status: 500 }
      );
    }

    // Supabase may return a user with a fake id when the email already exists
    // (if "Confirm email" is enabled and the user hasn't confirmed yet).
    // In that case identities will be empty.
    if (
      !signUpData.user ||
      signUpData.user.identities?.length === 0
    ) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email." },
        { status: 409 }
      );
    }

    // Insert corresponding row in the public `users` table
    const { error: insertError } = await supabase.from("users").insert({
      id: signUpData.user.id,
      name,
      email,
      role: "CUSTOMER",
      emailVerified: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error inserting user row:", insertError);
      return NextResponse.json(
        { error: "Ha ocurrido un error al crear la cuenta." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Cuenta creada correctamente." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Ha ocurrido un error al crear la cuenta." },
      { status: 500 }
    );
  }
}
