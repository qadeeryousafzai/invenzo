import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { PlatformRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = z.object({ email: z.email(), password: z.string().min(1) }).safeParse(raw);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
        if (!user || user.disabledAt || user.deletedAt || !user.emailVerified || !user.passwordHash) return null;
        if (!(await compare(parsed.data.password, user.passwordHash))) return null;
        if (user.platformRole !== PlatformRole.SUPER_ADMIN) {
          const now = new Date();
          const hasActiveBusiness = await prisma.membership.count({
            where: {
              userId: user.id,
              status: "ACTIVE",
              business: {
                deletedAt: null,
                subscriptionExpiresAt: { gt: now },
                OR: [
                  { accountStatus: "ACTIVE" },
                  { accountStatus: "TEMPORARILY_BLOCKED", statusUntil: { lte: now } },
                ],
              },
            },
          });
          if (!hasActiveBusiness) return null;
        }
        return { id: user.id, name: user.name, email: user.email, platformRole: user.platformRole, tokenVersion: user.tokenVersion };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.platformRole = user.platformRole ?? PlatformRole.USER;
        token.tokenVersion = user.tokenVersion ?? 0;
      }
      if (token.sub && typeof token.tokenVersion === "number") {
        const current = await prisma.user.findUnique({ where: { id: token.sub }, select: { disabledAt: true, deletedAt: true, tokenVersion: true, platformRole: true } });
        if (!current || current.disabledAt || current.deletedAt || current.tokenVersion !== token.tokenVersion) {
          delete token.sub;
          delete token.platformRole;
        } else {    
          const now = new Date();
          const hasActiveBusiness = current.platformRole === PlatformRole.SUPER_ADMIN || await prisma.membership.count({
            where: {
              userId: token.sub,
              status: "ACTIVE",
              business: {
                deletedAt: null,
                subscriptionExpiresAt: { gt: now },
                OR: [
                  { accountStatus: "ACTIVE" },
                  { accountStatus: "TEMPORARILY_BLOCKED", statusUntil: { lte: now } },
                ],
              },
            },
          }) > 0;
          if (!hasActiveBusiness) {
            delete token.sub;
            delete token.platformRole;
          } else {
            token.platformRole = current.platformRole;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub && token.platformRole) {
        session.user.id = token.sub;
        session.user.platformRole = token.platformRole as PlatformRole;
      }
      return session;
    },
  },
});
