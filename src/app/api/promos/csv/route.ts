import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { redis, REDIS_KEYS } from "@/lib/redis"

// Add this line to mark the route as dynamic
export const dynamic = "force-dynamic"

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

    // Get promos from Redis
    const promos = (await redis.get<any[]>(REDIS_KEYS.PROMOS)) || []

    // Filter promos based on type
    let filteredPromos = promos
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (type === "today") {
      // Filter promos created today
      filteredPromos = promos.filter((promo) => {
        const createdAt = new Date(promo.createdAt)
        return createdAt >= today && createdAt < tomorrow
      })
    } else if (type === "custom" && startDate && endDate) {
      // Filter promos in custom date range
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setDate(end.getDate() + 1) // Include the end date

      filteredPromos = promos.filter((promo) => {
        const createdAt = new Date(promo.createdAt as string)
        return createdAt >= start && createdAt < end
      })
    }

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

    const rows = filteredPromos.map((promo) => {
      // Format creation date
      const createdAt = new Date(promo.createdAt)
      const formattedCreatedAt = format(createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })

      // Calculate values
      const baseValue = Number.parseFloat(promo.VALOR)
      const parcelas = Number.parseInt(promo.PARCELAS || "10", 10)
      const totalValue = (baseValue * parcelas * 2).toFixed(2).replace(".", ",")
      const installmentValue = ((baseValue * parcelas * 2) / parcelas).toFixed(2).replace(".", ",")

      // Determine regime
      let regime = "Não especificado"
      if (promo.ALL_INCLUSIVE) regime = "All Inclusive"
      else if (promo.PENSAO_COMPLETA) regime = "Pensão Completa"
      else if (promo.MEIA_PENSAO) regime = "Meia Pensão"
      else if (promo.COM_CAFE) regime = "Com Café"
      else if (promo.SEM_CAFE) regime = "Sem Café"

      // Determine departure airport
      let departure = "Não especificado"
      if (promo.CG && promo.SP) departure = "Campo Grande e São Paulo"
      else if (promo.CG) departure = "Campo Grande"
      else if (promo.SP) departure = "São Paulo"

      return [
        promo.id,
        formattedCreatedAt,
        promo.DESTINO,
        promo.HOTEL,
        promo.DATA_FORMATADA,
        totalValue,
        installmentValue,
        regime,
        promo.NUMERO_DE_NOITES,
        departure,
      ]
    })

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    // Set filename based on type
    let filename = "promos-lemonde-todas.csv"
    if (type === "today") {
      filename = `promos-lemonde-${format(today, "dd-MM-yyyy", { locale: ptBR })}.csv`
    } else if (type === "custom") {
      filename = `promos-lemonde-${format(new Date(startDate!), "dd-MM-yyyy", { locale: ptBR })}-a-${format(new Date(endDate!), "dd-MM-yyyy", { locale: ptBR })}.csv`
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
