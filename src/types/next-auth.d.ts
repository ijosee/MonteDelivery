import { UserRole } from '@/generated/prisma/client';

declare module 'next-auth' {
  interface User {
    role: UserRole;
  }
  interface Session {
    user: User & {
      id: string;
      role: UserRole;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role: UserRole;
    id: string;
  }
}
