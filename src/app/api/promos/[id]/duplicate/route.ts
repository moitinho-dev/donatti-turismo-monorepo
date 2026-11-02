import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/db"
import { toApiFormat } from "@/lib/promoApi"

/**
 * Cópia de uma promo com os mesmos dados da oferta, para virar outra (outra data, outro hotel...).
 * A cópia nasce fora do site e sem posts, artes ou histórico de publicação; o dono é quem duplicou.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const original = await prisma.promo.findUnique({ where: { id } })
    if (!original) return NextResponse.json({ error: "Promoção não encontrada" }, { status: 404 })

    if (session.user.role !== "admin" && original.createdById !== session.user.id) {
      return NextResponse.json({ error: "Você não tem permissão para duplicar esta promoção" }, { status: 403 })
    }

    const copy = await prisma.promo.create({
      data: {
        destino: original.destino,
        hotel: original.hotel,
        dataFormatada: original.dataFormatada,
        valor: original.valor,
        valorOriginal: original.valorOriginal,
        parcelas: original.parcelas,
        comCafe: original.comCafe,
        semCafe: original.semCafe,
        meiaPensao: original.meiaPensao,
        pensaoCompleta: original.pensaoCompleta,
        allInclusive: original.allInclusive,
        numeroDeNoites: original.numeroDeNoites,
        sp: original.sp,
        cg: original.cg,
        aereo: original.aereo,
        siteSection: original.siteSection,
        siteDescription: original.siteDescription,
        siteInclusions: original.siteInclusions,
        siteDepartures: original.siteDepartures,
        siteImage: original.siteImage,
        campaign: original.campaign,
        // O endereço no site é único e a cópia ainda não foi publicada em lugar nenhum
        sitePublished: false,
        siteSlug: null,
        createdById: session.user.id,
      },
      include: { createdBy: { select: { name: true } } },
    })

    return NextResponse.json(toApiFormat(copy), { status: 201 })
  } catch (error) {
    console.error("Error duplicating promo:", error)
    return NextResponse.json({ error: "Erro ao duplicar promoção" }, { status: 500 })
  }
}
