import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"
import prisma from "@/lib/db"

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get data from request body
    const data = await req.json()

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Dados inválidos. Esperado um array." }, { status: 400 })
    }

    let migrated = 0

    for (const promo of data) {
      const destino = promo.DESTINO || promo.destino || ""
      const hotel = promo.HOTEL || promo.hotel || ""
      const dataFormatada = promo.DATA_FORMATADA || promo.dataFormatada || ""
      const valor = promo.VALOR || promo.valor || ""
      const numeroDeNoites = promo.NUMERO_DE_NOITES || promo.numeroDeNoites || ""
      const createdById = promo.createdBy || promo.createdById || session.user.id

      if (!destino || !hotel || !valor) continue

      await prisma.promo.create({
        data: {
          destino,
          hotel,
          dataFormatada,
          valor,
          parcelas: typeof promo.PARCELAS === "number" ? promo.PARCELAS : parseInt(promo.PARCELAS || "15", 10),
          comCafe: promo.COM_CAFE || promo.comCafe || false,
          semCafe: promo.SEM_CAFE || promo.semCafe || false,
          meiaPensao: promo.MEIA_PENSAO || promo.meiaPensao || false,
          pensaoCompleta: promo.PENSAO_COMPLETA || promo.pensaoCompleta || false,
          allInclusive: promo.ALL_INCLUSIVE || promo.allInclusive || false,
          numeroDeNoites,
          sp: promo.SP || promo.sp || false,
          cg: promo.CG || promo.cg || false,
          aereo: promo.AEREO || promo.aereo || false,
          createdById,
        },
      })
      migrated++
    }

    return NextResponse.json({
      success: true,
      message: `${migrated} promoções migradas com sucesso`,
    })
  } catch (error) {
    console.error("Error migrating data:", error)
    return NextResponse.json({ error: "Erro ao migrar dados" }, { status: 500 })
  }
}
