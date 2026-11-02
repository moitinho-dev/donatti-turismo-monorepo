import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({ default: { promo: { findFirst: vi.fn() } } }))
vi.mock("@/lib/imageSearch", () => ({ findSiteImageForDestination: vi.fn() }))

import prisma from "@/lib/db"
import { findSiteImageForDestination } from "@/lib/imageSearch"
import { resolvePublished, resolveSiteFields } from "./siteFields"

const findFirst = (prisma as unknown as { promo: { findFirst: ReturnType<typeof vi.fn> } }).promo.findFirst

beforeEach(() => {
  vi.clearAllMocks()
  findFirst.mockResolvedValue(null)
  vi.mocked(findSiteImageForDestination).mockResolvedValue("https://img.example/destino.jpg")
})

describe("resolvePublished", () => {
  it("só um true/false explícito muda a situação no site", () => {
    expect(resolvePublished(true, false)).toBe(true)
    expect(resolvePublished(false, true)).toBe(false)
  })

  it("sem a chave, a promo fica como está", () => {
    expect(resolvePublished(undefined, true)).toBe(true)
    expect(resolvePublished(undefined, false)).toBe(false)
  })
})

describe("resolveSiteFields", () => {
  it("sem SITE_PUBLISHED mantém a promo no site (o Studio salvando a oferta não tira do site)", async () => {
    const out = await resolveSiteFields(
      { id: "p1", DESTINO: "Maceió", SITE_SECTION: "nordeste", SITE_SLUG: "maceio", SITE_IMAGE: "https://img.example/m.jpg" },
      true,
    )
    expect(out).toEqual({ sitePublished: true, siteSection: "nordeste", siteSlug: "maceio", siteImage: "https://img.example/m.jpg" })
  })

  it("false explícito tira do site mesmo com a promo publicada", async () => {
    const out = await resolveSiteFields({ id: "p1", DESTINO: "Maceió", SITE_PUBLISHED: false, SITE_SLUG: "maceio" }, true)
    expect(out.sitePublished).toBe(false)
  })

  it("promo nova sem SITE_PUBLISHED fica fora do site e sem campos inventados", async () => {
    const out = await resolveSiteFields({ DESTINO: "Maceió" })
    expect(out).toEqual({ sitePublished: false, siteSection: null, siteSlug: null, siteImage: null })
    expect(findSiteImageForDestination).not.toHaveBeenCalled()
  })

  it("ao publicar completa seção, foto do destino e slug único", async () => {
    findFirst.mockImplementation(async ({ where }: { where: { siteSlug: string } }) => (where.siteSlug === "maceio" ? { id: "outra" } : null))
    const out = await resolveSiteFields({ id: "p1", DESTINO: "Maceió", SITE_PUBLISHED: true })
    expect(out.sitePublished).toBe(true)
    expect(out.siteSection).toBeTruthy()
    expect(out.siteImage).toBe("https://img.example/destino.jpg")
    expect(out.siteSlug).toBe("maceio-2")
    expect(findFirst).toHaveBeenCalledWith({ where: { siteSlug: "maceio", NOT: { id: "p1" } }, select: { id: true } })
  })
})
