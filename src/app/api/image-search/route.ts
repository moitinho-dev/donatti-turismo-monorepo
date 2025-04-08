import { NextResponse } from "next/server"

// Add this line to mark the route as dynamic
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")
  const page = searchParams.get("page") || "1"
  const perPage = searchParams.get("perPage") || "10"

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    // Add more specific search terms for better results
    let enhancedQuery = query

    // Add country context for Brazilian cities
    if (
      query.toLowerCase().includes("rio de janeiro") ||
      query.toLowerCase().includes("são paulo") ||
      query.toLowerCase().includes("curitiba") ||
      query.toLowerCase().includes("florianópolis") ||
      query.toLowerCase().includes("salvador") ||
      query.toLowerCase().includes("recife") ||
      query.toLowerCase().includes("fortaleza") ||
      query.toLowerCase().includes("porto alegre") ||
      query.toLowerCase().includes("fortaleza") ||
      query.toLowerCase().includes("porto alegre") ||
      query.toLowerCase().includes("natal") ||
      query.toLowerCase().includes("manaus") ||
      query.toLowerCase().includes("brasília") ||
      query.toLowerCase().includes("belo horizonte")
    ) {
      // Add Brazil to the search query for better results
      enhancedQuery = `${query} Brazil travel destination landmark`

      // Add specific landmarks for major cities
      if (query.toLowerCase().includes("rio de janeiro")) {
        // Randomize between different landmarks to get variety
        const landmarks = ["Christ the Redeemer", "Copacabana Beach", "Ipanema", "Sugarloaf Mountain", "Lapa"]
        const randomLandmark = landmarks[Math.floor(Math.random() * landmarks.length)]
        enhancedQuery = `Rio de Janeiro Brazil ${randomLandmark} travel destination`
      } else if (query.toLowerCase().includes("são paulo")) {
        const landmarks = ["Paulista Avenue", "Ibirapuera Park", "MASP", "Municipal Market", "Liberdade"]
        const randomLandmark = landmarks[Math.floor(Math.random() * landmarks.length)]
        enhancedQuery = `São Paulo Brazil ${randomLandmark} travel destination`
      } else if (query.toLowerCase().includes("curitiba")) {
        const landmarks = [
          "Botanical Garden",
          "Oscar Niemeyer Museum",
          "Wire Opera House",
          "Tangua Park",
          "Historic Center",
        ]
        const randomLandmark = landmarks[Math.floor(Math.random() * landmarks.length)]
        enhancedQuery = `Curitiba Brazil ${randomLandmark} travel destination`
      } else if (query.toLowerCase().includes("florianópolis")) {
        const landmarks = [
          "Joaquina Beach",
          "Lagoa da Conceição",
          "Jurerê Beach",
          "Barra da Lagoa",
          "Santo Antônio de Lisboa",
        ]
        const randomLandmark = landmarks[Math.floor(Math.random() * landmarks.length)]
        enhancedQuery = `Florianópolis Brazil ${randomLandmark} travel destination`
      }
    } else if (query.toLowerCase().includes("beach") || query.toLowerCase().includes("praia")) {
      enhancedQuery = `${query} beautiful tropical beach vacation destination`
    } else if (query.toLowerCase().includes("mountain") || query.toLowerCase().includes("montanha")) {
      enhancedQuery = `${query} scenic mountain landscape travel destination`
    } else {
      // For other destinations, add travel context
      enhancedQuery = `${query} travel tourism destination landmark`
    }

    // Add randomization parameter to get different images each time
    const randomParam = Math.floor(Math.random() * 1000)

    // Use Unsplash API to search for images
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(enhancedQuery)}&page=${page}&per_page=${perPage}&random=${randomParam}`,
      {
        headers: {
          Authorization: `Client-ID ${unsplashAccessKey}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`)
    }

    const data = await response.json()

    // If no results, try a more generic search
    if (data.results.length === 0) {
      const fallbackQuery = `${query} travel destination`
      const fallbackResponse = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(fallbackQuery)}&page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: `Client-ID ${unsplashAccessKey}`,
          },
        },
      )

      if (!fallbackResponse.ok) {
        throw new Error(`Unsplash API error: ${fallbackResponse.status}`)
      }

      const fallbackData = await fallbackResponse.json()
      return NextResponse.json(fallbackData)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error searching for images:", error)
    return NextResponse.json({ error: "Failed to search for images" }, { status: 500 })
  }
}
