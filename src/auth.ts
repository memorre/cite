import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Note: we don't also augment "next-auth/jwt" here — once "next-auth"'s
// main entry is imported in this file, TypeScript's module-augmentation
// resolution for the "next-auth/jwt" subpath (a known quirk with this
// beta + "bundler" moduleResolution) stops finding the module. The JWT
// callbacks below use a local cast instead.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      const t = token as typeof token & { id: string };
      if (user) {
        t.id = user.id as string;
      }
      return t;
    },
    session({ session, token }) {
      const t = token as typeof token & { id: string };
      session.user.id = t.id;
      return session;
    },
  },
});
