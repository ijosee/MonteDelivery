'use client';

import type { ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
}

/**
 * Session provider wrapper.
 * With Supabase Auth, session management is handled via cookies and the middleware.
 * This component is kept as a pass-through to avoid breaking the component tree.
 */
export default function SessionProvider({ children }: Props) {
  return <>{children}</>;
}
