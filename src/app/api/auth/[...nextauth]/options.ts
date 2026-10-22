import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions, DefaultSession } from "next-auth"
import prisma from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/passwords"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userAgent: { label: "User Agent", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const email = credentials.email.trim()
          const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
          })

          const { valid, needsRehash } = await verifyPassword(credentials.password, user?.password)
          if (user && valid) {
            // Contas antigas tinham a senha em texto puro: regrava com hash no primeiro login
            if (needsRehash) {
              await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(credentials.password) } })
            }
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            }
          }
        } catch (error) {
          console.error("Error during authentication:", error)
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          email: token.email as string,
          name: token.name as string,
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}
