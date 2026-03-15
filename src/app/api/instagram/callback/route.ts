import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import {
  exchangeCodeForToken,
  exchangeLongLivedToken,
  getInstagramAccountId,
  upsertConnection,
} from "@/lib/instagram"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.redirect(`${baseUrl}/promos?instagram=error&reason=unauthorized`)
    }

    const code = request.nextUrl.searchParams.get("code")
    const error = request.nextUrl.searchParams.get("error")

    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/promos?instagram=error&reason=${encodeURIComponent(error)}`,
      )
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/promos?instagram=error&reason=no_code`)
    }

    // Exchange code for short-lived token
    const { access_token: shortToken } = await exchangeCodeForToken(code)

    // Exchange for long-lived token (60 days)
    const longLived = await exchangeLongLivedToken(shortToken)
    const expiresAt = new Date(Date.now() + longLived.expires_in * 1000)

    // Discover Instagram Business Account
    const { igUserId, pageName } = await getInstagramAccountId(longLived.access_token)

    // Save connection
    await upsertConnection({
      accessToken: longLived.access_token,
      igUserId,
      pageName,
      tokenExpiresAt: expiresAt,
    })

    return NextResponse.redirect(`${baseUrl}/promos?instagram=connected`)
  } catch (error) {
    console.error("Instagram callback error:", error)
    const reason = error instanceof Error ? error.message : "unknown"
    return NextResponse.redirect(
      `${baseUrl}/promos?instagram=error&reason=${encodeURIComponent(reason)}`,
    )
  }
}
