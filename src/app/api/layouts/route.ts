import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"
import { nanoid } from "nanoid"
import { redis, REDIS_KEYS } from "@/lib/redis"

export interface ElementConfig {
  x: number
  y: number
  fontSize: number
  fontWeight: string
  color: string
  fontFamily: string
  visible: boolean
}

export interface LayoutConfig {
  id: string
  name: string
  type: "png" | "svg" | "custom"
  format: "story" | "feed"
  url?: string
  isDefault?: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  elements: {
    [key: string]: ElementConfig
  }
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

    let layouts = (await redis.get<LayoutConfig[]>(REDIS_KEYS.LAYOUTS)) || []

    // If no layouts exist, create default ones
    if (layouts.length === 0) {
      const now = new Date().toISOString()
      const defaultLayouts: LayoutConfig[] = [
        {
          id: "default-story",
          name: "Layout Stories Padrão",
          type: "png",
          format: "story",
          url: "/assets/LAYOUTFINAL.png",
          isDefault: true,
          createdAt: now,
          updatedAt: now,
          createdBy: "system",
          elements: defaultStoryElements,
          colors: defaultColors,
        },
        {
          id: "default-feed",
          name: "Layout Feed Padrão",
          type: "png",
          format: "feed",
          url: "/assets/LAYOUTFEED.png",
          isDefault: true,
          createdAt: now,
          updatedAt: now,
          createdBy: "system",
          elements: defaultFeedElements,
          colors: defaultColors,
        },
      ]
      await redis.set(REDIS_KEYS.LAYOUTS, defaultLayouts)
      layouts = defaultLayouts
    }

    // Return specific layout
    if (id) {
      const layout = layouts.find((l) => l.id === id)
      if (!layout) {
        return NextResponse.json({ error: "Layout não encontrado" }, { status: 404 })
      }
      return NextResponse.json(layout)
    }

    // Filter by format if provided
    if (format) {
      layouts = layouts.filter((l) => l.format === format)
    }

    // Sort: default layouts first, then by creation date
    layouts.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json(layouts)
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

    const now = new Date().toISOString()
    const defaultElements = format === "story" ? defaultStoryElements : defaultFeedElements

    const newLayout: LayoutConfig = {
      id: nanoid(),
      name,
      type: url ? "custom" : "png",
      format,
      url: url || (format === "story" ? "/assets/LAYOUTFINAL.png" : "/assets/LAYOUTFEED.png"),
      isDefault: false,
      createdAt: now,
      updatedAt: now,
      createdBy: session.user.id,
      elements: elements || defaultElements,
      colors: colors || defaultColors,
    }

    const layouts = (await redis.get<LayoutConfig[]>(REDIS_KEYS.LAYOUTS)) || []
    layouts.push(newLayout)
    await redis.set(REDIS_KEYS.LAYOUTS, layouts)

    return NextResponse.json(newLayout, { status: 201 })
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
    const { id, name, url, elements, colors, isDefault } = body

    if (!id) {
      return NextResponse.json({ error: "ID do layout é obrigatório" }, { status: 400 })
    }

    const layouts = (await redis.get<LayoutConfig[]>(REDIS_KEYS.LAYOUTS)) || []
    const layoutIndex = layouts.findIndex((l) => l.id === id)

    if (layoutIndex === -1) {
      return NextResponse.json({ error: "Layout não encontrado" }, { status: 404 })
    }

    const existingLayout = layouts[layoutIndex]

    // If setting as default, remove default from others of same format
    if (isDefault) {
      layouts.forEach((l, i) => {
        if (l.format === existingLayout.format && l.id !== id) {
          layouts[i] = { ...l, isDefault: false }
        }
      })
    }

    const updatedLayout: LayoutConfig = {
      ...existingLayout,
      name: name || existingLayout.name,
      url: url || existingLayout.url,
      elements: elements || existingLayout.elements,
      colors: colors || existingLayout.colors,
      isDefault: isDefault !== undefined ? isDefault : existingLayout.isDefault,
      updatedAt: new Date().toISOString(),
    }

    layouts[layoutIndex] = updatedLayout
    await redis.set(REDIS_KEYS.LAYOUTS, layouts)

    return NextResponse.json(updatedLayout)
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

    const layouts = (await redis.get<LayoutConfig[]>(REDIS_KEYS.LAYOUTS)) || []
    const layout = layouts.find((l) => l.id === id)

    if (!layout) {
      return NextResponse.json({ error: "Layout não encontrado" }, { status: 404 })
    }

    // Prevent deletion of system default layouts
    if (layout.createdBy === "system") {
      return NextResponse.json({ error: "Não é possível deletar layouts do sistema" }, { status: 403 })
    }

    const updatedLayouts = layouts.filter((l) => l.id !== id)
    await redis.set(REDIS_KEYS.LAYOUTS, updatedLayouts)

    return NextResponse.json({ success: true, message: "Layout deletado com sucesso" })
  } catch (error) {
    console.error("Error deleting layout:", error)
    return NextResponse.json({ error: "Erro ao deletar layout" }, { status: 500 })
  }
}
