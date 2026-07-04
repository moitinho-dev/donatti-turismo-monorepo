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

