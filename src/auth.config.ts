import type { NextAuthConfig } from 'next-auth';

/**
 * Edge/proxy-safe part of the auth config (no DB access). `src/auth.ts` adds the credentials provider.
 */
export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name ?? '';
        session.user.email = token.email ?? '';
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
