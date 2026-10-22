import { NextRequest, NextResponse } from "next/server"
import { findDestination, getImageQueries } from "@/lib/destinations"
import { IMAGE_ORIENTATIONS, searchDestinationImages, type ImageOrientation } from "@/lib/imageSearch"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 30)
  const orientationParam = searchParams.get("orientation") as ImageOrientation | null
  const orientation: ImageOrientation =
    orientationParam && IMAGE_ORIENTATIONS.includes(orientationParam) ? orientationParam : "portrait"

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    const results = await searchDestinationImages(query, limit, orientation)

    return NextResponse.json({
      results,
      total: results.length,
      query: getImageQueries(query)[0] || query,
      destination: findDestination(query)?.name || null,
    })
  } catch (error) {
    console.error("Error searching images:", error)
    return NextResponse.json({ error: "Failed to search images" }, { status: 500 })
  }
}
