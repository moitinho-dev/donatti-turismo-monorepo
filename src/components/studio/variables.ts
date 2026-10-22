import { findDestination } from "@/lib/destinations"
import { getPriceNumber } from "@/lib/utils"
import { BRAND } from "./types"

/** Dados da promo usados pelos templates (formato da API: DESTINO, HOTEL...) */
export type PromoLike = Record<string, unknown> & { DESTINO?: string; HOTEL?: string }

export const VARIABLES: { key: string; label: string; example: string }[] = [
  { key: "DESTINO", label: "Destino", example: "Maceió" },
  { key: "HOTEL", label: "Hotel", example: "Ritz Lagoa da Anta" },
  { key: "REGIAO", label: "Região", example: "Nordeste" },
  { key: "DATAS", label: "Datas", example: "05/12 até 10/12 de 2026" },
  { key: "NOITES", label: "Noites", example: "5 noites" },
  { key: "PARCELAS", label: "Nº de parcelas", example: "10x" },
  { key: "VALOR_PARCELA", label: "Valor da parcela", example: "329,00" },
  { key: "VALOR_TOTAL", label: "Valor por pessoa", example: "3.290,00" },
  { key: "VALOR_DE", label: "Preço \"de\"", example: "3.990,00" },
  { key: "DESCONTO", label: "% de desconto", example: "18" },
  { key: "REGIME", label: "Regime", example: "Café da manhã" },
  { key: "AEREO", label: "Aéreo", example: "Aéreo ida e volta" },
  { key: "SAIDA", label: "Saída", example: "Campo Grande (CGR)" },
  { key: "INCLUSOES", label: "Inclusões", example: "Traslado • Seguro viagem" },
  { key: "WHATSAPP", label: "WhatsApp", example: BRAND.whatsapp },
]

const REGION_BY_NAME: Record<string, string> = {
  "Rio de Janeiro": "Sudeste", "Búzios": "Sudeste", "Arraial do Cabo": "Sudeste", "Cabo Frio": "Sudeste", "Angra dos Reis": "Sudeste",
  "Paraty": "Sudeste", "São Paulo": "Sudeste", "Campos do Jordão": "Sudeste", "Ubatuba": "Sudeste", "Ilhabela": "Sudeste",
  "Olímpia": "Sudeste", "Aparecida": "Sudeste", "Belo Horizonte": "Sudeste", "Ouro Preto": "Sudeste", "Capitólio": "Sudeste",
  "Gramado": "Sul", "Bento Gonçalves": "Sul", "Florianópolis": "Sul", "Balneário Camboriú": "Sul", "Bombinhas": "Sul",
  "Foz do Iguaçu": "Sul", "Curitiba": "Sul", "Porto Alegre": "Sul",
  "Bonito": "Centro-Oeste", "Pantanal": "Centro-Oeste", "Chapada dos Guimarães": "Centro-Oeste", "Chapada dos Veadeiros": "Centro-Oeste",
  "Caldas Novas": "Centro-Oeste", "Brasília": "Centro-Oeste",
  "Jalapão": "Norte", "Manaus": "Norte", "Belém": "Norte", "Alter do Chão": "Norte",
}

export function regionOf(destino: string) {
  const info = findDestination(destino)
  if (!info) return "Brasil"
  if (info.category === "internacionais") return "Internacional"
  if (info.category === "cruzeiros") return "Cruzeiro"
  return REGION_BY_NAME[info.name] || "Nordeste"
}

const brl = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function promoVariables(promo: PromoLike | null, overrides: Record<string, string> = {}): Record<string, string> {
  if (!promo) {
    return { ...Object.fromEntries(VARIABLES.map((v) => [v.key, v.example])), ...overrides }
  }
  const total = getPriceNumber(String(promo.VALOR ?? ""))
  const original = getPriceNumber(String(promo.VALOR_ORIGINAL ?? ""))
  const parcelas = parseInt(String(promo.PARCELAS ?? "10"), 10) || 10
  const regime = promo.ALL_INCLUSIVE ? "All inclusive"
    : promo.PENSAO_COMPLETA ? "Pensão completa"
    : promo.MEIA_PENSAO ? "Meia pensão"
    : promo.COM_CAFE ? "Café da manhã"
    : promo.SEM_CAFE ? "Sem refeições"
    : ""
  const saida = promo.CG && promo.SP ? "Campo Grande ou São Paulo" : promo.CG ? "Campo Grande (CGR)" : promo.SP ? "São Paulo (GRU)" : ""
  const noites = String(promo.NUMERO_DE_NOITES ?? "")
  const inclusoes = Array.isArray(promo.SITE_INCLUSIONS) ? (promo.SITE_INCLUSIONS as string[]).slice(0, 3).join(" • ") : ""

  return {
    DESTINO: String(promo.DESTINO ?? "").replace(/\s+-\s+.*$/, ""),
    HOTEL: String(promo.HOTEL ?? ""),
    REGIAO: regionOf(String(promo.DESTINO ?? "")),
    DATAS: String(promo.DATA_FORMATADA ?? ""),
    NOITES: noites ? `${noites} noites` : "",
    PARCELAS: `${parcelas}x`,
    VALOR_PARCELA: total ? brl(total / parcelas) : "",
    VALOR_TOTAL: total ? brl(total) : "",
    VALOR_DE: original > total ? brl(original) : "",
    DESCONTO: original > total ? String(Math.round((1 - total / original) * 100)) : "",
    REGIME: regime,
    AEREO: promo.AEREO ? "Aéreo ida e volta" : "",
    SAIDA: saida,
    INCLUSOES: inclusoes,
    WHATSAPP: BRAND.whatsapp,
    ...overrides,
  }
}

const VAR_RE = /\{([A-Z_]+)\}/g

/** Troca {VARIAVEIS}. `empty` = o texto só tinha variáveis vazias (a camada deve sumir) */
export function resolveText(text: string, vars: Record<string, string>): { text: string; empty: boolean } {
  let usedVars = 0
  let filledVars = 0
  const out = text.replace(VAR_RE, (match, key: string) => {
    if (!(key in vars)) return match
    usedVars++
    if (vars[key]) filledVars++
    return vars[key]
  })
  return { text: out, empty: usedVars > 0 && filledVars === 0 }
}
