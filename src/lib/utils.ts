import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Shared category labels used across destino/pacote pages */
export const categoryLabels: Record<string, string> = {
  nacionais: "Pacotes Nacionais",
  internacionais: "Pacotes Internacionais",
  cruzeiros: "Cruzeiros",
  "lua-de-mel": "Lua de Mel",
  religioso: "Turismo Religioso",
  nordeste: "Nordeste",
}

export const getSectionLabel = (section?: string | null) => {
  if (!section) return "Pacote"
  if (categoryLabels[section]) return categoryLabels[section]
  return section.charAt(0).toUpperCase() + section.slice(1)
}

/** Slugify a string for URL-safe identifiers */
export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

/** Compute promo page slug from siteSlug or fallback to destino + id */
export const computeSlug = (promo: {
  siteSlug: string | null
  destino: string
  id: string
}) => promo.siteSlug || `${slugify(promo.destino || "destino")}-${promo.id.slice(0, 6)}`

/** Parse a Brazilian-formatted price string into a number */
export const getPriceNumber = (valor: string) => {
  const raw = String(valor ?? "").trim()
  if (!raw) return 0

  const cleaned = raw.replace(/[^\d.,-]/g, "")
  if (!cleaned) return 0

  if (cleaned.includes(".") && cleaned.includes(",")) {
    const normalized = cleaned.replace(/\./g, "").replace(/,/g, ".")
    const n = Number.parseFloat(normalized)
    return Number.isFinite(n) ? n : 0
  }

  if (cleaned.includes(",")) {
    const normalized = cleaned.replace(/,/g, ".")
    const n = Number.parseFloat(normalized)
    return Number.isFinite(n) ? n : 0
  }

  if (cleaned.includes(".")) {
    const parts = cleaned.split(".")
    if (parts.length > 2) {
      const normalized = parts.join("")
      const n = Number.parseFloat(normalized)
      return Number.isFinite(n) ? n : 0
    }

    if (parts.length === 2 && parts[1]?.length === 3 && (parts[0]?.length ?? 0) <= 3) {
      const normalized = parts.join("")
      const n = Number.parseFloat(normalized)
      return Number.isFinite(n) ? n : 0
    }
  }

  const n = Number.parseFloat(cleaned)
  if (Number.isFinite(n)) return n

  const digitsOnly = cleaned.replace(/[^\d-]/g, "")
  const fallback = Number.parseFloat(digitsOnly)
  return Number.isFinite(fallback) ? fallback : 0
}


/**
 * Lê as datas de uma promo a partir do texto salvo em DATA_FORMATADA.
 * Aceita "15/07 até 22/07 de 2026" (formato do painel) e "15/07/2026" ou "15 a 20/07/2026".
 * O ano informado é o da volta; se a ida for em mês posterior à volta, a ida é no ano anterior.
 */
export const parsePromoDates = (dataFormatada: string): { start: Date | null; end: Date | null } => {
  const text = String(dataFormatada ?? "")

  const range = text.match(/(\d{1,2})\/(\d{1,2})\s*(?:at[eé]|a|-)\s*(\d{1,2})\/(\d{1,2})\s*(?:de\s*)?(\d{4})/i)
  if (range) {
    const [, d1, m1, d2, m2, y] = range.map(Number)
    const end = new Date(y, m2 - 1, d2)
    const start = new Date(m1 > m2 ? y - 1 : y, m1 - 1, d1)
    return { start, end }
  }

  const single = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (single) {
    const [, d, m, y] = single.map(Number)
    const date = new Date(y, m - 1, d)
    return { start: date, end: date }
  }

  return { start: null, end: null }
}

/** Promo cuja data de ida já passou (com 1 dia de tolerância). Datas ilegíveis não expiram. */
export const isPromoExpired = (dataFormatada: string, now: Date = new Date()) => {
  const { start } = parsePromoDates(dataFormatada)
  if (!start) return false
  const threshold = new Date(now)
  threshold.setDate(threshold.getDate() - 1)
  threshold.setHours(0, 0, 0, 0)
  return start < threshold
}
