import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"
import prisma from "@/lib/db"
import type { ElementConfig } from "../route"

const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8MB
const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"])
const allowedExtensions = new Set(["png", "jpg", "jpeg", "webp", "svg"])
const mimeToExtension: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}
const extensionToMime: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
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

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    console.log("[UPLOAD] Starting upload request...")

    const session = await getServerSession(authOptions)
    console.log("[UPLOAD] Session:", session ? `User: ${session.user?.id}` : "No session")

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const format = (formData.get("format") as "story" | "feed") || "story"
    const layoutName = formData.get("name") as string

    console.log("[UPLOAD] File received:", file ? `${(file as File).name} (${(file as File).size} bytes)` : "No file")
    console.log("[UPLOAD] Format:", format, "Name:", layoutName)

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "O arquivo deve ter no máximo 8MB" }, { status: 400 })
    }

    const mimeType = file.type || ""
    const originalName = file.name || "layout"
    const extensionFromName = originalName.split(".").pop()?.toLowerCase()
    const extension =
      (extensionFromName && allowedExtensions.has(extensionFromName) && extensionFromName) ||
      mimeToExtension[mimeType] ||
      null

    console.log("[UPLOAD] MIME type:", mimeType, "Extension:", extension)

    if (!extension || (!allowedMimeTypes.has(mimeType) && !allowedExtensions.has(extension))) {
      return NextResponse.json({ error: "Formato de arquivo não suportado" }, { status: 400 })
    }

    // Read file as buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    console.log("[UPLOAD] Buffer size:", buffer.length)

    // Persist image:
    // - Prefer writing to /public for self-hosted Node deployments
    // - Fallback to storing as data URL (works on read-only FS environments, e.g. Vercel)
    let imageUrl: string
    try {
      // Save file to public/uploads/layouts
      const uploadDir = path.join(process.cwd(), "public", "uploads", "layouts")
      await fs.mkdir(uploadDir, { recursive: true })
      console.log("[UPLOAD] Upload dir:", uploadDir)

      const randomKey = crypto.randomBytes(6).toString("hex")
      const filename = `${Date.now()}-${randomKey}.${extension}`
      const filePath = path.join(uploadDir, filename)
      await fs.writeFile(filePath, buffer)
      console.log("[UPLOAD] File saved to:", filePath)

      // URL path for the uploaded file
      imageUrl = `/uploads/layouts/${filename}`
    } catch (fsError) {
      console.warn("[UPLOAD] Filesystem write failed, falling back to data URL:", fsError)
      const safeMime = (allowedMimeTypes.has(mimeType) && mimeType) || extensionToMime[extension] || "application/octet-stream"
      imageUrl = `data:${safeMime};base64,${buffer.toString("base64")}`
    }

    const baseName = originalName.replace(/\.[^/.]+$/, "")
    const name = layoutName || `${format === "feed" ? "Feed" : "Story"} - ${baseName}`

    console.log("[UPLOAD] Creating layout in database...")

    // Create new layout in database
    const elements = format === "story" ? defaultStoryElements : defaultFeedElements
    const newLayout = await prisma.layout.create({
      data: {
        name,
        type: "custom",
        format,
        imageUrl,
        isDefault: false,
        elements: JSON.parse(JSON.stringify(elements)),
        colors: JSON.parse(JSON.stringify(defaultColors)),
        createdById: session.user.id,
      },
    })

    console.log("[UPLOAD] Layout created:", newLayout.id)

    const publicImageUrl = newLayout.imageUrl?.startsWith("data:") ? `/api/layouts/image?id=${newLayout.id}` : newLayout.imageUrl

    // Return layout in expected format
    return NextResponse.json(
      {
        id: newLayout.id,
        name: newLayout.name,
        type: newLayout.type,
        format: newLayout.format,
        url: publicImageUrl,
        imageUrl: publicImageUrl,
        isDefault: newLayout.isDefault,
        createdAt: newLayout.createdAt.toISOString(),
        updatedAt: newLayout.updatedAt.toISOString(),
        createdBy: newLayout.createdById,
        elements: newLayout.elements,
        colors: newLayout.colors,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[UPLOAD] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: `Erro ao processar upload: ${errorMessage}` }, { status: 500 })
  }
}
