import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Legacy API - redirects to new promos API
// This route is deprecated, use /api/promos/public instead
export async function GET() {
  // Return empty array since we now use database-backed promos
  // The RealTimePromos component already falls back to /api/promos/public
  return NextResponse.json([])
}
