import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_SIZE = 8 * 1024 * 1024 // 8MB

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { imageBase64, filename } = body as {
      imageBase64?: string
      filename?: string
    }

    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 obrigatorio" }, { status: 400 })
    }

    const buffer = Buffer.from(imageBase64, "base64")
    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ error: "Imagem muito grande (max 8MB)" }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const safeName = (filename || `promo-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "_")
    const path = `instagram/${Date.now()}-${safeName}.jpg`

    const { error: uploadError } = await supabase.storage
      .from("promo-images")
      .upload(path, buffer, {
        contentType: "image/jpeg",
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Upload falhou: ${uploadError.message}`)
    }

    const { data: publicUrlData } = supabase.storage
      .from("promo-images")
      .getPublicUrl(path)

    return NextResponse.json({ publicUrl: publicUrlData.publicUrl })
  } catch (error) {
    console.error("Instagram upload error:", error)
    const message = error instanceof Error ? error.message : "Erro ao fazer upload"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
