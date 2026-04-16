import { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { loginSchema } from '@/lib/validators/auth.schema';
import { prisma } from '@/lib/db';
import { MVP_CONSTANTS } from '@/lib/constants';
import type { UserRole } from '@/generated/prisma/client';

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      authorize: async (credentials) => {
        // 1. Validate with Zod (loginSchema)
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        // 2. Find user by email in DB
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) {
          return null;
        }

        // 3. Check if account is locked (lockedUntil > now)
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('TOO_MANY_ATTEMPTS');
        }

        // 4. Verify password with bcrypt
        const isValidPassword = await compare(password, user.passwordHash);

        if (!isValidPassword) {
          // 5. If wrong password: increment failedLoginAttempts, lock if >= MAX_LOGIN_ATTEMPTS
          const newFailedAttempts = user.failedLoginAttempts + 1;
          const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
            failedLoginAttempts: newFailedAttempts,
          };

          if (newFailedAttempts >= MVP_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
            updateData.lockedUntil = new Date(
              Date.now() + MVP_CONSTANTS.LOCKOUT_DURATION_MINUTES * 60 * 1000
            );
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });

          if (newFailedAttempts >= MVP_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
            throw new Error('TOO_MANY_ATTEMPTS');
          }

          return null;
        }

        // 6. Verify email_verified is not null
        if (!user.emailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        // 7. Reset failedLoginAttempts on success
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
            },
          });
        }

        // 8. Return user { id, name, email, role }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id!;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as UserRole;
      session.user.id = token.id as string;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: MVP_CONSTANTS.SESSION_MAX_AGE_DAYS * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
};
