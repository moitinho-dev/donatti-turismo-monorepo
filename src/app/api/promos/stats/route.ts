import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import prisma from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get promos from database
    const promos = await prisma.promo.findMany()

    // Calculate overall stats
    const totalPromos = promos.length

    // Unique destinations
    const destinations = new Set(promos.map((promo) => promo.destino))
    const uniqueDestinations = destinations.size

    // Average value
    const totalValue = promos.reduce((sum, promo) => {
      const value = Number.parseFloat(promo.valor) * 2 * 15
      return sum + (isNaN(value) ? 0 : value)
    }, 0)
    const averageValue = totalPromos > 0 ? totalValue / totalPromos : 0

    // Average nights
    const totalNights = promos.reduce((sum, promo) => {
      const nights = Number.parseInt(promo.numeroDeNoites, 10)
      return sum + (isNaN(nights) ? 0 : nights)
    }, 0)
    const averageNights = totalPromos > 0 ? totalNights / totalPromos : 0

    // Most popular destination
    const destinationCounts: Record<string, number> = promos.reduce(
      (counts, promo) => {
        const dest = promo.destino
        counts[dest] = (counts[dest] || 0) + 1
        return counts
      },
      {} as Record<string, number>,
    )

    let mostPopularDestination = { name: "Nenhum", count: 0 }
    for (const [dest, count] of Object.entries(destinationCounts)) {
      if (count > mostPopularDestination.count) {
        mostPopularDestination = { name: dest, count: count as number }
      }
    }

    // Daily stats for the last 30 days
    const today = new Date()
    const thirtyDaysAgo = subDays(today, 30)

    // Create array of all days in the interval
    const daysInterval = eachDayOfInterval({
      start: thirtyDaysAgo,
      end: today,
    })

    // Initialize daily counts with zeros
    const dailyCounts = daysInterval.map((day) => ({
      date: format(day, "yyyy-MM-dd"),
      label: format(day, "dd/MM", { locale: ptBR }),
      count: 0,
    }))

    // Count promos per day
    promos.forEach((promo) => {
      const createdAt = new Date(promo.createdAt)
      const dayIndex = dailyCounts.findIndex(
        (day) => createdAt >= startOfDay(new Date(day.date)) && createdAt <= endOfDay(new Date(day.date)),
      )

      if (dayIndex !== -1) {
        dailyCounts[dayIndex].count++
      }
    })

    // Return stats
    return NextResponse.json({
      overall: {
        totalPromos,
        uniqueDestinations,
        averageValue,
        averageNights,
        mostPopularDestination,
      },
      daily: dailyCounts,
    })
  } catch (error) {
    console.error("Error generating stats:", error)
    return NextResponse.json({ error: "Erro ao gerar estatísticas" }, { status: 500 })
  }
}
