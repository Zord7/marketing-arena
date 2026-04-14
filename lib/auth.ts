import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          rankingPoints: user.rankingPoints,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Obsługa logowania przez Google
      if (account?.provider === "google") {
        const email = user.email!;
        const existing = await prisma.user.findUnique({ where: { email } });

        if (!existing) {
          // Nowy użytkownik przez Google — generujemy username z e-maila
          const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").slice(0, 18);
          let username = baseUsername;
          let i = 1;
          while (await prisma.user.findUnique({ where: { username } })) {
            username = `${baseUsername}${i++}`;
          }
          await prisma.user.create({
            data: {
              email,
              username,
              passwordHash: "", // brak hasła dla kont Google
              image: user.image ?? null,
            },
          });
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.username = user.name;
        token.rankingPoints = (user as any).rankingPoints ?? 0;
      }
      // Przy Google — pobierz dane z bazy po emailu
      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
          token.rankingPoints = dbUser.rankingPoints;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.rankingPoints = token.rankingPoints as number;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
