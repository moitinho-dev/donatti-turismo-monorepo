import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"

const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8MB
const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"])
const allowedExtensions = new Set(["png", "jpg", "jpeg", "webp", "svg"])
const mimeToExtension: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const format = (formData.get("format") as string) || "story"

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

    if (!extension || (!allowedMimeTypes.has(mimeType) && !allowedExtensions.has(extension))) {
      return NextResponse.json({ error: "Formato de arquivo não suportado" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadDir = path.join(process.cwd(), "public", "uploads", "layouts")
    await fs.mkdir(uploadDir, { recursive: true })

    const randomKey = crypto.randomBytes(6).toString("hex")
    const filename = `${Date.now()}-${randomKey}.${extension}`
    const filePath = path.join(uploadDir, filename)
    await fs.writeFile(filePath, buffer)

    const url = `/uploads/layouts/${filename}`
    const baseName = originalName.replace(/\.[^/.]+$/, "")

    return NextResponse.json({
      url,
      id: `uploaded-${Date.now()}-${randomKey}`,
      originalName: baseName,
      name: `${format === "feed" ? "Feed" : "Story"} - ${baseName}`,
    })
  } catch (error) {
    console.error("Erro ao processar upload do layout:", error)
    return NextResponse.json({ error: "Erro ao processar upload" }, { status: 500 })
  }
}

