// sentry.client.config.ts
// Sentry client-side configuration
// Requisito: 22.8

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN,

  // Performance monitoring sample rate (adjust for production)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Session replay for debugging (production only)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1 : 0,

  // Only enable in production or when DSN is explicitly set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN || !!process.env.SENTRY_DSN,

  // Environment tag
  environment: process.env.NODE_ENV ?? 'development',

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    'ResizeObserver loop',
    // Network errors from user navigation
    'AbortError',
    'TypeError: Failed to fetch',
    'TypeError: NetworkError',
  ],
});
