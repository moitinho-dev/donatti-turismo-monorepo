import { type NextRequest, NextResponse } from "next/server"

// Mark the route as dynamic to prevent caching
export const dynamic = "force-dynamic"

// API credentials
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || ""
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || ""
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY || ""

// Brazilian destinations mapping to improve search accuracy
const destinationMapping: Record<string, string> = {
  // Northeast
  natal: "Natal beach Rio Grande do Norte Brazil tourism",
  recife: "Recife Pernambuco Brazil beach tourism",
  fortaleza: "Fortaleza Ceará Brazil beach tourism",
  salvador: "Salvador Bahia Brazil tourism",
  maceió: "Maceió Alagoas Brazil beach tourism",
  maceio: "Maceió Alagoas Brazil beach tourism",
  "joão pessoa": "João Pessoa Paraíba Brazil beach tourism",
  "joao pessoa": "João Pessoa Paraíba Brazil beach tourism",
  aracaju: "Aracaju Sergipe Brazil beach tourism",
  "são luís": "São Luís Maranhão Brazil tourism",
  "sao luis": "São Luís Maranhão Brazil tourism",
  teresina: "Teresina Piauí Brazil tourism",
  "porto de galinhas": "Porto de Galinhas Pernambuco Brazil beach tourism",
  "porto seguro": "Porto Seguro Bahia Brazil beach tourism",
  pipa: "Praia de Pipa Rio Grande do Norte Brazil beach tourism",
  maragogi: "Maragogi Alagoas Brazil beach tourism",
  jericoacoara: "Jericoacoara Ceará Brazil beach tourism",
  "fernando de noronha": "Fernando de Noronha Brazil island paradise tourism",

  // South
  florianópolis: "Florianópolis Santa Catarina Brazil beach tourism",
  florianopolis: "Florianópolis Santa Catarina Brazil beach tourism",
  "porto alegre": "Porto Alegre Rio Grande do Sul Brazil tourism",
  gramado: "Gramado Rio Grande do Sul Brazil tourism",
  curitiba: "Curitiba Paraná Brazil tourism",
  "foz do iguaçu": "Foz do Iguaçu Paraná Brazil waterfall tourism",
  "foz do iguacu": "Foz do Iguaçu Paraná Brazil waterfall tourism",
  "balneário camboriú": "Balneário Camboriú Santa Catarina Brazil beach tourism",
  "balneario camboriu": "Balneário Camboriú Santa Catarina Brazil beach tourism",

  // Southeast
  "rio de janeiro": "Rio de Janeiro Brazil beach Copacabana tourism",
  "são paulo": "São Paulo Brazil city tourism",
  "sao paulo": "São Paulo Brazil city tourism",
  "belo horizonte": "Belo Horizonte Minas Gerais Brazil tourism",
  vitória: "Vitória Espírito Santo Brazil tourism",
  vitoria: "Vitória Espírito Santo Brazil tourism",
  búzios: "Búzios Rio de Janeiro Brazil beach tourism",
  buzios: "Búzios Rio de Janeiro Brazil beach tourism",
  paraty: "Paraty Rio de Janeiro Brazil historical tourism",
  "campos do jordão": "Campos do Jordão São Paulo Brazil mountain tourism",
  "campos do jordao": "Campos do Jordão São Paulo Brazil mountain tourism",

  // Central
  brasília: "Brasília Federal District Brazil capital tourism",
  brasilia: "Brasília Federal District Brazil capital tourism",
  goiânia: "Goiânia Goiás Brazil tourism",
  goiania: "Goiânia Goiás Brazil tourism",
  cuiabá: "Cuiabá Mato Grosso Brazil tourism",
  cuiaba: "Cuiabá Mato Grosso Brazil tourism",
  "campo grande": "Campo Grande Mato Grosso do Sul Brazil tourism",
  bonito: "Bonito Mato Grosso do Sul Brazil ecotourism",
  "caldas novas": "Caldas Novas Goiás Brazil hot springs tourism",

  // North
  manaus: "Manaus Amazonas Brazil Amazon tourism",
  belém: "Belém Pará Brazil tourism",
  belem: "Belém Pará Brazil tourism",
  palmas: "Palmas Tocantins Brazil tourism",
  "rio branco": "Rio Branco Acre Brazil tourism",
  "porto velho": "Porto Velho Rondônia Brazil tourism",
  "boa vista": "Boa Vista Roraima Brazil tourism",
  macapá: "Macapá Amapá Brazil tourism",
  macapa: "Macapá Amapá Brazil tourism",

  // International popular destinations
  cancun: "Cancun Mexico beach resort tourism",
  miami: "Miami Florida USA beach tourism",
  orlando: "Orlando Florida USA Disney tourism",
  "nova york": "New York City USA tourism",
  "las vegas": "Las Vegas Nevada USA tourism",
  paris: "Paris France Eiffel Tower tourism",
  londres: "London England UK tourism",
  roma: "Rome Italy Colosseum tourism",
  madri: "Madrid Spain tourism",
  lisboa: "Lisbon Portugal tourism",
  tóquio: "Tokyo Japan tourism",
  toquio: "Tokyo Japan tourism",
  dubai: "Dubai UAE tourism",
  "buenos aires": "Buenos Aires Argentina tourism",
  santiago: "Santiago Chile tourism",
}

export async function GET(request: NextRequest) {
  try {
    // Get the search query from URL parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    // Process the query to improve search results
    const processedQuery = processQuery(query)
    console.log(`Original query: "${query}" -> Processed query: "${processedQuery}"`)

    // Helper function to randomly select an image from results
    const selectRandomImage = (results: any[]) => {
      if (results && results.length > 0) {
        const randomIndex = Math.floor(Math.random() * results.length)
        return results[randomIndex]
      }
      return null
    }

    // Try all available image APIs with fallbacks
    let selectedImage = null

    // 1. Try Freepik API first (if API key is available)
    if (FREEPIK_API_KEY) {
      try {
        const freepikImage = await searchFreepik(processedQuery)
        if (freepikImage) {
          selectedImage = freepikImage
        }
      } catch (error) {
        console.error("Freepik API error:", error)
      }
    }

    // 2. Fallback to Unsplash API if Freepik fails or no API key
    if (!selectedImage && UNSPLASH_ACCESS_KEY) {
      try {
        const unsplashImage = await searchUnsplash(processedQuery)
        if (unsplashImage) {
          selectedImage = unsplashImage
        }
      } catch (error) {
        console.error("Unsplash API error:", error)
      }
    }

    // 3. Fallback to Pexels API if Unsplash fails or no API key
    if (!selectedImage && PEXELS_API_KEY) {
      try {
        const pexelsImage = await searchPexels(processedQuery)
        if (pexelsImage) {
          selectedImage = pexelsImage
        }
      } catch (error) {
        console.error("Pexels API error:", error)
      }
    }

    // 4. Final fallback with placeholder images
    if (!selectedImage) {
      selectedImage = {
        id: "fallback1",
        urls: {
          raw: `https://source.unsplash.com/1600x900/?${encodeURIComponent(processedQuery)}&random=${Math.random()}`,
          full: `https://source.unsplash.com/1600x900/?${encodeURIComponent(processedQuery)}&random=${Math.random()}`,
          regular: `https://source.unsplash.com/1600x900/?${encodeURIComponent(processedQuery)}&random=${Math.random()}`,
          small: `https://source.unsplash.com/800x600/?${encodeURIComponent(processedQuery)}&random=${Math.random()}`,
          thumb: `https://source.unsplash.com/400x300/?${encodeURIComponent(processedQuery)}&random=${Math.random()}`,
        },
        user: {
          name: "Unsplash",
          links: {
            html: "https://unsplash.com",
          },
        },
      }
    }

    return NextResponse.json({ results: [selectedImage] })
  } catch (error) {
    console.error("Error in image search API:", error)
    return NextResponse.json({ error: "Failed to search for images" }, { status: 500 })
  }
}

// Process query to improve search results
function processQuery(query: string): string {
  // Convert to lowercase for case-insensitive matching
  const lowerQuery = query.toLowerCase().trim()

  // Check if we have a specific mapping for this destination
  if (destinationMapping[lowerQuery]) {
    return destinationMapping[lowerQuery]
  }

  // For partial matches, find the closest match
  for (const [key, value] of Object.entries(destinationMapping)) {
    if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
      return value
    }
  }

  // If no mapping found, add context to improve results
  if (lowerQuery.length > 0) {
    // Check if it might be a Brazilian destination
    if (/[áàâãéèêíìîóòôõúùûç]/i.test(lowerQuery)) {
      return `${query} Brazil tourism travel destination`
    }
    return `${query} tourism travel destination landscape`
  }

  return query
}

// Search Freepik API
async function searchFreepik(query: string) {
  // Introduce randomness by selecting a random page
  const randomPage = Math.floor(Math.random() * 10) + 1

  const response = await fetch(
    `https://api.freepik.com/v1/resources?term=${encodeURIComponent(
      query,
    )}&page=${randomPage}&limit=10&filters[content_type]=photo&filters[orientation]=landscape&filters[min_width]=1920&filters[min_height]=1080`,
    {
      headers: {
        "x-freepik-api-key": FREEPIK_API_KEY,
        "Accept-Language": "en-US",
      },
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(`Freepik API error: ${response.statusText}`)
  }

  const data = await response.json()

  // Filter for high-quality images
  const highQualityResults = data.data.filter((resource: any) => {
    const hasHighResolution = resource.image?.width >= 1920 && resource.image?.height >= 1080
    return hasHighResolution
  })

  // Transform Freepik response to match the expected format
  const transformedResults = (highQualityResults.length > 0 ? highQualityResults : data.data).map((resource: any) => ({
    id: resource.id,
    urls: {
      raw: resource.image?.source?.url || "",
      full: resource.image?.source?.url || "",
      regular: resource.image?.source?.url || "",
      small: resource.image?.source?.url || "",
      thumb: resource.image?.source?.url || "",
    },
    user: {
      name: resource.author?.name || "Freepik",
      links: {
        html: resource.author?.url || "https://www.freepik.com",
      },
    },
  }))

  return selectRandomImage(transformedResults)
}

// Search Unsplash API
async function searchUnsplash(query: string) {
  const randomPage = Math.floor(Math.random() * 5) + 1

  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query,
    )}&per_page=10&orientation=landscape&page=${randomPage}&content_filter=high`,
    {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.statusText}`)
  }

  const data = await response.json()

  // Filter for high-quality images
  const highQualityResults = data.results.filter((photo: any) => {
    const hasHighResolution = photo.width >= 1920 && photo.height >= 1080
    return hasHighResolution
  })

  return selectRandomImage(highQualityResults.length > 0 ? highQualityResults : data.results)
}

// Search Pexels API
async function searchPexels(query: string) {
  const randomPage = Math.floor(Math.random() * 5) + 1

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(
      query,
    )}&per_page=10&orientation=landscape&page=${randomPage}&size=large`,
    {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.statusText}`)
  }

  const data = await response.json()

  // Filter for high-quality images
  const highQualityPhotos = data.photos.filter((photo: any) => {
    return photo.width >= 1920 && photo.height >= 1080
  })

  const transformedData = {
    results: (highQualityPhotos.length > 0 ? highQualityPhotos : data.photos).map((photo: any) => ({
      id: photo.id,
      urls: {
        raw: photo.src.original,
        full: photo.src.original,
        regular: photo.src.large2x,
        small: photo.src.large,
        thumb: photo.src.medium,
      },
      user: {
        name: photo.photographer,
        links: {
          html: photo.photographer_url,
        },
      },
    })),
  }

  return selectRandomImage(transformedData.results)
}

// Helper function to randomly select an image from results
function selectRandomImage(results: any[]) {
  if (results && results.length > 0) {
    const randomIndex = Math.floor(Math.random() * results.length)
    return results[randomIndex]
  }
  return null
}
