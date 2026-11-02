import { NextResponse } from "next/server"
import prisma from "@/lib/db"

/** Imagem enviada para publicação (sem S3/Supabase): é daqui que a Meta baixa */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const media = await prisma.publishedMedia.findUnique({ where: { id } }).catch(() => null)
  if (!media) return new NextResponse(null, { status: 404 })
  return new NextResponse(new Uint8Array(media.data), {
    headers: { "Content-Type": media.contentType, "Cache-Control": "public, max-age=604800, immutable" },
  })
}
