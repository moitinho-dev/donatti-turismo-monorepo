import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import prisma from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const type = url.searchParams.get("type") || "all" // all, today, custom
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    // Build where clause for filtering
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const where: { createdAt?: { gte?: Date; lt?: Date } } = {}

    if (type === "today") {
      where.createdAt = {
        gte: today,
        lt: tomorrow,
      }
    } else if (type === "custom" && startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setDate(end.getDate() + 1) // Include the end date

      where.createdAt = {
        gte: start,
        lt: end,
      }
    }

    // Get promos from database
    const promos = await prisma.promo.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    // Generate CSV content
    const headers = [
      "ID",
      "Data de Criação",
      "Destino",
      "Hotel",
      "Data da Viagem",
      "Valor (R$)",
      "Valor por Parcela (R$)",
      "Regime de Alimentação",
      "Número de Noites",
      "Aeroporto de Saída",
    ]

    const rows = promos.map((promo) => {
      // Format creation date
      const formattedCreatedAt = format(promo.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })

      // Calculate values
      const baseValue = Number.parseFloat(promo.valor)
      const parcelas = promo.parcelas || 10
      const totalValue = (baseValue * parcelas * 2).toFixed(2).replace(".", ",")
      const installmentValue = ((baseValue * parcelas * 2) / parcelas).toFixed(2).replace(".", ",")

      // Determine regime
      let regime = "Não especificado"
      if (promo.allInclusive) regime = "All Inclusive"
      else if (promo.pensaoCompleta) regime = "Pensão Completa"
      else if (promo.meiaPensao) regime = "Meia Pensão"
      else if (promo.comCafe) regime = "Com Café"
      else if (promo.semCafe) regime = "Sem Café"

      // Determine departure airport
      let departure = "Não especificado"
      if (promo.cg && promo.sp) departure = "Campo Grande e São Paulo"
      else if (promo.cg) departure = "Campo Grande"
      else if (promo.sp) departure = "São Paulo"

      return [
        promo.id,
        formattedCreatedAt,
        promo.destino,
        promo.hotel,
        promo.dataFormatada,
        totalValue,
        installmentValue,
        regime,
        promo.numeroDeNoites,
        departure,
      ]
    })

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    // Set filename based on type
    let filename = "promos-donatti-todas.csv"
    if (type === "today") {
      filename = `promos-donatti-${format(today, "dd-MM-yyyy", { locale: ptBR })}.csv`
    } else if (type === "custom") {
      filename = `promos-donatti-${format(new Date(startDate!), "dd-MM-yyyy", { locale: ptBR })}-a-${format(new Date(endDate!), "dd-MM-yyyy", { locale: ptBR })}.csv`
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error generating CSV:", error)
    return NextResponse.json({ error: "Erro ao gerar CSV" }, { status: 500 })
  }
}
