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

    // Enhance the search query to get better destination images
    let enhancedQuery = query

    // Extract the main destination name (remove any descriptive text)
    const destinationName = query.split(" ")[0]

    // Add specific terms for better travel/destination images
    if (query.toLowerCase().includes("cidade") || query.toLowerCase().includes("city")) {
      enhancedQuery = `${destinationName} city skyline tourism`
    } else if (query.toLowerCase().includes("praia") || query.toLowerCase().includes("beach")) {
      enhancedQuery = `${destinationName} beach tourism vacation`
    } else {
      // Default enhancement for destinations
      enhancedQuery = `${destinationName} tourism landmark travel destination`
    }

    // Add specific enhancements for popular Brazilian destinations
    const brazilianDestinations: Record<string, string> = {
      rio: "Rio de Janeiro Christ Redeemer Copacabana",
      "são paulo": "São Paulo Avenida Paulista skyline",
      salvador: "Salvador Bahia Pelourinho historic",
      fortaleza: "Fortaleza beach Ceará",
      recife: "Recife Pernambuco historic",
      natal: "Natal Rio Grande do Norte beaches",
      "porto alegre": "Porto Alegre Rio Grande do Sul",
      curitiba: "Curitiba Jardim Botânico Paraná",
      manaus: "Manaus Amazon Opera House",
      brasília: "Brasília Cathedral Congress",
      florianópolis: "Florianópolis beaches Santa Catarina",
      gramado: "Gramado Rio Grande do Sul tourism",
      "porto seguro": "Porto Seguro Bahia beaches",
      maceió: "Maceió Alagoas beaches",
      "joão pessoa": "João Pessoa Paraíba beaches",
      "campo grande": "Campo Grande Mato Grosso do Sul",
    }

    // Check if the query contains any of the Brazilian destinations
    for (const [destination, enhancement] of Object.entries(brazilianDestinations)) {
      if (query.toLowerCase().includes(destination.toLowerCase())) {
        enhancedQuery = enhancement
        break
      }
    }

    // If we have an Unsplash API key, use it
    if (UNSPLASH_ACCESS_KEY) {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(enhancedQuery)}&per_page=10&page=${page}&orientation=landscape&content_filter=high`,
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
        originalQuery: query,
        enhancedQuery: enhancedQuery,
      })
    }
    // Fallback to Pexels API if no Unsplash key
    else {
      const PEXELS_API_KEY = process.env.PEXELS_API_KEY || ""

      if (PEXELS_API_KEY) {
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(enhancedQuery)}&per_page=5&orientation=landscape`,
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
          originalQuery: query,
          enhancedQuery: enhancedQuery,
        }

        return NextResponse.json(transformedData)
      }

      // If no API keys are available, use a fallback with placeholder images
      return NextResponse.json({
        results: [
          {
            id: "fallback1",
            urls: {
              regular: `https://source.unsplash.com/1600x900/?${encodeURIComponent(enhancedQuery)}`,
            },
            user: {
              name: "Unsplash",
              links: {
                html: "https://unsplash.com",
              },
            },
          },
        ],
        originalQuery: query,
        enhancedQuery: enhancedQuery,
      })
    }
  } catch (error) {
    console.error("Error in image search API:", error)
    return NextResponse.json({ error: "Failed to search for images" }, { status: 500 })
  }
}
