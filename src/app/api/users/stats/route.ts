import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import prisma from "@/lib/db"

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

    // Get users with promo counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: { select: { promos: true } },
        promos: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        sessions: {
          select: { expires: true },
          orderBy: { expires: "desc" },
          take: 1,
        },
      },
    })

    const userStats = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      totalPromos: user._count.promos,
      lastPromoDate: user.promos[0]?.createdAt?.toISOString() || undefined,
      lastLoginDate: user.sessions[0]?.expires?.toISOString() || undefined,
    }))

    return NextResponse.json(userStats)
  } catch (error) {
    console.error("Error generating user stats:", error)
    return NextResponse.json({ error: "Erro ao gerar estatísticas de usuários" }, { status: 500 })
  }
}
