import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import { getConnection } from "@/lib/instagram"

export const runtime = "nodejs"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ connected: false })
    }

    const connection = await getConnection()
    if (!connection) {
      return NextResponse.json({ connected: false })
    }

    const expired = connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()

    return NextResponse.json({
      connected: !expired,
      pageName: connection.pageName || "",
      expired: Boolean(expired),
    })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
