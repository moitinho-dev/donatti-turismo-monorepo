import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"
import { initializeRedis } from "@/lib/redis"

// Add this line to mark the route as dynamic
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Initialize Redis without requiring authentication first
    const initialized = await initializeRedis()

    if (!initialized) {
      return NextResponse.json({ error: "Failed to initialize Redis" }, { status: 500 })
    }

    // Now check authentication (optional for this route)
    const session = await getServerSession(authOptions)

    return NextResponse.json({
      success: true,
      message: "Redis initialized successfully",
      authenticated: !!session,
    })
  } catch (error) {
    console.error("Error initializing Redis:", error)
    return NextResponse.json({ error: "Error initializing Redis" }, { status: 500 })
  }
}
