/**
 * Auth callback route handler.
 *
 * Handles the code exchange for Supabase Auth flows (e.g. password recovery).
 * After exchanging the code for a session, redirects to the appropriate page.
 *
 * Validates: Requirement 6.2
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function buildRedirectUrl(
  request: Request,
  origin: string,
  path: string
): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return `${origin}${path}`;
  }

  if (forwardedHost) {
    return `https://${forwardedHost}${path}`;
  }

  return `${origin}${path}`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // For password recovery flows, redirect to the reset password page
      const destination =
        type === "recovery" ? "/auth/reset-password" : next;

      return NextResponse.redirect(
        buildRedirectUrl(request, origin, destination)
      );
    }
  }

  // If code exchange fails or no code provided, redirect to login with error
  return NextResponse.redirect(
    buildRedirectUrl(request, origin, "/auth/login?error=auth_callback_failed")
  );
}
