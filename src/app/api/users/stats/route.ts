import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { redis, REDIS_KEYS } from "@/lib/redis"
import type { User, UserStats } from "@/types/user"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
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

    // Get users and promos from Redis
    const users = (await redis.get<User[]>(REDIS_KEYS.USERS)) || []
    const promos = (await redis.get<any[]>(REDIS_KEYS.PROMOS)) || []
    const sessions = (await redis.get<any[]>(REDIS_KEYS.USER_SESSIONS)) || []

    // Calculate stats for each user
    const userStats: UserStats[] = users
      .filter((user) => user.active) // Only include active users
      .map((user) => {
        // Get promos created by this user
        const userPromos = promos.filter((promo) => promo.createdBy === user.id)

        // Get last login
        const userSessions = sessions.filter((session) => session.userId === user.id)
        const lastLoginSession = userSessions.sort(
          (a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime(),
        )[0]

        // Get last promo date
        const lastPromo = userPromos.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0]

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          totalPromos: userPromos.length,
          lastPromoDate: lastPromo?.createdAt,
          lastLoginDate: lastLoginSession?.loginTime || user.lastLogin,
        }
      })

    return NextResponse.json(userStats)
  } catch (error) {
    console.error("Error generating user stats:", error)
    return NextResponse.json({ error: "Erro ao gerar estatísticas de usuários" }, { status: 500 })
  }
}
