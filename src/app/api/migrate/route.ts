import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"
import { redis, REDIS_KEYS } from "@/lib/redis"

// Add this line to mark the route as dynamic
export const dynamic = "force-dynamic"

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

    // Save data to Redis
    await redis.set(REDIS_KEYS.PROMOS, data)

    return NextResponse.json({
      success: true,
      message: `${data.length} promoções migradas com sucesso`,
    })
  } catch (error) {
    console.error("Error migrating data:", error)
    return NextResponse.json({ error: "Erro ao migrar dados" }, { status: 500 })
  }
}
