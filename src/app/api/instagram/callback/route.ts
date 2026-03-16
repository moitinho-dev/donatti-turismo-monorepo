import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import {
  exchangeCodeForToken,
  exchangeLongLivedToken,
  getInstagramUserInfo,
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

    // Step 1: Exchange code for short-lived token (Instagram Login flow)
    const { access_token: shortToken, user_id } = await exchangeCodeForToken(code)

    // Step 2: Exchange for long-lived token (60 days)
    const longLived = await exchangeLongLivedToken(shortToken)
    const expiresAt = new Date(Date.now() + longLived.expires_in * 1000)

    // Step 3: Get user info (username, name)
    const userInfo = await getInstagramUserInfo(longLived.access_token, String(user_id))

    // Step 4: Save connection
    await upsertConnection({
      accessToken: longLived.access_token,
      igUserId: String(user_id),
      pageName: userInfo.username || userInfo.name || null,
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
