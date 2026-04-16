// src/proxy.ts — Auth + RBAC + Security Headers
// Next.js 16: middleware.ts is deprecated, renamed to proxy.ts
import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';

const PROTECTED_ROUTES: Record<string, string[]> = {
  '/carrito':  ['CUSTOMER'],
  '/checkout': ['CUSTOMER'],
  '/pedidos':  ['CUSTOMER'],
  '/perfil':   ['CUSTOMER'],
  '/panel':    ['RESTAURANT_OWNER', 'RESTAURANT_STAFF'],
  '/admin':    ['ADMIN'],
};

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Apply security headers to all responses
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Check protected routes
  for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      if (!session?.user) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
      if (!roles.includes(session.user.role)) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      break;
    }
  }

  return response;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - allergen-icons (public static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|allergen-icons).*)',
  ],
};
