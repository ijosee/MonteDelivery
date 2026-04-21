/**
 * Supabase middleware utility — refreshes the auth session on every request
 * and redirects unauthenticated users away from protected routes.
 *
 * Validates: Requirements 1.1, 7.1
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Public paths that do NOT require authentication.
 * Auth pages, the landing page, API auth routes, and static/public assets.
 */
const PUBLIC_PATHS = new Set([
  "/",
  "/auth/login",
  "/auth/registro",
  "/auth/reset-password",
  "/auth/callback",
  "/como-funciona",
  "/restaurante",
]);

const PUBLIC_PATH_PREFIXES = [
  "/api/auth/",
  "/auth/",
  "/restaurante/",
  "/como-funciona/",
];

/**
 * Returns `true` when the given pathname is publicly accessible
 * (no authentication required).
 */
function isPublicRoute(pathname: string): boolean {
  // Exact matches
  if (PUBLIC_PATHS.has(pathname)) return true;

  // Prefix matches (nested public routes)
  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)))
    return true;

  // Next.js internals, static assets, and public files
  const STATIC_EXT =
    /\.(svg|png|jpg|jpeg|webp|gif|ico|css|js|woff2?|ttf|eot|map|txt|xml|json|webmanifest)$/;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/favicon") ||
    STATIC_EXT.exec(pathname)
  )
    return true;

  return false;
}

/**
 * Refreshes the Supabase Auth session on every request.
 * If the user is not authenticated and the route is protected,
 * redirects to `/auth/login`.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and supabase.auth.getUser().
  // A simple mistake could make it very hard to debug issues with users being
  // randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicRoute(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
