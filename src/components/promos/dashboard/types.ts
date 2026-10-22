import { isPromoExpired } from "@/lib/utils"

export interface UserData {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
}

export interface PromoData {
  id: string
  DESTINO: string
  HOTEL: string
  DATA_FORMATADA: string
  VALOR: string
  PARCELAS?: string | number
  COM_CAFE?: boolean
  SEM_CAFE?: boolean
  MEIA_PENSAO?: boolean
  PENSAO_COMPLETA?: boolean
  ALL_INCLUSIVE?: boolean
  NUMERO_DE_NOITES?: string
  SP?: boolean
  CG?: boolean
  AEREO?: boolean
  SITE_PUBLISHED?: boolean
  SITE_SECTION?: string | null
  SITE_SLUG?: string | null
  SITE_IMAGE?: string | null
  SITE_DESCRIPTION?: string | null
  SITE_INCLUSIONS?: string[]
  SITE_DEPARTURES?: string[]
  VALOR_ORIGINAL?: string | null
  CAMPAIGN?: string | null
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  createdByName?: string | null
}

export type ViewMode = "grid" | "list"
export type ActivePanel = "list" | "form" | "editor" | "stats"

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

export function getRegimeLabel(promo: PromoData) {
  if (promo.ALL_INCLUSIVE) return "All Inclusive"
  if (promo.PENSAO_COMPLETA) return "Pensão Completa"
  if (promo.MEIA_PENSAO) return "Meia Pensão"
  if (promo.COM_CAFE) return "Com Café"
  if (promo.SEM_CAFE) return "Sem Café"
  return "-"
}

export function getDepartureLabel(promo: PromoData) {
  const airports = []
  if (promo.CG) airports.push("CGR")
  if (promo.SP) airports.push("GRU")
  return airports.length > 0 ? airports.join(" / ") : "-"
}

export function formatPrice(promo: PromoData) {
  const value = parseFloat(promo.VALOR || "0")
  const parcelas = parseInt(String(promo.PARCELAS || "15"))
  const installment = value / parcelas
  return installment.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export type PromoStatus = "no-site" | "rascunho" | "vencida"

/** Vencida = data de ida já passou (o site esconde automaticamente, publicada ou não) */
export function getPromoStatus(promo: PromoData): PromoStatus {
  if (isPromoExpired(promo.DATA_FORMATADA)) return "vencida"
  return promo.SITE_PUBLISHED ? "no-site" : "rascunho"
}
