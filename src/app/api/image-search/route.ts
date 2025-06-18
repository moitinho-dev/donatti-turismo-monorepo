import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")
  const limit = parseInt(searchParams.get("limit") || "20")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    // Melhorar a query de busca para ser mais específica
    const enhancedQuery = enhanceSearchQuery(query)
    
    // Usar Unsplash API com múltiplas tentativas
    const results = await searchImagesWithFallback(enhancedQuery, limit)
    
    return NextResponse.json({
      results: results,
      total: results.length,
      query: enhancedQuery
    })
  } catch (error) {
    console.error("Error searching images:", error)
    return NextResponse.json(
      { error: "Failed to search images" },
      { status: 500 }
    )
  }
}

function enhanceSearchQuery(originalQuery: string): string {
  const query = originalQuery.toLowerCase().trim()
  
  // Mapeamento de destinos para termos de busca mais específicos
  const destinationMappings: Record<string, string[]> = {
    // Brasil - Nordeste
    "natal": ["natal brazil beach", "ponta negra natal", "natal rio grande norte"],
    "recife": ["recife brazil", "recife pernambuco", "marco zero recife"],
    "fortaleza": ["fortaleza brazil beach", "fortaleza ceara", "iracema beach fortaleza"],
    "salvador": ["salvador bahia brazil", "pelourinho salvador", "salvador historic center"],
    "maceió": ["maceio brazil beach", "pajucara maceio", "alagoas beach"],
    "maceio": ["maceio brazil beach", "pajucara maceio", "alagoas beach"],
    "joão pessoa": ["joao pessoa brazil", "paraiba beach", "cabo branco joao pessoa"],
    "joao pessoa": ["joao pessoa brazil", "paraiba beach", "cabo branco joao pessoa"],
    "porto de galinhas": ["porto de galinhas brazil", "pernambuco beach", "natural pools porto galinhas"],
    "porto seguro": ["porto seguro bahia", "discovery coast brazil", "arraial d'ajuda"],
    "jericoacoara": ["jericoacoara brazil", "ceara dunes", "jeri beach"],
    "fernando de noronha": ["fernando de noronha brazil", "noronha island", "sancho beach"],
    
    // Brasil - Sudeste
    "rio de janeiro": ["rio de janeiro brazil", "copacabana ipanema", "christ redeemer rio", "sugarloaf rio"],
    "são paulo": ["sao paulo brazil", "paulista avenue", "sao paulo skyline"],
    "sao paulo": ["sao paulo brazil", "paulista avenue", "sao paulo skyline"],
    "búzios": ["buzios brazil", "armacao buzios", "buzios beaches"],
    "buzios": ["buzios brazil", "armacao buzios", "buzios beaches"],
    "paraty": ["paraty brazil", "paraty colonial", "paraty historic center"],
    "campos do jordão": ["campos do jordao brazil", "campos jordao mountains", "swiss style brazil"],
    "campos do jordao": ["campos do jordao brazil", "campos jordao mountains", "swiss style brazil"],
    "angra dos reis": ["angra dos reis brazil", "ilha grande", "angra bay"],
    "cabo frio": ["cabo frio brazil", "cabo frio beach", "lagos region brazil"],
    
    // Brasil - Sul
    "florianópolis": ["florianopolis brazil", "floripa beach", "santa catarina island"],
    "florianopolis": ["florianopolis brazil", "floripa beach", "santa catarina island"],
    "gramado": ["gramado brazil", "gramado serra gaucha", "gramado christmas"],
    "porto alegre": ["porto alegre brazil", "rio grande do sul", "porto alegre downtown"],
    "curitiba": ["curitiba brazil", "curitiba parana", "curitiba parks"],
    "foz do iguaçu": ["iguazu falls brazil", "foz iguacu", "iguassu falls"],
    "foz do iguacu": ["iguazu falls brazil", "foz iguacu", "iguassu falls"],
    "balneário camboriú": ["balneario camboriu brazil", "camboriu beach", "santa catarina beach"],
    "balneario camboriu": ["balneario camboriu brazil", "camboriu beach", "santa catarina beach"],
    
    // Brasil - Centro-Oeste
    "brasília": ["brasilia brazil", "brasilia architecture", "brasilia cathedral"],
    "brasilia": ["brasilia brazil", "brasilia architecture", "brasilia cathedral"],
    "bonito": ["bonito brazil", "bonito mato grosso sul", "crystal clear waters bonito"],
    "pantanal": ["pantanal brazil", "pantanal wetlands", "pantanal wildlife"],
    "chapada dos guimarães": ["chapada guimaraes", "mato grosso chapada", "chapada waterfalls"],
    "chapada dos guimaraes": ["chapada guimaraes", "mato grosso chapada", "chapada waterfalls"],
    
    // Brasil - Norte
    "manaus": ["manaus brazil", "amazon manaus", "meeting of waters manaus"],
    "belém": ["belem brazil", "belem para", "ver o peso belem"],
    "belem": ["belem brazil", "belem para", "ver o peso belem"],
    "alter do chão": ["alter do chao brazil", "amazon beach", "tapajos river"],
    "alter do chao": ["alter do chao brazil", "amazon beach", "tapajos river"],
    
    // Internacional
    "cancun": ["cancun mexico", "cancun beach", "riviera maya"],
    "miami": ["miami beach", "south beach miami", "miami skyline"],
    "orlando": ["orlando florida", "disney world orlando", "universal studios orlando"],
    "nova york": ["new york city", "manhattan skyline", "times square"],
    "paris": ["paris france", "eiffel tower", "champs elysees"],
    "londres": ["london england", "big ben london", "tower bridge"],
    "roma": ["rome italy", "colosseum rome", "vatican rome"],
    "dubai": ["dubai uae", "burj khalifa", "dubai marina"],
    "buenos aires": ["buenos aires argentina", "puerto madero", "la boca buenos aires"],
    "santiago": ["santiago chile", "andes mountains santiago", "santiago downtown"],
    "lisboa": ["lisbon portugal", "alfama lisbon", "tram 28 lisbon"],
    "madri": ["madrid spain", "gran via madrid", "retiro park madrid"],
    "barcelona": ["barcelona spain", "sagrada familia", "park guell barcelona"],
    "amsterdam": ["amsterdam netherlands", "amsterdam canals", "jordaan amsterdam"],
    "berlim": ["berlin germany", "brandenburg gate", "berlin wall"],
    "tóquio": ["tokyo japan", "shibuya crossing", "mount fuji tokyo"],
    "toquio": ["tokyo japan", "shibuya crossing", "mount fuji tokyo"],
    "bangkok": ["bangkok thailand", "grand palace bangkok", "floating market bangkok"],
    "sydney": ["sydney australia", "opera house sydney", "harbour bridge sydney"],
    "punta cana": ["punta cana dominican republic", "bavaro beach", "cap cana"],
  }

  // Buscar mapeamento específico
  for (const [destination, searchTerms] of Object.entries(destinationMappings)) {
    if (query.includes(destination)) {
      return searchTerms[0] // Retorna o termo mais específico
    }
  }

  // Se não encontrar mapeamento específico, melhorar a query original
  const enhancedTerms = []
  
  // Adicionar termos contextuais baseados em palavras-chave
  if (query.includes("praia") || query.includes("beach")) {
    enhancedTerms.push("beach", "coastline", "tropical")
  }
  
  if (query.includes("montanha") || query.includes("mountain")) {
    enhancedTerms.push("mountain", "landscape", "scenic")
  }
  
  if (query.includes("cidade") || query.includes("city")) {
    enhancedTerms.push("cityscape", "urban", "skyline")
  }

  // Adicionar "travel destination" para melhorar relevância
  const baseQuery = `${query} travel destination`
  
  if (enhancedTerms.length > 0) {
    return `${baseQuery} ${enhancedTerms.join(" ")}`
  }
  
  return baseQuery
}

async function searchImagesWithFallback(query: string, limit: number): Promise<any[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  
  if (!accessKey) {
    throw new Error("Unsplash access key not configured")
  }

  // Primeira tentativa com query específica
  let results = await searchUnsplash(query, limit, accessKey)
  
  // Se não encontrar resultados suficientes, tentar com query simplificada
  if (results.length < 5) {
    const simplifiedQuery = query.split(" ")[0] // Pegar apenas a primeira palavra
    const fallbackResults = await searchUnsplash(simplifiedQuery, limit, accessKey)
    results = [...results, ...fallbackResults]
  }
  
  // Se ainda não tiver resultados suficientes, tentar com termos genéricos
  if (results.length < 3) {
    const genericQuery = "travel destination landscape"
    const genericResults = await searchUnsplash(genericQuery, limit, accessKey)
    results = [...results, ...genericResults]
  }
  
  // Remover duplicatas baseado na URL
  const uniqueResults = results.filter((item, index, self) => 
    index === self.findIndex(t => t.urls.regular === item.urls.regular)
  )
  
  return uniqueResults.slice(0, limit)
}

async function searchUnsplash(query: string, limit: number, accessKey: string): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=portrait&order_by=relevant`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`)
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error("Error searching Unsplash:", error)
    return []
  }
}