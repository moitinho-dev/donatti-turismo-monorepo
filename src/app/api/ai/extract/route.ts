import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { describeAiError } from "@/lib/ai/config"
import { AiRefusalError, extractPromo, type ExtractionInput } from "@/lib/ai/claude"
import { sniffImageType } from "@/lib/storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 120

const MAX_FILE = 15 * 1024 * 1024

/** Lê PDF, print (PNG/JPG/WEBP) ou texto colado e devolve os campos da promo */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    let input: ExtractionInput
    const form = await req.formData()
    const file = form.get("file")
    const text = String(form.get("text") || "").trim()

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_FILE) return NextResponse.json({ error: "Arquivo maior que 15MB" }, { status: 400 })
      const buffer = Buffer.from(await file.arrayBuffer())
      if (buffer.subarray(0, 5).toString() === "%PDF-") {
        input = { kind: "pdf", base64: buffer.toString("base64") }
      } else {
        const mediaType = sniffImageType(buffer)
        if (!mediaType) return NextResponse.json({ error: "Envie PDF, PNG, JPG ou WEBP" }, { status: 400 })
        input = { kind: "image", base64: buffer.toString("base64"), mediaType: mediaType as "image/png" | "image/jpeg" | "image/webp" }
      }
    } else if (text) {
      input = { kind: "text", text: text.slice(0, 50_000) }
    } else {
      return NextResponse.json({ error: "Envie um arquivo ou cole o texto da promoção" }, { status: 400 })
    }

    const fields = await extractPromo(input)
    return NextResponse.json({ fields })
  } catch (error) {
    if (error instanceof AiRefusalError) return NextResponse.json({ error: error.message }, { status: 422 })
    console.error("AI extract error:", error)
    const { message, status } = describeAiError(error, "Não foi possível ler o material. Tente outro arquivo ou preencha à mão.")
    return NextResponse.json({ error: message }, { status })
  }
}
