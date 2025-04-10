import { type NextRequest, NextResponse } from "next/server"

// Mark the route as dynamic to prevent caching
export const dynamic = "force-dynamic"

// API credentials
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || ""
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || ""
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY || ""
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || ""

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

function filterRelevantImages(images: any[], originalQuery: string): any[] {
  const lowerQuery = originalQuery.toLowerCase();
  return images.filter((img) => {
    const description = (img.description || img.alt_description || "").toLowerCase();
    const tags = (img.tags || []).map((tag: any) => tag.title?.toLowerCase() || "");
    return description.includes(lowerQuery) || tags.some((tag: string) => tag.includes(lowerQuery));
  });
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

    // Create variations of the query to increase image diversity
    const queryVariations = createQueryVariations(processedQuery)

    // Try all available image APIs with fallbacks
    let allImages: any[] = []
    let selectedImage = null

    // Try to get images from multiple APIs in parallel
    const apiPromises = []

    // 1. Freepik API
    if (FREEPIK_API_KEY) {
      apiPromises.push(searchFreepik(queryVariations))
    }

    // 2. Unsplash API
    if (UNSPLASH_ACCESS_KEY) {
      apiPromises.push(searchUnsplash(queryVariations))
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
        } else {
          allImages.push(result.value)
        }
      }
    })

    allImages = filterRelevantImages(allImages, query);

    // If we have images, select one randomly
    if (allImages.length > 0) {
      const shuffledImages = shuffleArray(allImages);
      const highQualityImages = shuffledImages.filter((img) => {
        const hasHighRes =
          img.width >= 1920 ||
          img.height >= 1080 ||
          (img.urls?.full && img.urls.full.includes("1920")) ||
          (img.urls?.regular && img.urls.regular.includes("1600"));
        return hasHighRes;
      });
      selectedImage = highQualityImages.length > 0 ? highQualityImages[0] : shuffledImages[0];
    }

    // Final fallback with placeholder images
    if (!selectedImage) {
      selectedImage = {
        id: "fallback1",
        urls: {
          raw: `https://source.unsplash.com/1920x1080/?${encodeURIComponent(processedQuery)}`,
          full: `https://source.unsplash.com/1920x1080/?${encodeURIComponent(processedQuery)}`,
          regular: `https://source.unsplash.com/1600x900/?${encodeURIComponent(processedQuery)}`,
          small: `https://source.unsplash.com/800x600/?${encodeURIComponent(processedQuery)}`,
          thumb: `https://source.unsplash.com/400x300/?${encodeURIComponent(processedQuery)}`,
        },
        user: {
          name: "Unsplash",
          links: {
            html: "https://unsplash.com",
          },
        },
      };
    }

    return NextResponse.json({ results: [selectedImage] })
  } catch (error) {
    console.error("Error in image search API:", error)
    return NextResponse.json({ error: "Failed to search for images" }, { status: 500 })
  }
}

// Process query to improve search results
function processQuery(query: string): string {
  const lowerQuery = query.toLowerCase().trim();

  // Verifica destinos brasileiros
  for (const [destination, state] of Object.entries(brazilianDestinations)) {
    if (lowerQuery === destination || lowerQuery.includes(destination)) {
      return `${destination} ${state} Brazil`; // Apenas cidade, estado e "Brazil" para manter o foco
    }
  }

  // Verifica estados brasileiros
  for (const [region, states] of Object.entries(brazilianRegions)) {
    for (const state of states) {
      if (lowerQuery === state || lowerQuery.includes(state)) {
        return `${lowerQuery} ${region} Brazil`; // Apenas estado, região e "Brazil"
      }
    }
  }

  // Verifica destinos internacionais
  for (const [destination, context] of Object.entries(internationalDestinations)) {
    if (lowerQuery === destination || lowerQuery.includes(destination)) {
      return `${destination} ${context.split(" ")[0]}`; // Apenas cidade e país
    }
  }

  // Default: apenas a query original com "city" para forçar busca por cidades
  return `${lowerQuery} city`;
}

// Create variations of the query to increase image diversity
function createQueryVariations(baseQuery: string): string[] {
  const variations: string[] = [baseQuery];
  
  // Adiciona variações apenas se necessário, mantendo o foco no destino
  variations.push(`${baseQuery} landmark`); // Foco em pontos turísticos
  variations.push(`${baseQuery} skyline`);  // Foco em vistas da cidade
  
  return variations;
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
        `https://api.freepik.com/v1/resources?term=${encodeURIComponent(
          query,
        )}&page=${randomPage}&limit=5&filters[content_type]=photo&filters[orientation]=landscape&filters[min_width]=1920&filters[min_height]=1080&order=relevance`,
        {
          headers: {
            "x-freepik-api-key": FREEPIK_API_KEY,
            "Accept-Language": "en-US",
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

// Search Unsplash API with multiple query variations
async function searchUnsplash(queryVariations: string[]) {
  try {
    const results: any[] = []

    // Use only 2 variations to avoid too many API calls
    const limitedVariations = queryVariations.slice(0, 2)

    for (const query of limitedVariations) {
      const randomPage = Math.floor(Math.random() * 3) + 1

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query,
        )}&per_page=5&orientation=landscape&page=${randomPage}&content_filter=high&order_by=relevant`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
          cache: "no-store",
        },
      )

      if (!response.ok) {
        console.error(`Unsplash API error: ${response.statusText}`)
        continue
      }

      const data = await response.json()

      // Add source property to identify the API
      const enhancedResults = data.results.map((item: any) => ({
        ...item,
        source: "unsplash",
      }))

      results.push(...enhancedResults)
    }

    return results
  } catch (error) {
    console.error("Error searching Unsplash:", error)
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
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
          query,
        )}&image_type=photo&orientation=horizontal&per_page=5&page=${randomPage}&min_width=1920&min_height=1080&order=popular`,
        {
          cache: "no-store",
        },
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

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}
