import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { format, subDays, eachDayOfInterval } from "date-fns"
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

    // Get promos from Redis
    const promos = (await redis.get<any[]>(REDIS_KEYS.PROMOS)) || []

    // Calculate overall stats
    const totalPromos = promos.length

    // Unique destinations - using Array.from instead of spread operator
    const destinations = new Set(promos.map((promo) => promo.DESTINO))
    const uniqueDestinations = destinations.size

    // Average value
    const totalValue = promos.reduce((sum, promo) => {
      const value = Number.parseFloat(promo.VALOR) * 2 * 15
      return sum + (isNaN(value) ? 0 : value)
    }, 0)
    const averageValue = totalPromos > 0 ? totalValue / totalPromos : 0

    // Average nights
    const totalNights = promos.reduce((sum, promo) => {
      const nights = Number.parseInt(promo.NUMERO_DE_NOITES, 10)
      return sum + (isNaN(nights) ? 0 : nights)
    }, 0)
    const averageNights = totalPromos > 0 ? totalNights / totalPromos : 0

    // Most popular destination
    const destinationCounts: Record<string, number> = promos.reduce(
      (counts, promo) => {
        const dest = promo.DESTINO
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

    // Helper function for safe date handling
    const safeDate = (date: Date | null): Date => {
      if (!date || isNaN(date.getTime())) {
        return new Date(0) // Return epoch time as fallback
      }
      return date
    }

    // Create array of all days in the interval
    const daysInterval = eachDayOfInterval({
      start: safeDate(thirtyDaysAgo),
      end: safeDate(today),
    })

    // Initialize daily counts with zeros
    const dailyCounts = daysInterval.map((day) => ({
      date: format(day, "yyyy-MM-dd"),
      label: format(day, "dd/MM", { locale: ptBR }),
      count: 0,
    }))

    // Count promos per day - with improved date handling
    promos.forEach((promo) => {
      try {
        if (!promo.createdAt) return

        const createdAt = new Date(promo.createdAt)
        if (isNaN(createdAt.getTime())) {
          console.error("Invalid date in promo:", promo.id)
          return
        }

        // Convert to local date for comparison
        const localCreatedAt = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate())

        const dayIndex = dailyCounts.findIndex((day) => {
          const dayDate = new Date(day.date)
          const startOfDayDate = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate())
          const endOfDayDate = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59, 999)

          return localCreatedAt >= startOfDayDate && localCreatedAt <= endOfDayDate
        })

        if (dayIndex !== -1) {
          dailyCounts[dayIndex].count++
        }
      } catch (error) {
        console.error("Error processing promo date:", error)
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
