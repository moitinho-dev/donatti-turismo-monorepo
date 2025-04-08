import { type NextRequest, NextResponse } from "next/server"

// Add this line to mark the route as dynamic
export const dynamic = "force-dynamic"

// Unsplash API credentials
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "YOUR_UNSPLASH_ACCESS_KEY"

// Improve the image search to get more relevant and varied destination images
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

    // Add specific landmarks or terms for popular destinations to get better results
    const destinationKeywords: Record<string, string> = {
      "Rio de Janeiro": "Rio de Janeiro Christ Redeemer Copacabana",
      "São Paulo": "São Paulo Avenida Paulista skyline",
      Curitiba: "Curitiba Jardim Botânico Ópera de Arame",
      Florianópolis: "Florianópolis beach Jurerê",
      Salvador: "Salvador Pelourinho Bahia",
      Fortaleza: "Fortaleza beach Ceará",
      Natal: "Natal Ponta Negra beach",
      "Porto Alegre": "Porto Alegre Guaíba sunset",
      Gramado: "Gramado Christmas",
      "Foz do Iguaçu": "Iguazu Falls waterfall",
      Manaus: "Manaus Amazon Opera House",
      Brasília: "Brasília Cathedral Congress",
      Recife: "Recife Olinda beach",
      "Porto de Galinhas": "Porto de Galinhas natural pools",
      Maceió: "Maceió beaches Alagoas",
      "João Pessoa": "João Pessoa Paraíba beaches",
      "Belo Horizonte": "Belo Horizonte Pampulha",
    }

    // Check if the query contains any of our destination keywords
    for (const [destination, keywords] of Object.entries(destinationKeywords)) {
      if (query.toLowerCase().includes(destination.toLowerCase())) {
        enhancedQuery = keywords
        break
      }
    }

    // If no specific match, add general travel terms to improve results
    if (enhancedQuery === query) {
      enhancedQuery = `${query} city travel landmark tourism`
    }

    // Add randomization to get varied results
    const randomOffset = Math.floor(Math.random() * 10) + 1
    const randomPage = Number(page) + randomOffset

    // Use Unsplash API
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(enhancedQuery)}&per_page=10&page=${randomPage}&orientation=landscape&content_filter=high`,
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
    } catch (error) {
      console.error("Error with Unsplash API:", error)

      // Fallback to placeholder images if Unsplash API fails
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
          {
            id: "fallback2",
            urls: {
              regular: `https://source.unsplash.com/1600x900/?${encodeURIComponent(enhancedQuery)}&sig=2`,
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
