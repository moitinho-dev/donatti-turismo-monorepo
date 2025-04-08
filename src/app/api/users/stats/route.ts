import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { redis, REDIS_KEYS } from "../../../../lib/redis"
import type { User, UserStats } from "../../../../types/user"

// Add this line to mark the route as dynamic
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Only admins can access user stats
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Add this helper function at the beginning of the GET function
    const safeParseDate = (dateString?: string): Date | null => {
      if (!dateString) return null

      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) {
          console.error("Invalid date encountered:", dateString)
          return null
        }
        return date
      } catch (error) {
        console.error("Error parsing date:", error)
        return null
      }
    }

    // Get users and promos from Redis
    const users = (await redis.get<User[]>(REDIS_KEYS.USERS)) || []
    const promos = (await redis.get<any[]>(REDIS_KEYS.PROMOS)) || []
    const sessions = (await redis.get<any[]>(REDIS_KEYS.USER_SESSIONS)) || []

    // Calculate stats for each user
    const userStats: UserStats[] = users
      .filter((user: User) => user.active) // Only include active users
      .map((user: User) => {
        // Update the sorting of sessions and promos
        // Get last login
        const userSessions = sessions.filter((session: any) => session.userId === user.id)
        let lastLoginDate = user.lastLogin

        if (userSessions.length > 0) {
          // Sort safely
          const sortedSessions = userSessions.sort((a: any, b: any) => {
            const dateA = safeParseDate(a.loginTime)
            const dateB = safeParseDate(b.loginTime)

            if (!dateA && !dateB) return 0
            if (!dateA) return 1
            if (!dateB) return -1

            return dateB.getTime() - dateA.getTime()
          })

          if (sortedSessions[0] && sortedSessions[0].loginTime) {
            lastLoginDate = sortedSessions[0].loginTime
          }
        }

        // Get last promo date - similar safe sorting
        const userPromos = promos.filter((promo: any) => promo.createdBy === user.id)
        let lastPromoDate = undefined

        if (userPromos.length > 0) {
          const sortedPromos = userPromos.sort((a: any, b: any) => {
            const dateA = safeParseDate(a.createdAt)
            const dateB = safeParseDate(b.createdAt)

            if (!dateA && !dateB) return 0
            if (!dateA) return 1
            if (!dateB) return -1

            return dateB.getTime() - dateA.getTime()
          })

          if (sortedPromos[0] && sortedPromos[0].createdAt) {
            lastPromoDate = sortedPromos[0].createdAt
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          totalPromos: userPromos.length,
          lastPromoDate: lastPromoDate,
          lastLoginDate: lastLoginDate,
        }
      })

    return NextResponse.json(userStats)
  } catch (error) {
    console.error("Error generating user stats:", error)
    return NextResponse.json({ error: "Erro ao gerar estatísticas de usuários" }, { status: 500 })
  }
}
