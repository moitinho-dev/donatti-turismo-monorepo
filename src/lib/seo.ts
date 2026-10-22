import type { Metadata } from "next"
import { OG_IMAGE, SITE_NAME } from "./site"

/**
 * Canonical + Open Graph + Twitter de uma página. O Next substitui (não mescla) o
 * openGraph/twitter do layout quando a página define o seu, então repetimos tudo aqui.
 */
export function pageMeta({
  title,
  description,
  path,
  image,
  imageAlt,
  type = "website",
}: {
  title: string
  description: string
  path: string
  image?: string | null
  imageAlt?: string
  type?: "website" | "article"
}): Pick<Metadata, "alternates" | "openGraph" | "twitter"> {
  const img = image || OG_IMAGE
  const images = image
    ? [{ url: img, alt: imageAlt || title }]
    : [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Donatti Turismo: pacotes de viagem com aéreo e hotel" }]
  return {
    alternates: { canonical: path },
    openGraph: { type, locale: "pt_BR", siteName: SITE_NAME, url: path, title, description, images },
    twitter: { card: "summary_large_image", title, description, images: [img] },
  }
}

/** Corta a descrição em ~155 caracteres sem quebrar palavra */
export function clampDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`
}
