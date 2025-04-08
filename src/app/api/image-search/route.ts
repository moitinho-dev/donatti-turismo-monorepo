import { type NextRequest, NextResponse } from "next/server"

// Add this line to mark the route as dynamic
export const dynamic = "force-dynamic"

// Unsplash API credentials
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || ""

export async function GET(request: NextRequest) {
  try {
    // Get the search query from URL parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")
    const page = searchParams.get("page") || "1" // Add page parameter for variety

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    // If we have an Unsplash API key, use it
    if (UNSPLASH_ACCESS_KEY) {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&page=${page}&orientation=landscape&content_filter=high`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.statusText}`)
      }

      const data = await response.json()

      // Randomize results to avoid repetition
      const shuffledResults = [...data.results].sort(() => 0.5 - Math.random())

      return NextResponse.json({
        results: shuffledResults.slice(0, 5),
      })
    }
    // Fallback to Pexels API if no Unsplash key
    else {
      const PEXELS_API_KEY = process.env.PEXELS_API_KEY || ""

      if (PEXELS_API_KEY) {
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
          {
            headers: {
              Authorization: PEXELS_API_KEY,
            },
          },
        )

        if (!response.ok) {
          throw new Error(`Pexels API error: ${response.statusText}`)
        }

        const data = await response.json()

        // Transform Pexels response to match Unsplash format
        const transformedData = {
          results: data.photos.map((photo: any) => ({
            id: photo.id,
            urls: {
              raw: photo.src.original,
              full: photo.src.original,
              regular: photo.src.large,
              small: photo.src.medium,
              thumb: photo.src.small,
            },
            user: {
              name: photo.photographer,
              links: {
                html: photo.photographer_url,
              },
            },
          })),
        }

        return NextResponse.json(transformedData)
      }

      // If no API keys are available, use a fallback with placeholder images
      return NextResponse.json({
        results: [
          {
            id: "fallback1",
            urls: {
              regular: `https://source.unsplash.com/1600x900/?${encodeURIComponent(query)}`,
            },
            user: {
              name: "Unsplash",
              links: {
                html: "https://unsplash.com",
              },
            },
          },
        ],
      })
    }
  } catch (error) {
    console.error("Error in image search API:", error)
    return NextResponse.json({ error: "Failed to search for images" }, { status: 500 })
  }
}
