import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"
import prisma from "@/lib/db"

export interface ElementConfig {
  x: number
  y: number
  fontSize: number
  fontWeight: string
  color: string
  fontFamily: string
  visible: boolean
}

export interface ImageArea {
  id: string
  name: string
  type: "rectangle" | "polygon"
  points: { x: number; y: number }[]
  zIndex: number
  imageUrl?: string
  fit: "cover" | "contain" | "fill"
  visible: boolean
}

export interface LayoutConfig {
  id: string
  name: string
  type: "png" | "svg" | "custom"
  format: "story" | "feed"
  url?: string
  imageUrl?: string
  isDefault?: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  elements: {
    [key: string]: ElementConfig
  }
  imageAreas?: ImageArea[]
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
}

// Default font family for all elements
const DEFAULT_FONT = "'Montserrat', sans-serif"

// Default element configurations
const defaultStoryElements: Record<string, ElementConfig> = {
  region: { x: 766, y: 274, fontSize: 42, fontWeight: "900", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  destination: { x: 480, y: 360, fontSize: 60, fontWeight: "900", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  hotel: { x: 480, y: 450, fontSize: 40, fontWeight: "700", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  dates: { x: 480, y: 530, fontSize: 40, fontWeight: "700", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  installments: { x: 510, y: 620, fontSize: 30, fontWeight: "700", color: "#F79E08", fontFamily: DEFAULT_FONT, visible: true },
  currency: { x: 510, y: 660, fontSize: 60, fontWeight: "900", color: "#F79E08", fontFamily: DEFAULT_FONT, visible: true },
  price: { x: 600, y: 605, fontSize: 114, fontWeight: "900", color: "#F79E08", fontFamily: DEFAULT_FONT, visible: true },
  installmentText: { x: 518, y: 760, fontSize: 28, fontWeight: "600", color: "#F79E08", fontFamily: DEFAULT_FONT, visible: true },
  flight: { x: 545, y: 835, fontSize: 30, fontWeight: "700", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  perPerson: { x: 545, y: 885, fontSize: 30, fontWeight: "700", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  nights: { x: 545, y: 935, fontSize: 30, fontWeight: "700", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  regime: { x: 545, y: 980, fontSize: 30, fontWeight: "700", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  departureLabel: { x: 410, y: 1070, fontSize: 20, fontWeight: "700", color: "#000000", fontFamily: DEFAULT_FONT, visible: true },
  departure: { x: 410, y: 1100, fontSize: 20, fontWeight: "900", color: "#000000", fontFamily: DEFAULT_FONT, visible: true },
  disclaimer: { x: 470, y: 1160, fontSize: 20, fontWeight: "500", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  contactLabel: { x: 580, y: 1250, fontSize: 30, fontWeight: "700", color: "#000000", fontFamily: DEFAULT_FONT, visible: true },
  contact: { x: 580, y: 1285, fontSize: 30, fontWeight: "700", color: "#000000", fontFamily: DEFAULT_FONT, visible: true },
}

const defaultFeedElements: Record<string, ElementConfig> = {
  region: { x: 823, y: 96, fontSize: 42, fontWeight: "900", color: "#002043", fontFamily: DEFAULT_FONT, visible: true },
  destination: { x: 605, y: 185, fontSize: 45, fontWeight: "900", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  hotel: { x: 605, y: 249, fontSize: 36, fontWeight: "700", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  dates: { x: 605, y: 299, fontSize: 36, fontWeight: "700", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  installments: { x: 620, y: 400, fontSize: 25, fontWeight: "700", color: "#002043", fontFamily: DEFAULT_FONT, visible: true },
  currency: { x: 620, y: 422, fontSize: 60, fontWeight: "900", color: "#002043", fontFamily: DEFAULT_FONT, visible: true },
  price: { x: 705, y: 382, fontSize: 92, fontWeight: "900", color: "#002043", fontFamily: DEFAULT_FONT, visible: true },
  installmentText: { x: 677, y: 507, fontSize: 24, fontWeight: "600", color: "#002043", fontFamily: DEFAULT_FONT, visible: true },
  flight: { x: 659, y: 551, fontSize: 27, fontWeight: "700", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  perPerson: { x: 659, y: 592, fontSize: 27, fontWeight: "700", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  nights: { x: 659, y: 633, fontSize: 27, fontWeight: "700", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  regime: { x: 659, y: 674, fontSize: 27, fontWeight: "700", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  departureLabel: { x: 546, y: 740, fontSize: 18, fontWeight: "700", color: "#002043", fontFamily: DEFAULT_FONT, visible: true },
  departure: { x: 546, y: 762, fontSize: 18, fontWeight: "900", color: "#002043", fontFamily: DEFAULT_FONT, visible: true },
  disclaimer: { x: 602, y: 817, fontSize: 18, fontWeight: "500", color: "#FFFFFF", fontFamily: DEFAULT_FONT, visible: true },
  contactLabel: { x: 667, y: 889, fontSize: 28, fontWeight: "700", color: "#002043", fontFamily: DEFAULT_FONT, visible: true },
  contact: { x: 667, y: 927, fontSize: 28, fontWeight: "700", color: "#002043", fontFamily: DEFAULT_FONT, visible: true },
}

const defaultColors = {
  primary: "#DC2626",
  secondary: "#FFFFFF",
  accent: "#FED400",
  background: "#1D3153",
}

// Convert Prisma layout to API format
function toLayoutConfig(layout: {
  id: string
  name: string
  type: string
  format: string
  imageUrl: string | null
  isDefault: boolean
  elements: unknown
  imageAreas: unknown
  colors: unknown
  createdAt: Date
  updatedAt: Date
  createdById: string
}): LayoutConfig {
  return {
    id: layout.id,
    name: layout.name,
    type: layout.type as "png" | "svg" | "custom",
    format: layout.format as "story" | "feed",
    url: layout.imageUrl || undefined,
    imageUrl: layout.imageUrl || undefined,
    isDefault: layout.isDefault,
    createdAt: layout.createdAt.toISOString(),
    updatedAt: layout.updatedAt.toISOString(),
    createdBy: layout.createdById,
    elements: layout.elements as Record<string, ElementConfig>,
    imageAreas: (layout.imageAreas as ImageArea[]) || [],
    colors: layout.colors as { primary: string; secondary: string; accent: string; background: string },
  }
}

// Seed default layouts if none exist
async function seedDefaultLayouts(systemUserId: string) {
  const count = await prisma.layout.count()
  if (count === 0) {
    await prisma.layout.createMany({
      data: [
        {
          id: "default-story",
          name: "Layout Stories Padrão",
          type: "png",
          format: "story",
          imageUrl: "/assets/LAYOUTFINAL.png",
          isDefault: true,
          elements: JSON.parse(JSON.stringify(defaultStoryElements)),
          colors: JSON.parse(JSON.stringify(defaultColors)),
          createdById: systemUserId,
        },
        {
          id: "default-feed",
          name: "Layout Feed Padrão",
          type: "png",
          format: "feed",
          imageUrl: "/assets/LAYOUTFEED.png",
          isDefault: true,
          elements: JSON.parse(JSON.stringify(defaultFeedElements)),
          colors: JSON.parse(JSON.stringify(defaultColors)),
          createdById: systemUserId,
        },
      ],
    })
  }
}

// GET - List all layouts or get specific layout
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    const format = url.searchParams.get("format") as "story" | "feed" | null

    // Seed default layouts if needed
    await seedDefaultLayouts(session.user.id)

    // Return specific layout
    if (id) {
      const layout = await prisma.layout.findUnique({
        where: { id },
      })
      if (!layout) {
        return NextResponse.json({ error: "Layout não encontrado" }, { status: 404 })
      }
      return NextResponse.json(toLayoutConfig(layout))
    }

    // Get all layouts with optional format filter
    const layouts = await prisma.layout.findMany({
      where: format ? { format } : undefined,
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json(layouts.map(toLayoutConfig))
  } catch (error) {
    console.error("Error fetching layouts:", error)
    return NextResponse.json({ error: "Erro ao buscar layouts" }, { status: 500 })
  }
}

// POST - Create new layout
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { name, format, url, elements, colors } = body

    if (!name || !format) {
      return NextResponse.json({ error: "Nome e formato são obrigatórios" }, { status: 400 })
    }

    const defaultElements = format === "story" ? defaultStoryElements : defaultFeedElements
    const defaultUrl = format === "story" ? "/assets/LAYOUTFINAL.png" : "/assets/LAYOUTFEED.png"

    const newLayout = await prisma.layout.create({
      data: {
        name,
        type: url ? "custom" : "png",
        format,
        imageUrl: url || defaultUrl,
        isDefault: false,
        elements: elements || defaultElements,
        colors: colors || defaultColors,
        createdById: session.user.id,
      },
    })

    return NextResponse.json(toLayoutConfig(newLayout), { status: 201 })
  } catch (error) {
    console.error("Error creating layout:", error)
    return NextResponse.json({ error: "Erro ao criar layout" }, { status: 500 })
  }
}

// PUT - Update layout
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, url, elements, imageAreas, colors, isDefault } = body

    if (!id) {
      return NextResponse.json({ error: "ID do layout é obrigatório" }, { status: 400 })
    }

    const existingLayout = await prisma.layout.findUnique({
      where: { id },
    })

    if (!existingLayout) {
      return NextResponse.json({ error: "Layout não encontrado" }, { status: 404 })
    }

    // If setting as default, remove default from others of same format
    if (isDefault) {
      await prisma.layout.updateMany({
        where: {
          format: existingLayout.format,
          id: { not: id },
        },
        data: { isDefault: false },
      })
    }

    const updatedLayout = await prisma.layout.update({
      where: { id },
      data: {
        name: name || undefined,
        imageUrl: url || undefined,
        elements: elements ? JSON.parse(JSON.stringify(elements)) : undefined,
        imageAreas: imageAreas ? JSON.parse(JSON.stringify(imageAreas)) : undefined,
        colors: colors ? JSON.parse(JSON.stringify(colors)) : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
      },
    })

    return NextResponse.json(toLayoutConfig(updatedLayout))
  } catch (error) {
    console.error("Error updating layout:", error)
    return NextResponse.json({ error: "Erro ao atualizar layout" }, { status: 500 })
  }
}

// DELETE - Delete layout
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID do layout é obrigatório" }, { status: 400 })
    }

    const layout = await prisma.layout.findUnique({
      where: { id },
    })

    if (!layout) {
      return NextResponse.json({ error: "Layout não encontrado" }, { status: 404 })
    }

    // Prevent deletion of system default layouts
    if (layout.id.startsWith("default-")) {
      return NextResponse.json({ error: "Não é possível deletar layouts do sistema" }, { status: 403 })
    }

    await prisma.layout.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Layout deletado com sucesso" })
  } catch (error) {
    console.error("Error deleting layout:", error)
    return NextResponse.json({ error: "Erro ao deletar layout" }, { status: 500 })
  }
}
