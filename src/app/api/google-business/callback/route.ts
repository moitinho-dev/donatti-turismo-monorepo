import { NextResponse } from "next/server"
import { exchangeCodeForTokens, upsertRefreshToken } from "@/lib/googleBusiness"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const getBaseUrl = () => {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000"
  const normalized = fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`
  return normalized.replace(/\/$/, "")
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const error = url.searchParams.get("error")

  if (error) {
    return NextResponse.redirect(`${getBaseUrl()}/promos?google=error`)
  }

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 })
  }

  const tokens = await exchangeCodeForTokens(code)
  if (!tokens.refresh_token) {
    return NextResponse.redirect(`${getBaseUrl()}/promos?google=missing_refresh_token`)
  }

  await upsertRefreshToken(tokens.refresh_token)
  return NextResponse.redirect(`${getBaseUrl()}/promos?google=connected`)
}
