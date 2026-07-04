import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions, DefaultSession } from "next-auth"
import prisma from "@/lib/db"

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
          // Initialize database with default users if needed
          await initializeDatabaseIfNeeded()

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          // Verify password (simple comparison for now - consider bcrypt in production)
          if (user && user.password === credentials.password) {
            // Return user data for session
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
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

// Helper function to initialize database with default users if needed
async function initializeDatabaseIfNeeded() {
  try {
    // Check if any users exist
    const userCount = await prisma.user.count()

    if (userCount === 0) {
      // Create default admin user
      await prisma.user.create({
        data: {
          email: "admin@donatti.com",
          name: "Administrador",
          password: "admin@123",
          role: "admin",
        },
      })

      // Create default agent user
      await prisma.user.create({
        data: {
          email: "agente@donatti.com",
          name: "Agente de Turismo",
          password: "agente@123",
          role: "agent",
        },
      })

      console.log("Database initialized with default users")
    }
  } catch (error) {
    console.error("Error initializing database:", error)
  }
}

