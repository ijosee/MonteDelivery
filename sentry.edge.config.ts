// sentry.edge.config.ts
// Sentry edge runtime configuration (middleware, edge API routes)
// Requisito: 22.8

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance monitoring sample rate
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Only enable in production or when DSN is explicitly set
  enabled: !!process.env.SENTRY_DSN,

  // Environment tag
  environment: process.env.NODE_ENV ?? 'development',
});
