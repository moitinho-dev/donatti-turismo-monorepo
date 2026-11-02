import prisma from "@/lib/db"
import { suggestSiteSection } from "@/lib/destinations"
import { findSiteImageForDestination } from "@/lib/imageSearch"
import { slugify } from "@/lib/utils"

/** Campos do card do site, como chegam da tela (/api/promos) ou montados da promo (/api/publish) */
export interface SiteFieldsInput {
  id?: string
  /** Obrigatório na prática (validado antes); opcional só pelo tipo que o zod gera sem strict */
  DESTINO?: string
  SITE_PUBLISHED?: boolean
  SITE_SECTION?: string | null
  SITE_SLUG?: string | null
  SITE_IMAGE?: string | null
}

export interface SiteFields {
  sitePublished: boolean
  siteSection: string | null
  siteSlug: string | null
  siteImage: string | null
}

/** Slug livre: se outro pacote já usa, acrescenta -2, -3... (siteSlug é único no banco) */
export async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  const base = slugify(slug)
  if (!base) return base
  let candidate = base
  for (let i = 2; i < 50; i++) {
    const taken = await prisma.promo.findFirst({
      where: { siteSlug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    })
    if (!taken) return candidate
    candidate = `${base}-${i}`
  }
  return `${base}-${Date.now().toString(36)}`
}

/** Só um true/false explícito muda a situação no site; sem a chave, fica como está */
export const resolvePublished = (value: boolean | undefined, current: boolean): boolean =>
  typeof value === "boolean" ? value : current

/**
 * Completa os campos do card do site. Ao publicar sem seção ou sem foto, classifica a seção
 * pelo destino e busca uma foto horizontal do próprio destino, para o card nunca ir ao ar
 * com a foto genérica nem na seção errada.
 * `currentPublished`: situação atual da promo (vale quando SITE_PUBLISHED não vem).
 */
export async function resolveSiteFields(data: SiteFieldsInput, currentPublished = false): Promise<SiteFields> {
  const published = resolvePublished(data.SITE_PUBLISHED, currentPublished)
  let section = (data.SITE_SECTION || "").trim() || null
  let image = (data.SITE_IMAGE || "").trim() || null
  const rawSlug = (data.SITE_SLUG || "").trim()

  if (published && !section) {
    section = suggestSiteSection(data.DESTINO) || "nacionais"
  }
  if (published && !image) {
    image = await findSiteImageForDestination(data.DESTINO)
  }

  const slugSource = rawSlug || (published ? data.DESTINO : "")
  const slug = slugSource ? await ensureUniqueSlug(slugSource, data.id) : null

  return { sitePublished: published, siteSection: section, siteSlug: slug || null, siteImage: image }
}
