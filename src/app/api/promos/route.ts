import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"
import { z } from "zod"
import prisma from "@/lib/db"
import { publishPromoPost } from "@/lib/googleBusiness"
import { suggestSiteSection } from "@/lib/destinations"
import { findSiteImageForDestination } from "@/lib/imageSearch"
import { slugify } from "@/lib/utils"

// Schema for promo validation
const promoSchema = z.object({
  id: z.string().optional(),
  DESTINO: z.string().min(1, "Destino é obrigatório"),
  HOTEL: z.string().min(1, "Hotel é obrigatório"),
  DATA_FORMATADA: z.string().min(1, "Data é obrigatória"),
  VALOR: z.string().min(1, "Valor é obrigatório"),
  PARCELAS: z.union([z.string(), z.number()]).optional(),
  COM_CAFE: z.boolean().optional(),
  SEM_CAFE: z.boolean().optional(),
  MEIA_PENSAO: z.boolean().optional(),
  PENSAO_COMPLETA: z.boolean().optional(),
  ALL_INCLUSIVE: z.boolean().optional(),
  NUMERO_DE_NOITES: z.string().min(1, "Número de noites é obrigatório"),
  SP: z.boolean().optional(),
  CG: z.boolean().optional(),
  AEREO: z.boolean().optional(),
  SITE_PUBLISHED: z.boolean().optional(),
  SITE_SECTION: z.string().optional(),
  SITE_SLUG: z.string().optional(),
  SITE_IMAGE: z.string().optional(),
  SITE_DESCRIPTION: z.string().optional(),
  SITE_INCLUSIONS: z.array(z.string()).optional(),
  SITE_DEPARTURES: z.array(z.string()).optional(),
  VALOR_ORIGINAL: z.string().nullable().optional(),
  CAMPAIGN: z.string().nullable().optional(),
})

// Convert database promo to API format
function toApiFormat(promo: {
  id: string
  destino: string
  hotel: string
  dataFormatada: string
  valor: string
  parcelas: number
  comCafe: boolean
  semCafe: boolean
  meiaPensao: boolean
  pensaoCompleta: boolean
  allInclusive: boolean
  numeroDeNoites: string
  sp: boolean
  cg: boolean
  aereo: boolean
  sitePublished: boolean
  siteSection: string | null
  siteSlug: string | null
  siteImage: string | null
  siteDescription: string | null
  siteInclusions: string[]
  siteDepartures: string[]
  valorOriginal: string | null
  campaign: string | null
  createdAt: Date
  updatedAt: Date
  createdById: string
  createdBy?: { name: string | null }
}) {
  return {
    id: promo.id,
    DESTINO: promo.destino,
    HOTEL: promo.hotel,
    DATA_FORMATADA: promo.dataFormatada,
    VALOR: promo.valor,
    PARCELAS: promo.parcelas,
    COM_CAFE: promo.comCafe,
    SEM_CAFE: promo.semCafe,
    MEIA_PENSAO: promo.meiaPensao,
    PENSAO_COMPLETA: promo.pensaoCompleta,
    ALL_INCLUSIVE: promo.allInclusive,
    NUMERO_DE_NOITES: promo.numeroDeNoites,
    SP: promo.sp,
    CG: promo.cg,
    AEREO: promo.aereo,
    SITE_PUBLISHED: promo.sitePublished,
    SITE_SECTION: promo.siteSection,
    SITE_SLUG: promo.siteSlug,
    SITE_IMAGE: promo.siteImage,
    SITE_DESCRIPTION: promo.siteDescription,
    SITE_INCLUSIONS: promo.siteInclusions,
    SITE_DEPARTURES: promo.siteDepartures,
    VALOR_ORIGINAL: promo.valorOriginal,
    CAMPAIGN: promo.campaign,
    createdAt: promo.createdAt.toISOString(),
    updatedAt: promo.updatedAt.toISOString(),
    createdBy: promo.createdById,
    createdByName: promo.createdBy?.name || null,
  }
}

/** Só guarda o preço "de" quando ele é maior que o preço "por" — senão não há desconto a mostrar */
function normalizeValorOriginal(original: string | null | undefined, valor: string) {
  const de = parseFloat(String(original ?? ""))
  const por = parseFloat(valor)
  return Number.isFinite(de) && Number.isFinite(por) && de > por ? de.toFixed(2) : null
}

/** Slug livre: se outro pacote já usa, acrescenta -2, -3... (siteSlug é único no banco) */
async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
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

/**
 * Completa os campos do card do site. Ao publicar sem seção ou sem foto, classifica a seção
 * pelo destino e busca uma foto horizontal do próprio destino, para o card nunca ir ao ar
 * com a foto genérica nem na seção errada.
 */
async function resolveSiteFields(data: z.infer<typeof promoSchema>) {
  const published = data.SITE_PUBLISHED || false
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

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const userId = url.searchParams.get("userId")

    // If ID is provided, return specific promo
    if (id) {
      const promo = await prisma.promo.findUnique({
        where: { id },
        include: { createdBy: { select: { name: true } } },
      })
      if (!promo) {
        return NextResponse.json({ error: "Promoção não encontrada" }, { status: 404 })
      }
      return NextResponse.json(toApiFormat(promo))
    }

    // Build where clause for filters
    const where: {
      createdAt?: { gte?: Date; lte?: Date }
      createdById?: string
    } = {}

    // Filter by date range if provided
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Filter by user ID
    if (userId && session.user.role === "admin") {
      where.createdById = userId
    } else if (session.user.role === "agent") {
      // Agents can only see their own promos
      where.createdById = session.user.id
    }

    // Get promos from database
    const promos = await prisma.promo.findMany({
      where,
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(promos.map(toApiFormat))
  } catch (error) {
    console.error("Error fetching promos:", error)
    return NextResponse.json({ error: "Erro ao buscar promoções" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()

    // Validate promo data
    const validationResult = promoSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validationResult.error.format() }, { status: 400 })
    }

    const data = validationResult.data
    const isUpdate = !!data.id

    // Parse parcelas to number
    const parcelas = typeof data.PARCELAS === "string" ? parseInt(data.PARCELAS, 10) || 15 : data.PARCELAS || 15
    const siteFields = await resolveSiteFields(data)

    if (isUpdate) {
      // Check if promo exists
      const existingPromo = await prisma.promo.findUnique({
        where: { id: data.id },
      })

      if (!existingPromo) {
        return NextResponse.json({ error: "Promoção não encontrada" }, { status: 404 })
      }

      // Check permission to update
      if (session.user.role !== "admin" && existingPromo.createdById !== session.user.id) {
        return NextResponse.json({ error: "Você não tem permissão para editar esta promoção" }, { status: 403 })
      }

      // Update promo
      const updatedPromo = await prisma.promo.update({
        where: { id: data.id },
        data: {
          destino: data.DESTINO,
          hotel: data.HOTEL,
          dataFormatada: data.DATA_FORMATADA,
          valor: data.VALOR,
          parcelas,
          comCafe: data.COM_CAFE || false,
          semCafe: data.SEM_CAFE || false,
          meiaPensao: data.MEIA_PENSAO || false,
          pensaoCompleta: data.PENSAO_COMPLETA || false,
          allInclusive: data.ALL_INCLUSIVE || false,
          numeroDeNoites: data.NUMERO_DE_NOITES,
          sp: data.SP || false,
          cg: data.CG || false,
          aereo: data.AEREO || false,
          ...siteFields,
          siteDescription: data.SITE_DESCRIPTION || null,
          siteInclusions: data.SITE_INCLUSIONS || [],
          siteDepartures: data.SITE_DEPARTURES || [],
          valorOriginal: normalizeValorOriginal(data.VALOR_ORIGINAL, data.VALOR),
          campaign: data.CAMPAIGN || null,
        },
        include: { createdBy: { select: { name: true } } },
      })

      // Auto-post to Google Business when publishing to the site (best-effort)
      if (updatedPromo.sitePublished) {
        publishPromoPost(updatedPromo.id).catch((err) => {
          console.error("Google Business post error:", err)
        })
      }

      return NextResponse.json(toApiFormat(updatedPromo))
    } else {
      // Create new promo
      const newPromo = await prisma.promo.create({
        data: {
          destino: data.DESTINO,
          hotel: data.HOTEL,
          dataFormatada: data.DATA_FORMATADA,
          valor: data.VALOR,
          parcelas,
          comCafe: data.COM_CAFE || false,
          semCafe: data.SEM_CAFE || false,
          meiaPensao: data.MEIA_PENSAO || false,
          pensaoCompleta: data.PENSAO_COMPLETA || false,
          allInclusive: data.ALL_INCLUSIVE || false,
          numeroDeNoites: data.NUMERO_DE_NOITES,
          sp: data.SP || false,
          cg: data.CG || false,
          aereo: data.AEREO || false,
          ...siteFields,
          siteDescription: data.SITE_DESCRIPTION || null,
          siteInclusions: data.SITE_INCLUSIONS || [],
          siteDepartures: data.SITE_DEPARTURES || [],
          valorOriginal: normalizeValorOriginal(data.VALOR_ORIGINAL, data.VALOR),
          campaign: data.CAMPAIGN || null,
          createdById: session.user.id,
        },
        include: { createdBy: { select: { name: true } } },
      })

      if (newPromo.sitePublished) {
        publishPromoPost(newPromo.id).catch((err) => {
          console.error("Google Business post error:", err)
        })
      }

      return NextResponse.json(toApiFormat(newPromo), { status: 201 })
    }
  } catch (error) {
    console.error("Error saving promo:", error)
    return NextResponse.json({ error: "Erro ao salvar promoção" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get promo ID from query
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID da promoção não fornecido" }, { status: 400 })
    }

    // Check if promo exists
    const promo = await prisma.promo.findUnique({
      where: { id },
    })

    if (!promo) {
      return NextResponse.json({ error: "Promoção não encontrada" }, { status: 404 })
    }

    // Check if user has permission to delete
    if (session.user.role !== "admin" && promo.createdById !== session.user.id) {
      return NextResponse.json({ error: "Você não tem permissão para excluir esta promoção" }, { status: 403 })
    }

    // Delete promo
    await prisma.promo.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Promoção excluída com sucesso" })
  } catch (error) {
    console.error("Error deleting promo:", error)
    return NextResponse.json({ error: "Erro ao excluir promoção" }, { status: 500 })
  }
}
