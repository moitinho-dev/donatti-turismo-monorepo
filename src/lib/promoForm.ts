import { parsePromoDates } from "@/lib/utils"
import { suggestSiteSection } from "@/lib/destinations"

/** Estado do formulário de promo (valores já "humanos": datas ISO, preço por pessoa em número) */
export interface PromoFormState {
  id?: string
  destino: string
  hotel: string
  ida: string // AAAA-MM-DD
  volta: string // AAAA-MM-DD
  noites: string
  valor: number | null // por pessoa
  valorOriginal: number | null // preço "de", por pessoa
  parcelas: number
  regime: Regime | ""
  aereo: boolean
  cg: boolean
  sp: boolean
  outrasSaidas: string[]
  inclusoes: string[]
  publicar: boolean
  secao: string
  descricao: string
  blackFriday: boolean
  // Preservados ao editar, sem campo no formulário
  siteImage?: string | null
  siteSlug?: string | null
}

export type Regime = "COM_CAFE" | "SEM_CAFE" | "MEIA_PENSAO" | "PENSAO_COMPLETA" | "ALL_INCLUSIVE"

export const REGIMES: { value: Regime; label: string }[] = [
  { value: "COM_CAFE", label: "Café da manhã" },
  { value: "MEIA_PENSAO", label: "Meia pensão" },
  { value: "PENSAO_COMPLETA", label: "Pensão completa" },
  { value: "ALL_INCLUSIVE", label: "All inclusive" },
  { value: "SEM_CAFE", label: "Sem refeições" },
]

export const SITE_SECTIONS = [
  { value: "nacionais", label: "Nacional" },
  { value: "internacionais", label: "Internacional" },
  { value: "cruzeiros", label: "Cruzeiro" },
  { value: "lua-de-mel", label: "Lua de mel" },
  { value: "nordeste", label: "Nordeste" },
  { value: "religioso", label: "Religioso" },
]

export const INCLUSION_SUGGESTIONS = [
  "Aéreo ida e volta",
  "Bagagem despachada",
  "Traslado aeroporto/hotel",
  "Seguro viagem",
  "Passeios inclusos",
  "Ingressos",
  "Taxas inclusas",
]

export const PARCELAS_OPTIONS = [1, 3, 6, 10, 12, 15, 18]

export const emptyPromoForm = (): PromoFormState => ({
  destino: "",
  hotel: "",
  ida: "",
  volta: "",
  noites: "",
  valor: null,
  valorOriginal: null,
  parcelas: 10,
  regime: "",
  aereo: false,
  cg: false,
  sp: false,
  outrasSaidas: [],
  inclusoes: [],
  publicar: false,
  secao: "",
  descricao: "",
  blackFriday: false,
})

const pad = (n: number) => String(n).padStart(2, "0")
const toIso = (d: Date | null) => (d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "")

/** Noites entre ida e volta (ou "" se alguma data falta ou a volta é antes da ida) */
export function nightsBetween(ida: string, volta: string): string {
  if (!ida || !volta) return ""
  const diff = Math.round((Date.parse(`${volta}T12:00:00`) - Date.parse(`${ida}T12:00:00`)) / 86_400_000)
  return diff > 0 ? String(diff) : ""
}

/** "15/07 até 22/07 de 2026" — formato salvo no banco e lido pelo site */
export function formatDataFormatada(ida: string, volta: string): string {
  if (!ida || !volta) return ""
  const [, m1, d1] = ida.split("-")
  const [y2, m2, d2] = volta.split("-")
  return `${d1}/${m1} até ${d2}/${m2} de ${y2}`
}

const regimeOf = (p: Record<string, unknown>): Regime | "" =>
  p.ALL_INCLUSIVE ? "ALL_INCLUSIVE"
  : p.PENSAO_COMPLETA ? "PENSAO_COMPLETA"
  : p.MEIA_PENSAO ? "MEIA_PENSAO"
  : p.COM_CAFE ? "COM_CAFE"
  : p.SEM_CAFE ? "SEM_CAFE"
  : ""

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""))
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Promo da API (formato DESTINO/HOTEL/...) -> estado do formulário */
export function fromApiPromo(p: Record<string, unknown>): PromoFormState {
  const { start, end } = parsePromoDates(String(p.DATA_FORMATADA || ""))
  const departures = (p.SITE_DEPARTURES as string[] | undefined) || []
  return {
    ...emptyPromoForm(),
    id: String(p.id || "") || undefined,
    destino: String(p.DESTINO || ""),
    hotel: String(p.HOTEL || ""),
    ida: toIso(start),
    volta: toIso(end),
    noites: String(p.NUMERO_DE_NOITES || ""),
    valor: num(p.VALOR),
    valorOriginal: num(p.VALOR_ORIGINAL),
    parcelas: parseInt(String(p.PARCELAS || "10"), 10) || 10,
    regime: regimeOf(p),
    aereo: !!p.AEREO,
    cg: !!p.CG,
    sp: !!p.SP,
    outrasSaidas: departures.filter((c) => c !== "Campo Grande" && c !== "São Paulo"),
    inclusoes: (p.SITE_INCLUSIONS as string[] | undefined) || [],
    publicar: !!p.SITE_PUBLISHED,
    secao: String(p.SITE_SECTION || ""),
    descricao: String(p.SITE_DESCRIPTION || ""),
    blackFriday: p.CAMPAIGN === "black-friday",
    siteImage: (p.SITE_IMAGE as string | null) ?? null,
    siteSlug: (p.SITE_SLUG as string | null) ?? null,
  }
}

/** Estado do formulário -> corpo do POST /api/promos */
export function toApiPayload(f: PromoFormState) {
  const departures = f.outrasSaidas.length
    ? [...(f.cg ? ["Campo Grande"] : []), ...(f.sp ? ["São Paulo"] : []), ...f.outrasSaidas]
    : []
  return {
    ...(f.id ? { id: f.id } : {}),
    DESTINO: f.destino.trim(),
    HOTEL: f.hotel.trim(),
    DATA_FORMATADA: formatDataFormatada(f.ida, f.volta),
    VALOR: (f.valor ?? 0).toFixed(2),
    VALOR_ORIGINAL: f.valorOriginal && f.valor && f.valorOriginal > f.valor ? f.valorOriginal.toFixed(2) : null,
    PARCELAS: f.parcelas,
    NUMERO_DE_NOITES: f.noites,
    COM_CAFE: f.regime === "COM_CAFE",
    SEM_CAFE: f.regime === "SEM_CAFE",
    MEIA_PENSAO: f.regime === "MEIA_PENSAO",
    PENSAO_COMPLETA: f.regime === "PENSAO_COMPLETA",
    ALL_INCLUSIVE: f.regime === "ALL_INCLUSIVE",
    AEREO: f.aereo,
    CG: f.cg,
    SP: f.sp,
    SITE_PUBLISHED: f.publicar,
    SITE_SECTION: f.secao || undefined,
    SITE_SLUG: f.siteSlug || undefined,
    SITE_IMAGE: f.siteImage || undefined,
    SITE_DESCRIPTION: f.descricao.trim() || undefined,
    SITE_INCLUSIONS: f.inclusoes,
    SITE_DEPARTURES: departures,
    CAMPAIGN: f.blackFriday ? "black-friday" : null,
  }
}

export type FormErrors = Partial<Record<"destino" | "hotel" | "ida" | "volta" | "noites" | "valor" | "regime" | "valorOriginal", string>>

export function validatePromoForm(f: PromoFormState): FormErrors {
  const e: FormErrors = {}
  if (!f.destino.trim()) e.destino = "Informe o destino"
  if (!f.hotel.trim()) e.hotel = "Informe o hotel"
  if (!f.ida) e.ida = "Escolha a data de ida"
  if (!f.volta) e.volta = "Escolha a data de volta"
  else if (f.ida && f.volta <= f.ida) e.volta = "A volta precisa ser depois da ida"
  if (!f.noites || parseInt(f.noites, 10) < 1) e.noites = "Informe as noites"
  if (!f.valor) e.valor = "Informe o valor por pessoa"
  if (f.valorOriginal && f.valor && f.valorOriginal <= f.valor) e.valorOriginal = "O preço \"de\" precisa ser maior que o atual"
  if (!f.regime) e.regime = "Escolha o regime"
  return e
}

/** Campos lidos pela IA (rota /api/ai/extract) */
export interface ExtractedFields {
  DESTINO: string | null
  HOTEL: string | null
  DATA_IDA: string | null
  DATA_VOLTA: string | null
  NUMERO_DE_NOITES: number | null
  VALOR_TOTAL: number | null
  VALOR_E_POR_PESSOA: boolean | null
  VALOR_ORIGINAL: number | null
  PARCELAS: number | null
  REGIME: Regime | null
  AEREO: boolean | null
  SAIDA_CAMPO_GRANDE: boolean | null
  SAIDA_SAO_PAULO: boolean | null
  OUTRAS_SAIDAS: string[]
  INCLUSOES: string[]
  OBSERVACOES: string | null
}

/**
 * Aplica o que a IA leu sobre o formulário atual. Só sobrescreve campos que vieram preenchidos.
 * `divisor` converte o valor do material para por pessoa (2 quando o material traz o preço do casal).
 */
export function applyExtracted(
  current: PromoFormState,
  x: ExtractedFields,
  divisor: number,
): { form: PromoFormState; filled: (keyof PromoFormState)[] } {
  const f = { ...current }
  const filled: (keyof PromoFormState)[] = []
  const set = <K extends keyof PromoFormState>(key: K, value: PromoFormState[K] | null | undefined) => {
    if (value === null || value === undefined || value === "") return
    f[key] = value
    filled.push(key)
  }
  set("destino", x.DESTINO)
  set("hotel", x.HOTEL)
  set("ida", x.DATA_IDA)
  set("volta", x.DATA_VOLTA)
  set("noites", x.NUMERO_DE_NOITES ? String(x.NUMERO_DE_NOITES) : nightsBetween(f.ida, f.volta) || null)
  set("valor", x.VALOR_TOTAL ? Math.round((x.VALOR_TOTAL / divisor) * 100) / 100 : null)
  set("valorOriginal", x.VALOR_ORIGINAL ? Math.round((x.VALOR_ORIGINAL / divisor) * 100) / 100 : null)
  set("parcelas", x.PARCELAS)
  set("regime", x.REGIME)
  if (x.AEREO !== null) set("aereo", x.AEREO)
  if (x.SAIDA_CAMPO_GRANDE !== null) set("cg", x.SAIDA_CAMPO_GRANDE)
  if (x.SAIDA_SAO_PAULO !== null) set("sp", x.SAIDA_SAO_PAULO)
  if (x.OUTRAS_SAIDAS?.length) set("outrasSaidas", x.OUTRAS_SAIDAS)
  if (x.INCLUSOES?.length) set("inclusoes", x.INCLUSOES)
  if (!f.secao && f.destino) set("secao", suggestSiteSection(f.destino))
  return { form: f, filled }
}

/** Parâmetros da extensão do Chrome (?autofill=DESTINO=...&VALOR=...); o valor já vem por pessoa */
export function fromExtensionParams(raw: string, base: PromoFormState = emptyPromoForm()): PromoFormState {
  const p = Object.fromEntries(new URLSearchParams(raw))
  const f = { ...base }
  if (p.DESTINO) f.destino = p.DESTINO
  if (p.HOTEL) f.hotel = p.HOTEL
  if (p.NUMERO_DE_NOITES) f.noites = p.NUMERO_DE_NOITES
  if (p.PARCELAS) f.parcelas = parseInt(p.PARCELAS, 10) || f.parcelas
  if (num(p.VALOR)) f.valor = num(p.VALOR)
  const year = p.ANO || String(new Date().getFullYear())
  if (p.DE && p.MES_DE) f.ida = `${year}-${p.MES_DE.padStart(2, "0")}-${p.DE.padStart(2, "0")}`
  if (p.ATE && p.MES_ATE) f.volta = `${year}-${p.MES_ATE.padStart(2, "0")}-${p.ATE.padStart(2, "0")}`
  // Viagem que vira o ano: ida em dezembro, volta em janeiro
  if (f.ida && f.volta && f.volta < f.ida && p.MES_DE && p.MES_ATE && +p.MES_DE > +p.MES_ATE) {
    f.ida = `${+year - 1}${f.ida.slice(4)}`
  }
  if (!f.noites) f.noites = nightsBetween(f.ida, f.volta)
  if (REGIMES.some((r) => r.value === p.regime)) f.regime = p.regime as Regime
  if (p.AEREO === "true") f.aereo = true
  if (p.SP === "true") f.sp = true
  if (p.CG === "true") f.cg = true
  if (!f.secao && f.destino) f.secao = suggestSiteSection(f.destino) || ""
  return f
}
