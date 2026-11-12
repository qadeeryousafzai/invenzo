import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { PlatformRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  // Trust the reverse proxy (Hostinger) so callback origin checks pass when the
  // app runs behind HTTPS termination. AUTH_TRUST_HOST env does the same, but
  // setting it explicitly keeps production login reliable.
  trustHost: true,
  providers: [
    Credentials({
      name: "Email and password",
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = z.object({ email: z.email(), password: z.string().min(1) }).safeParse(raw);
        if (!parsed.success) {
          console.warn("[auth] authorize: invalid credentials shape", { hasEmail: !!raw?.email, hasPassword: !!raw?.password });
          return null;
        }
        const email = parsed.data.email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          console.warn("[auth] authorize: user not found", { email });
          return null;
        }
        if (user.disabledAt) {
          console.warn("[auth] authorize: user disabled", { userId: user.id, disabledAt: user.disabledAt });
          return null;
        }
        if (user.deletedAt) {
          console.warn("[auth] authorize: user deleted", { userId: user.id, deletedAt: user.deletedAt });
          return null;
        }
        if (!user.emailVerified) {
          console.warn("[auth] authorize: email not verified", { userId: user.id, email });
          return null;
        }
        if (!user.passwordHash) {
          console.warn("[auth] authorize: no password hash", { userId: user.id, email });
          return null;
        }
        const passwordValid = await compare(parsed.data.password, user.passwordHash);
        if (!passwordValid) {
          console.warn("[auth] authorize: password mismatch", { userId: user.id, email });
          return null;
        }
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
          if (!hasActiveBusiness) {
            // Diagnostic: check why no active business was found
            const memberships = await prisma.membership.findMany({
              where: { userId: user.id },
              include: { business: { select: { accountStatus: true, subscriptionExpiresAt: true, deletedAt: true } } },
            });
            console.warn("[auth] authorize: no active business", {
              userId: user.id,
              email,
              membershipCount: memberships.length,
              memberships: memberships.map((m) => ({
                status: m.status,
                businessStatus: m.business?.accountStatus,
                subscriptionExpiresAt: m.business?.subscriptionExpiresAt?.toISOString(),
                businessDeletedAt: m.business?.deletedAt?.toISOString(),
              })),
            });
            return null;
          }
        }
        console.info("[auth] authorize: success", { userId: user.id, email, platformRole: user.platformRole });
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
