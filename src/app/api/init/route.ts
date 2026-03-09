import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"
import prisma from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Check if any users exist, create defaults if not
    const userCount = await prisma.user.count()

    if (userCount === 0) {
      await prisma.user.createMany({
        data: [
          {
            email: "admin@donatti.com",
            name: "Administrador",
            password: "admin@123",
            role: "admin",
          },
          {
            email: "agente@donatti.com",
            name: "Agente de Turismo",
            password: "agente@123",
            role: "agent",
          },
        ],
      })
      console.log("Database initialized with default users")
    }

    // Check authentication (optional for this route)
    const session = await getServerSession(authOptions)

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      authenticated: !!session,
    })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json({ error: "Error initializing database" }, { status: 500 })
  }
}
