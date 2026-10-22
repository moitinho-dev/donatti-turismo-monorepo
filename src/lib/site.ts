import { findDestination } from "./destinations"
import { slugify } from "./utils"

/** Domínio canônico do site. Mude com NEXT_PUBLIC_SITE_URL se a versão oficial for a com www. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://donattiturismo.com.br").replace(/\/$/, "")
export const SITE_NAME = "Donatti Turismo"
export const WHATSAPP_NUMBER = "5567992167694"
export const PHONE_DISPLAY = "(67) 99216-7694"
export const FALLBACK_IMAGE = "/images/hero-beach.jpg"
export const OG_IMAGE = "/og-image.jpg"
export const LOGO_IMAGE = "/assets/brand/donatti-logo.png"

export const absoluteUrl = (path = "/") => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`)

/**
 * URL pública da foto da promo. Fotos guardadas inline no banco (data URL) são servidas
 * por /api/promos/[id]/image, para não pesar no HTML nem quebrar og:image.
 */
export function promoImageUrl(promo: { id: string; siteImage?: string | null }): string {
  if (!promo.siteImage) return FALLBACK_IMAGE
  if (promo.siteImage.startsWith("data:")) return `/api/promos/${promo.id}/image`
  return promo.siteImage
}

/** Destino canônico da promo: "Maragogi - AL" e "Maceió" viram a mesma página /destinos/maceio */
export function destinationOf(destino: string): { name: string; slug: string; category: string | null } {
  const info = findDestination(destino)
  const name = info?.name || (destino || "").replace(/\s+-\s+.*$/, "").trim() || destino
  return { name, slug: slugify(name), category: info?.category ?? null }
}

/** Título da página de destino: "Pacotes para Maceió", ou "Cruzeiros" */
export const destinationHeading = (name: string) => (name === "Cruzeiro" ? "Cruzeiros" : `Pacotes para ${name}`)

/** Mesmo texto em minúscula no início, para usar no meio de frase: "pacotes para Maceió" */
export const destinationPhrase = (name: string) => (name === "Cruzeiro" ? "cruzeiros" : `pacotes para ${name}`)
