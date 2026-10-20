import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticateCredentials } from "@/lib/auth/login";
import { activeSession, revokeAuthSession, SESSION_SECONDS } from "@/lib/auth/session";
import type { Role } from "@/lib/auth/permissions";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: SESSION_SECONDS },
  useSecureCookies: process.env.NODE_ENV === "production",
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: { type: "email", label: "Email" }, password: { type: "password", label: "Contraseña" } },
      authorize: authenticateCredentials,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.sessionId = user.sessionId;
      }
      if (!token.sub || typeof token.sessionId !== "string") return null;
      const current = await activeSession(token.sessionId, token.sub);
      if (!current) return null;
      token.role = current.rol;
      token.name = current.nombre;
      token.email = current.email;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role as Role;
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message && typeof message.token?.sessionId === "string") {
        await revokeAuthSession(message.token.sessionId);
      }
    },
  },
});
