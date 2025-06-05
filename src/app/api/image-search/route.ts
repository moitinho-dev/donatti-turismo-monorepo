import { type NextRequest, NextResponse } from "next/server"
import { createApi } from "unsplash-js"
import nodeFetch from "node-fetch"

// Mark the route as dynamic to prevent caching
export const dynamic = "force-dynamic"

// API credentials
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || ""
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || ""
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY || ""
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || ""

// Inicializa a API do Unsplash usando a biblioteca oficial
const unsplashApi = createApi({
  accessKey: UNSPLASH_ACCESS_KEY,
  fetch: nodeFetch as unknown as typeof fetch,
})

// Brazilian regions and states mapping for automatic classification
const brazilianRegions: Record<string, string[]> = {
  northeast: [
    "alagoas",
    "bahia",
    "ceará",
    "ceara",
    "maranhão",
    "maranhao",
    "paraíba",
    "paraiba",
    "pernambuco",
    "piauí",
    "piaui",
    "rio grande do norte",
    "sergipe",
  ],
  north: ["acre", "amapá", "amapa", "amazonas", "pará", "para", "rondônia", "rondonia", "roraima", "tocantins"],
  southeast: ["espírito santo", "espirito santo", "minas gerais", "rio de janeiro", "são paulo", "sao paulo"],
  south: ["paraná", "parana", "rio grande do sul", "santa catarina"],
  central: ["distrito federal", "goiás", "goias", "mato grosso", "mato grosso do sul"],
}

// Popular Brazilian destinations with their states for automatic classification
const brazilianDestinations: Record<string, string> = {
  // Northeast
  natal: "rio grande do norte",
  recife: "pernambuco",
  fortaleza: "ceará",
  salvador: "bahia",
  maceió: "alagoas",
  maceio: "alagoas",
  "joão pessoa": "paraíba",
  "joao pessoa": "paraíba",
  aracaju: "sergipe",
  "são luís": "maranhão",
  "sao luis": "maranhão",
  teresina: "piauí",
  "porto de galinhas": "pernambuco",
  "porto seguro": "bahia",
  pipa: "rio grande do norte",
  maragogi: "alagoas",
  jericoacoara: "ceará",
  "fernando de noronha": "pernambuco",
  "canoa quebrada": "ceará",
  "praia do forte": "bahia",
  "costa do sauípe": "bahia",
  "costa do sauipe": "bahia",
  ilhéus: "bahia",
  ilheus: "bahia",
  "lençóis maranhenses": "maranhão",
  "lencois maranhenses": "maranhão",
  "chapada diamantina": "bahia",

  // South
  florianópolis: "santa catarina",
  florianopolis: "santa catarina",
  "porto alegre": "rio grande do sul",
  gramado: "rio grande do sul",
  curitiba: "paraná",
  "foz do iguaçu": "paraná",
  "foz do iguacu": "paraná",
  "balneário camboriú": "santa catarina",
  "balneario camboriu": "santa catarina",
  blumenau: "santa catarina",
  bombinhas: "santa catarina",
  canela: "rio grande do sul",
  "bento gonçalves": "rio grande do sul",
  "bento goncalves": "rio grande do sul",

  // Southeast
  "rio de janeiro": "rio de janeiro",
  "são paulo": "são paulo",
  "sao paulo": "são paulo",
  "belo horizonte": "minas gerais",
  vitória: "espírito santo",
  vitoria: "espírito santo",
  búzios: "rio de janeiro",
  buzios: "rio de janeiro",
  paraty: "rio de janeiro",
  "campos do jordão": "são paulo",
  "campos do jordao": "são paulo",
  "angra dos reis": "rio de janeiro",
  "cabo frio": "rio de janeiro",
  petrópolis: "rio de janeiro",
  petropolis: "rio de janeiro",
  "ouro preto": "minas gerais",
  tiradentes: "minas gerais",
  guarujá: "são paulo",
  guaruja: "são paulo",
  ubatuba: "são paulo",
  ilhabela: "são paulo",

  // Central
  brasília: "distrito federal",
  brasilia: "distrito federal",
  goiânia: "goiás",
  goiania: "goiás",
  cuiabá: "mato grosso",
  cuiaba: "mato grosso",
  "campo grande": "mato grosso do sul",
  bonito: "mato grosso do sul",
  "caldas novas": "goiás",
  pirenópolis: "goiás",
  pirenopolis: "goiás",
  "chapada dos veadeiros": "goiás",
  pantanal: "mato grosso",

  // North
  manaus: "amazonas",
  belém: "pará",
  belem: "pará",
  palmas: "tocantins",
  "rio branco": "acre",
  "porto velho": "rondônia",
  "boa vista": "roraima",
  macapá: "amapá",
  macapa: "amapá",
  "alter do chão": "pará",
  "alter do chao": "pará",
  "são gabriel da cachoeira": "amazonas",
  "sao gabriel da cachoeira": "amazonas",
  "monte roraima": "roraima",
}

// International popular destinations
const internationalDestinations: Record<string, string> = {
  cancun: "Mexico beach resort",
  miami: "Florida USA beach",
  orlando: "Florida USA Disney",
  "nova york": "New York City USA",
  "las vegas": "Nevada USA",
  paris: "France Eiffel Tower",
  londres: "England UK",
  roma: "Italy Colosseum",
  madri: "Spain",
  lisboa: "Portugal",
  tóquio: "Japan",
  toquio: "Japan",
  dubai: "UAE",
  "buenos aires": "Argentina",
  santiago: "Chile",
  toronto: "Canada",
  vancouver: "Canada",
  amsterdam: "Netherlands",
  berlim: "Germany",
  viena: "Austria",
  atenas: "Greece",
  bangkok: "Thailand",
  pequim: "China",
  sydney: "Australia",
  auckland: "New Zealand",
  "cidade do cabo": "South Africa",
  cairo: "Egypt",
  istambul: "Turkey",
  jerusalém: "Israel",
  jerusalem: "Israel",
  havana: "Cuba",
  "punta cana": "Dominican Republic",
}

// Image search variations to increase diversity
const imageVariations = [
  "landscape",
  "scenic",
  "travel",
  "tourism",
  "vacation",
  "destination",
  "landmark",
  "beach",
  "city",
  "aerial view",
  "panorama",
  "sunset",
]

export async function GET(request: NextRequest) {
  try {
    // Get the search query from URL parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")
    // Novo parâmetro para controlar o número de imagens retornadas
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10)

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    // Process the query to improve search results
    const processedQuery = processQuery(query)
    console.log(`Original query: "${query}" -> Processed query: "${processedQuery}"`)

    // Create variations of the query to increase image diversity
    const queryVariations = createQueryVariations(processedQuery)

    // Try all available image APIs with fallbacks
    let allImages: any[] = []

    // Try to get images from multiple APIs in parallel
    const apiPromises = []

    // 1. Freepik API (prioridade)
    if (FREEPIK_API_KEY) {
      apiPromises.push(searchFreepik(queryVariations))
    }

    // 2. Unsplash API
    if (UNSPLASH_ACCESS_KEY) {
      apiPromises.push(searchUnsplashWithLib(queryVariations))
    }

    // 3. Pexels API
    if (PEXELS_API_KEY) {
      apiPromises.push(searchPexels(queryVariations))
    }

    // 4. Pixabay API
    if (PIXABAY_API_KEY) {
      apiPromises.push(searchPixabay(queryVariations))
    }

    // Wait for all API calls to complete
    const results = await Promise.allSettled(apiPromises)

    // Collect all successful results
    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        if (Array.isArray(result.value)) {
          allImages = [...allImages, ...result.value]
        } else if (result.value) {
          allImages.push(result.value)
        }
      }
    })

    // Log the number of images collected from each source for debugging
    const sourceCount: Record<string, number> = {}
    allImages.forEach((img) => {
      const source = img.source || "unknown"
      sourceCount[source] = (sourceCount[source] || 0) + 1
    })
    console.log("Images collected by source:", sourceCount)

    // Filter for relevant images
    const relevantImages = filterRelevantImages(allImages, query)
    console.log(`Found ${relevantImages.length} relevant images out of ${allImages.length} total images`)

    // Shuffle the images to increase variety
    const shuffledImages = shuffleArray(relevantImages)

    // Priorize high quality images
    const highQualityImages = shuffledImages.filter((img) => {
      const hasHighRes =
        (img.width && img.width >= 1920) ||
        (img.height && img.height >= 1080) ||
        (img.urls?.full && img.urls.full.includes("1920")) ||
        (img.urls?.regular && img.urls.regular.includes("1600"))
      return hasHighRes
    })

    // Combine high quality images with other images, prioritizing high quality
    const sortedImages = [...highQualityImages, ...shuffledImages.filter((img) => !highQualityImages.includes(img))]

    // Limit the number of images returned
    const limitedImages = sortedImages.slice(0, limit)

    // Add fallback images if we don't have enough
    if (limitedImages.length < limit) {
      console.log("Not enough images, using Google Images fallback")

      try {
        // Tenta buscar imagens do Google como fallback
        const googleImages = await searchGoogleImages(query)

        // Adiciona as imagens do Google que não duplicam as já existentes
        for (const googleImage of googleImages) {
          if (limitedImages.length >= limit) break

          // Verifica se a imagem já existe na lista
          const isDuplicate = limitedImages.some((img) => img.urls.regular === googleImage.urls.regular)

          if (!isDuplicate) {
            limitedImages.push(googleImage)
          }
        }
      } catch (error) {
        console.error("Error using Google Images fallback:", error)
      }
    }

    return NextResponse.json({ results: limitedImages })
  } catch (error) {
    console.error("Error in image search API:", error)
    return NextResponse.json({ error: "Failed to search for images" }, { status: 500 })
  }
}

// Melhorar o processamento de consultas para obter imagens mais relevantes
function processQuery(query: string): string {
  const lowerQuery = query.toLowerCase().trim()

  // Adicionar contexto para melhorar a qualidade das imagens
  const enhancedQuery = `${lowerQuery} tourism landscape scenic high quality`

  // Verifica destinos brasileiros
  for (const [destination, state] of Object.entries(brazilianDestinations)) {
    if (lowerQuery === destination || lowerQuery.includes(destination)) {
      return `${destination}, ${state.replace(/á|ã|â/g, "a")}, Brazil, tourism landscape scenic high quality`
    }
  }

  // Verifica estados brasileiros
  for (const [region, states] of Object.entries(brazilianRegions)) {
    for (const state of states) {
      if (lowerQuery === state || lowerQuery.includes(state)) {
        return `${state.replace(/á|ã|â/g, "a")}, Brazil, tourism landscape scenic high quality`
      }
    }
  }

  // Verifica destinos internacionais
  for (const [destination, context] of Object.entries(internationalDestinations)) {
    if (lowerQuery === destination || lowerQuery.includes(destination)) {
      return `${destination}, ${context}, tourism landscape scenic high quality`
    }
  }

  // Adicionar "Brazil" à consulta se não for um destino internacional conhecido
  // e não contiver já a palavra "Brazil" ou "Brasil"
  if (
    !lowerQuery.includes("brazil") &&
    !lowerQuery.includes("brasil") &&
    !Object.keys(internationalDestinations).some((dest) => lowerQuery.includes(dest))
  ) {
    return `${enhancedQuery}, Brazil`
  }

  return enhancedQuery
}

// Melhorar as variações de consulta para aumentar a diversidade e qualidade das imagens
function createQueryVariations(baseQuery: string): string[] {
  const cleanQuery = baseQuery.replace(/,/g, " ")
  return [
    cleanQuery,
    `${cleanQuery} beautiful landscape`,
    `${cleanQuery} tourism destination`,
    `${cleanQuery} travel photography`,
    `${cleanQuery} scenic view`,
    `${cleanQuery} vacation spot`,
  ]
}

// Search Unsplash API using the official library
async function searchUnsplashWithLib(queryVariations: string[]) {
  try {
    const results: any[] = []

    // Use only 2 variations to avoid too many API calls
    const limitedVariations = queryVariations.slice(0, 2)

    for (const query of limitedVariations) {
      const randomPage = Math.floor(Math.random() * 3) + 1

      // Usando a biblioteca oficial do Unsplash
      const response = await unsplashApi.search.getPhotos({
        query,
        page: randomPage,
        perPage: 10,
        orientation: "landscape",
        orderBy: "relevant",
      })

      if (response.errors) {
        console.error("Unsplash API errors:", response.errors)
        continue
      }

      if (!response.response) {
        console.error("Unsplash API returned no response")
        continue
      }

      const { results: unsplashResults } = response.response

      // Add source property to identify the API
      const enhancedResults = unsplashResults.map((item: any) => ({
        ...item,
        source: "unsplash",
      }))

      results.push(...enhancedResults)
    }

    return results
  } catch (error) {
    console.error("Error searching Unsplash with library:", error)
    return []
  }
}

// Search Freepik API with multiple query variations
async function searchFreepik(queryVariations: string[]) {
  try {
    const results: any[] = []

    // Use only 2 variations to avoid too many API calls
    const limitedVariations = queryVariations.slice(0, 2)

    for (const query of limitedVariations) {
      // Introduce randomness by selecting a random page
      const randomPage = Math.floor(Math.random() * 5) + 1

      const response = await fetch(
        `https://api.freepik.com/v2/images?query=${encodeURIComponent(query)}&locale=pt-BR&page=${randomPage}&limit=10`,
        {
          headers: {
            "x-freepik-api-key": FREEPIK_API_KEY,
            Accept: "application/json",
          },
          cache: "no-store",
        },
      )

      if (!response.ok) {
        console.error(`Freepik API error: ${response.statusText}`)
        continue
      }

      const data = await response.json()

      // Transform Freepik response to match the expected format
      const transformedResults = data.data.map((resource: any) => ({
        id: resource.id,
        width: resource.image?.width,
        height: resource.image?.height,
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
        source: "freepik",
      }))

      results.push(...transformedResults)
    }

    return results
  } catch (error) {
    console.error("Error searching Freepik:", error)
    return []
  }
}

// Search Pexels API with multiple query variations
async function searchPexels(queryVariations: string[]) {
  try {
    const results: any[] = []

    // Use only 2 variations to avoid too many API calls
    const limitedVariations = queryVariations.slice(0, 2)

    for (const query of limitedVariations) {
      const randomPage = Math.floor(Math.random() * 3) + 1

      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          query,
        )}&per_page=5&orientation=landscape&page=${randomPage}&size=large&locale=pt-BR`,
        {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
          cache: "no-store",
        },
      )

      if (!response.ok) {
        console.error(`Pexels API error: ${response.statusText}`)
        continue
      }

      const data = await response.json()

      // Transform Pexels response to match the expected format
      const transformedResults = data.photos.map((photo: any) => ({
        id: photo.id,
        width: photo.width,
        height: photo.height,
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
        source: "pexels",
      }))

      results.push(...transformedResults)
    }

    return results
  } catch (error) {
    console.error("Error searching Pexels:", error)
    return []
  }
}

// Search Pixabay API with multiple query variations
async function searchPixabay(queryVariations: string[]) {
  try {
    if (!PIXABAY_API_KEY) return []

    const results: any[] = []

    // Use only 2 variations to avoid too many API calls
    const limitedVariations = queryVariations.slice(0, 2)

    for (const query of limitedVariations) {
      const randomPage = Math.floor(Math.random() * 3) + 1

      const response = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&safesearch=true&lang=pt&per_page=5&page=${randomPage}`,
      )

      if (!response.ok) {
        console.error(`Pixabay API error: ${response.statusText}`)
        continue
      }

      const data = await response.json()

      // Transform Pixabay response to match the expected format
      const transformedResults = data.hits.map((image: any) => ({
        id: image.id,
        width: image.imageWidth,
        height: image.imageHeight,
        urls: {
          raw: image.largeImageURL,
          full: image.largeImageURL,
          regular: image.largeImageURL,
          small: image.webformatURL,
          thumb: image.previewURL,
        },
        user: {
          name: image.user,
          links: {
            html: `https://pixabay.com/users/${image.user}-${image.user_id}/`,
          },
        },
        source: "pixabay",
      }))

      results.push(...transformedResults)
    }

    return results
  } catch (error) {
    console.error("Error searching Pixabay:", error)
    return []
  }
}

// Melhorar o filtro para imagens relevantes
function filterRelevantImages(images: any[], originalQuery: string): any[] {
  if (!images || images.length === 0) return []

  const lowerQuery = originalQuery.toLowerCase()
  const queryWords = lowerQuery.split(/\s+/).filter((word) => word.length > 3)

  // Primeiro, filtrar por qualidade mínima
  const qualityImages = images.filter((img) => {
    // Verificar dimensões mínimas para garantir qualidade
    if ((img.width && img.width < 800) || (img.height && img.height < 600)) return false

    // Se não tiver URLs, não é uma imagem válida
    if (!img.urls || !img.urls.regular) return false

    return true
  })

  // Depois, ordenar por relevância
  return qualityImages.sort((a, b) => {
    let scoreA = 0
    let scoreB = 0

    // Pontuação baseada na fonte (algumas fontes são mais confiáveis)
    if (a.source === "unsplash") scoreA += 5
    if (a.source === "pexels") scoreA += 4
    if (a.source === "freepik") scoreA += 3

    if (b.source === "unsplash") scoreB += 5
    if (b.source === "pexels") scoreB += 4
    if (b.source === "freepik") scoreB += 3

    // Pontuação baseada na resolução
    if (a.width && a.height) {
      const resolutionA = a.width * a.height
      if (resolutionA > 4000000)
        scoreA += 3 // > 4MP
      else if (resolutionA > 2000000)
        scoreA += 2 // > 2MP
      else if (resolutionA > 1000000) scoreA += 1 // > 1MP
    }

    if (b.width && b.height) {
      const resolutionB = b.width * b.height
      if (resolutionB > 4000000)
        scoreB += 3 // > 4MP
      else if (resolutionB > 2000000)
        scoreB += 2 // > 2MP
      else if (resolutionB > 1000000) scoreB += 1 // > 1MP
    }

    // Pontuação baseada na relevância do conteúdo
    const descriptionA = (a.description || a.alt_description || "").toLowerCase()
    const descriptionB = (b.description || b.alt_description || "").toLowerCase()

    // Verificar se a descrição contém palavras da consulta
    queryWords.forEach((word) => {
      if (descriptionA.includes(word)) scoreA += 1
      if (descriptionB.includes(word)) scoreB += 1
    })

    // Verificar se a imagem tem orientação paisagem (preferível para promos)
    if (a.width && a.height && a.width > a.height) scoreA += 2
    if (b.width && b.height && b.width > b.height) scoreB += 2

    return scoreB - scoreA // Ordenar do maior score para o menor
  })
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// Fallback para buscar imagens do Google
async function searchGoogleImages(query: string): Promise<any[]> {
  try {
    // Nota: Esta é uma implementação simulada, pois o Google Custom Search API
    // requer credenciais específicas e tem limitações de uso
    // Em um ambiente de produção, você precisaria configurar o Google Custom Search API

    // Simulando uma resposta com imagens do Unsplash como fallback
    const fallbackQuery = query.includes("Brazil") ? query : `${query} Brazil tourism`
    const fallbackImages = []

    for (let i = 0; i < 5; i++) {
      fallbackImages.push({
        id: `google-fallback-${i}`,
        urls: {
          raw: `https://source.unsplash.com/featured/1600x900/?${encodeURIComponent(fallbackQuery)}&random=${Math.random()}`,
          full: `https://source.unsplash.com/featured/1600x900/?${encodeURIComponent(fallbackQuery)}&random=${Math.random()}`,
          regular: `https://source.unsplash.com/featured/1600x900/?${encodeURIComponent(fallbackQuery)}&random=${Math.random()}`,
          small: `https://source.unsplash.com/featured/800x600/?${encodeURIComponent(fallbackQuery)}&random=${Math.random()}`,
          thumb: `https://source.unsplash.com/featured/400x300/?${encodeURIComponent(fallbackQuery)}&random=${Math.random()}`,
        },
        user: {
          name: "Google Images",
          links: {
            html: "https://images.google.com",
          },
        },
        source: "google",
        width: 1600,
        height: 900,
      })
    }

    return fallbackImages
  } catch (error) {
    console.error("Error in Google Images fallback:", error)
    return []
  }
}
