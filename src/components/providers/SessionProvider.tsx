'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
}

/**
 * Client-side SessionProvider wrapper for next-auth.
 * Wraps the app to provide session context to client components.
 */
export default function SessionProvider({ children }: Props) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
