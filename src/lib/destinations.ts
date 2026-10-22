/**
 * Catálogo de destinos usado para:
 * - montar buscas de imagem que correspondam ao destino real da promo
 * - classificar a promo na seção certa do site (nacional / internacional / cruzeiro)
 *
 * O match é feito sobre o nome normalizado (sem acento, sem sufixo de UF/país)
 * e por palavra inteira, do alias mais longo para o mais curto. Assim
 * "Porto de Galinhas - PE" não cai em "Porto Seguro" e "Aroma Hotel" não vira "Roma".
 */

export type DestinationCategory = "nacionais" | "internacionais" | "cruzeiros"

export interface DestinationInfo {
  /** Nome canônico para exibição */
  name: string
  /** Variações pelas quais o destino aparece nas promos */
  aliases: string[]
  /** Termos de busca em inglês, do mais específico para o mais amplo */
  queries: string[]
  category: DestinationCategory
}

const D = (
  name: string,
  aliases: string[],
  queries: string[],
  category: DestinationCategory = "nacionais",
): DestinationInfo => ({ name, aliases, queries, category })

export const DESTINATIONS: DestinationInfo[] = [
  // Nordeste
  D("Natal", ["natal", "ponta negra", "pipa", "praia da pipa"], ["ponta negra beach natal brazil", "natal rio grande do norte beach"]),
  D("Recife", ["recife", "boa viagem"], ["recife pernambuco brazil", "boa viagem beach recife"]),
  D("Porto de Galinhas", ["porto de galinhas", "muro alto", "ipojuca"], ["porto de galinhas natural pools", "porto de galinhas beach brazil"]),
  D("Fortaleza", ["fortaleza", "cumbuco", "beach park"], ["fortaleza ceara beach", "fortaleza brazil coast"]),
  D("Jericoacoara", ["jericoacoara", "jeri"], ["jericoacoara dunes brazil", "jericoacoara beach sunset"]),
  D("Canoa Quebrada", ["canoa quebrada"], ["canoa quebrada cliffs brazil"]),
  D("Salvador", ["salvador"], ["salvador bahia pelourinho", "salvador bahia coast"]),
  D("Praia do Forte", ["praia do forte", "costa do sauipe", "sauipe", "imbassai"], ["praia do forte bahia beach", "bahia coconut beach brazil"]),
  D("Porto Seguro", ["porto seguro", "arraial d ajuda", "arraial dajuda", "trancoso"], ["porto seguro bahia beach", "trancoso bahia beach"]),
  D("Morro de São Paulo", ["morro de sao paulo", "boipeba"], ["morro de sao paulo bahia beach"]),
  D("Maceió", ["maceio", "maragogi", "pajucara", "sao miguel dos milagres", "milagres"], ["maceio alagoas beach", "maragogi natural pools brazil"]),
  D("João Pessoa", ["joao pessoa", "cabo branco"], ["joao pessoa paraiba beach"]),
  D("Aracaju", ["aracaju"], ["aracaju sergipe beach"]),
  D("São Luís", ["sao luis"], ["sao luis maranhao historic center"]),
  D("Lençóis Maranhenses", ["lencois maranhenses", "barreirinhas", "atins"], ["lencois maranhenses lagoons dunes"]),
  D("Fernando de Noronha", ["fernando de noronha", "noronha"], ["fernando de noronha baia do sancho", "fernando de noronha island"]),
  // Sudeste
  D("Rio de Janeiro", ["rio de janeiro", "copacabana", "ipanema"], ["rio de janeiro sugarloaf", "copacabana beach rio de janeiro"]),
  D("Búzios", ["buzios", "armacao dos buzios"], ["buzios rio de janeiro beach"]),
  D("Arraial do Cabo", ["arraial do cabo"], ["arraial do cabo beach brazil"]),
  D("Cabo Frio", ["cabo frio"], ["cabo frio beach brazil"]),
  D("Angra dos Reis", ["angra dos reis", "ilha grande"], ["angra dos reis islands brazil", "ilha grande brazil beach"]),
  D("Paraty", ["paraty", "parati"], ["paraty colonial town brazil"]),
  D("São Paulo", ["sao paulo"], ["sao paulo skyline", "paulista avenue sao paulo"]),
  D("Campos do Jordão", ["campos do jordao"], ["campos do jordao mountains brazil"]),
  D("Ubatuba", ["ubatuba"], ["ubatuba beach brazil"]),
  D("Ilhabela", ["ilhabela"], ["ilhabela beach brazil"]),
  D("Olímpia", ["olimpia", "thermas dos laranjais"], ["water park brazil olimpia"]),
  D("Aparecida", ["aparecida"], ["basilica aparecida brazil"]),
  D("Belo Horizonte", ["belo horizonte"], ["belo horizonte pampulha"]),
  D("Ouro Preto", ["ouro preto"], ["ouro preto colonial town"]),
  D("Capitólio", ["capitolio"], ["capitolio canyon furnas brazil"]),
  // Sul
  D("Gramado", ["gramado", "canela", "serra gaucha"], ["gramado rio grande do sul", "gramado brazil town"]),
  D("Bento Gonçalves", ["bento goncalves", "vale dos vinhedos"], ["vale dos vinhedos vineyard brazil"]),
  D("Florianópolis", ["florianopolis", "floripa", "jurere"], ["florianopolis beach brazil", "florianopolis island coast"]),
  D("Balneário Camboriú", ["balneario camboriu", "camboriu", "beto carrero", "penha"], ["balneario camboriu skyline beach"]),
  D("Bombinhas", ["bombinhas"], ["bombinhas beach brazil"]),
  D("Foz do Iguaçu", ["foz do iguacu", "foz", "cataratas", "iguacu"], ["iguazu falls brazil", "foz do iguacu waterfalls"]),
  D("Curitiba", ["curitiba"], ["curitiba botanical garden"]),
  D("Porto Alegre", ["porto alegre"], ["porto alegre brazil city"]),
  // Centro-Oeste / Norte
  D("Bonito", ["bonito"], ["bonito mato grosso do sul crystal river", "bonito brazil snorkeling river"]),
  D("Pantanal", ["pantanal"], ["pantanal wetlands wildlife"]),
  D("Chapada dos Guimarães", ["chapada dos guimaraes"], ["chapada dos guimaraes waterfall"]),
  D("Chapada dos Veadeiros", ["chapada dos veadeiros", "alto paraiso"], ["chapada dos veadeiros waterfall"]),
  D("Caldas Novas", ["caldas novas", "rio quente"], ["caldas novas hot springs brazil"]),
  D("Brasília", ["brasilia"], ["brasilia architecture"]),
  D("Jalapão", ["jalapao"], ["jalapao dunes brazil"]),
  D("Manaus", ["manaus"], ["amazon rainforest manaus", "manaus amazon river"]),
  D("Belém", ["belem"], ["belem para brazil"]),
  D("Alter do Chão", ["alter do chao"], ["alter do chao tapajos beach"]),

  // Internacionais — América Latina / Caribe
  D("Cancún", ["cancun", "riviera maya", "playa del carmen", "tulum"], ["cancun beach turquoise", "riviera maya beach mexico"], "internacionais"),
  D("Punta Cana", ["punta cana", "bavaro", "cap cana"], ["punta cana beach palm trees", "bavaro beach dominican republic"], "internacionais"),
  D("Aruba", ["aruba"], ["aruba eagle beach"], "internacionais"),
  D("Curaçao", ["curacao"], ["curacao willemstad colorful houses"], "internacionais"),
  D("San Andrés", ["san andres"], ["san andres island colombia beach"], "internacionais"),
  D("Cartagena", ["cartagena"], ["cartagena colombia old town"], "internacionais"),
  D("Buenos Aires", ["buenos aires"], ["buenos aires obelisco", "buenos aires caminito"], "internacionais"),
  D("Bariloche", ["bariloche"], ["bariloche lake mountains", "bariloche snow"], "internacionais"),
  D("Ushuaia", ["ushuaia"], ["ushuaia patagonia"], "internacionais"),
  D("Mendoza", ["mendoza"], ["mendoza vineyards andes"], "internacionais"),
  D("Santiago", ["santiago do chile", "santiago de chile", "santiago", "valle nevado"], ["santiago chile andes skyline", "valle nevado ski chile"], "internacionais"),
  D("Atacama", ["atacama", "san pedro de atacama"], ["atacama desert chile"], "internacionais"),
  D("Montevidéu", ["montevideu", "montevideo", "punta del este"], ["montevideo uruguay", "punta del este beach"], "internacionais"),
  D("Lima / Cusco", ["lima", "cusco", "machu picchu", "peru"], ["machu picchu peru", "cusco peru"], "internacionais"),
  // América do Norte
  D("Orlando", ["orlando", "disney", "universal"], ["orlando florida theme park", "walt disney world castle"], "internacionais"),
  D("Miami", ["miami"], ["miami beach skyline", "south beach miami"], "internacionais"),
  D("Nova York", ["nova york", "new york", "nova iorque"], ["new york city manhattan skyline"], "internacionais"),
  D("Las Vegas", ["las vegas"], ["las vegas strip"], "internacionais"),
  // Europa
  D("Lisboa", ["lisboa", "lisbon", "portugal", "porto portugal"], ["lisbon portugal tram", "lisbon alfama"], "internacionais"),
  D("Paris", ["paris"], ["paris eiffel tower"], "internacionais"),
  D("Londres", ["londres", "london"], ["london big ben"], "internacionais"),
  D("Roma", ["roma", "rome", "italia", "italy"], ["rome colosseum"], "internacionais"),
  D("Madri", ["madri", "madrid"], ["madrid gran via"], "internacionais"),
  D("Barcelona", ["barcelona"], ["barcelona sagrada familia"], "internacionais"),
  D("Amsterdã", ["amsterda", "amsterdam"], ["amsterdam canals"], "internacionais"),
  D("Grécia", ["grecia", "santorini", "atenas", "mykonos"], ["santorini greece"], "internacionais"),
  D("Suíça", ["suica", "zurique", "interlaken"], ["swiss alps village"], "internacionais"),
  // Outros
  D("Dubai", ["dubai", "emirados"], ["dubai burj khalifa skyline"], "internacionais"),
  D("Maldivas", ["maldivas", "maldives"], ["maldives overwater bungalows"], "internacionais"),
  D("Egito", ["egito", "cairo"], ["egypt pyramids giza"], "internacionais"),
  D("Tailândia", ["tailandia", "bangkok", "phuket"], ["thailand phi phi islands"], "internacionais"),
  D("Japão", ["japao", "toquio", "tokyo"], ["tokyo japan street"], "internacionais"),

  // Cruzeiros
  D("Cruzeiro", ["cruzeiro", "msc", "costa cruzeiros", "navio"], ["cruise ship ocean", "cruise ship deck sea"], "cruzeiros"),
]

/** Remove acentos, sufixos de UF/país e pontuação. "Maceió - AL" -> "maceio" */
export function normalizeDestination(value: string): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[\/|,]\s*[a-z]{2}\b/g, " ")
    .replace(/\s+-\s+.*$/, " ") // "Natal - RN", "Cancún - México"
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const sortedAliases: Array<{ alias: string; info: DestinationInfo }> = DESTINATIONS.flatMap((info) =>
  info.aliases.map((alias) => ({ alias: normalizeDestination(alias), info })),
).sort((a, b) => b.alias.length - a.alias.length)

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** Encontra o destino conhecido para um texto livre (destino da promo, hotel, etc.) */
export function findDestination(value: string): DestinationInfo | null {
  const normalized = normalizeDestination(value)
  if (!normalized) return null
  for (const { alias, info } of sortedAliases) {
    if (new RegExp(`(^|\\s)${escapeRegExp(alias)}(\\s|$)`).test(normalized)) return info
  }
  return null
}

/**
 * Termos de busca de imagem para um destino.
 * Destino desconhecido: usa o nome limpo + "travel", nunca uma palavra solta.
 */
export function getImageQueries(destino: string): string[] {
  const info = findDestination(destino)
  if (info) return info.queries
  const normalized = normalizeDestination(destino)
  return normalized ? [`${normalized} travel`, normalized] : []
}

/** Seção sugerida do site com base no destino. Retorna null se não reconhecer. */
export function suggestSiteSection(destino: string): DestinationCategory | null {
  return findDestination(destino)?.category ?? null
}
