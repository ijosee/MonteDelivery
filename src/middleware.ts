/**
 * Next.js middleware for authentication and RBAC route protection.
 *
 * 1. Refreshes the Supabase auth session via updateSession().
 * 2. For role-protected routes, fetches the user's role from the `users` table
 *    and redirects to / if the user lacks permission.
 * 3. Sets security headers on every response.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/** Route prefixes that require the ADMIN role. */
const ADMIN_PATHS = ['/admin'];

/** Route prefixes that require RESTAURANT_OWNER or RESTAURANT_STAFF roles. */
const PANEL_PATHS = ['/panel'];

/**
 * Check if a pathname starts with any of the given prefixes.
 */
function matchesAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Append security headers to a response.
 */
function setSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  );
}

export async function middleware(request: NextRequest) {
  // --- 1. Refresh the Supabase auth session ---
  const { updateSession } = await import('@/lib/supabase/middleware');
  const response = await updateSession(request);

  // If updateSession returned a redirect (e.g. to /auth/login), honour it immediately.
  if (response.headers.get('location')) {
    return response;
  }

  // --- 2. Role-based route protection ---
  const { pathname } = request.nextUrl;
  const needsAdmin = matchesAny(pathname, ADMIN_PATHS);
  const needsPanel = matchesAny(pathname, PANEL_PATHS);

  if (needsAdmin || needsPanel) {
    // We need to check the user's role. Create a Supabase client that reads
    // cookies from the *request* (the same way updateSession does).
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Should not happen (updateSession already redirects), but guard anyway.
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }

    // Fetch the role from the users table.
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role as string | undefined;

    // Admin-only routes: only ADMIN can access.
    if (needsAdmin && role !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Panel routes: only RESTAURANT_OWNER and RESTAURANT_STAFF can access.
    if (
      needsPanel &&
      role !== 'RESTAURANT_OWNER' &&
      role !== 'RESTAURANT_STAFF'
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // --- 3. Security headers ---
  setSecurityHeaders(response);

  return response;
}

export const config = {
  matcher: [
    /*
     * Only run middleware on page routes, not on:
     * - _next (all static/compiled assets)
     * - api routes (handled by their own auth)
     * - static files (images, fonts, sw.js, manifest, etc.)
     * - login and auth callback pages
     */
    '/((?!_next|api|favicon\\.ico|sw\\.js|manifest\\.webmanifest|icon-.*\\.png|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.webp|login|auth).*)',
  ],
};
