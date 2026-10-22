import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { parseDataUrl } from "@/lib/storage"

/** Serve a foto de uma promo publicada guardada inline no banco (sem S3/Supabase) */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const promo = await prisma.promo.findFirst({ where: { id, sitePublished: true }, select: { siteImage: true } })
  if (!promo?.siteImage) return new NextResponse(null, { status: 404 })
  if (!promo.siteImage.startsWith("data:")) return NextResponse.redirect(new URL(promo.siteImage, req.url), 308)
  try {
    const { buffer, contentType } = parseDataUrl(promo.siteImage)
    return new NextResponse(new Uint8Array(buffer), {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
