import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"
import { nanoid } from "nanoid"
import { z } from "zod"
import { redis, REDIS_KEYS } from "@/lib/redis"

// Add this line to mark the route as dynamic
export const dynamic = "force-dynamic"

// Schema for promo validation
const promoSchema = z.object({
  id: z.string().optional(),
  DESTINO: z.string().min(1, "Destino é obrigatório"),
  HOTEL: z.string().min(1, "Hotel é obrigatório"),
  DATA_FORMATADA: z.string().min(1, "Data é obrigatória"),
  VALOR: z.string().min(1, "Valor é obrigatório"),
  VALORTOTAL: z.string().min(1, "Valor total é obrigatório"),
  PARCELAS: z.string().min(1, "Parcelas são obrigatórias"),
  COM_CAFE: z.boolean().optional(),
  SEM_CAFE: z.boolean().optional(),
  MEIA_PENSAO: z.boolean().optional(),
  PENSAO_COMPLETA: z.boolean().optional(),
  ALL_INCLUSIVE: z.boolean().optional(),
  NUMERO_DE_NOITES: z.string().min(1, "Número de noites é obrigatório"),
  SP: z.boolean().optional(),
  CG: z.boolean().optional(),
  AEREO: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdBy: z.string().optional(),
  createdByName: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const userId = url.searchParams.get("userId")

    // Get promos from Redis
    const promosData = (await redis.get<any[]>(REDIS_KEYS.PROMOS)) || []

    // If ID is provided, return specific promo
    if (id) {
      const promo = promosData.find((p) => p.id === id)
      if (!promo) {
        return NextResponse.json({ error: "Promoção não encontrada" }, { status: 404 })
      }
      return NextResponse.json(promo)
    }

    // Apply filters
    let filteredPromos = promosData

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime()

      filteredPromos = filteredPromos.filter((promo) => {
        const createdAt = new Date(promo.createdAt as string).getTime()
        return createdAt >= start && createdAt <= end
      })
    }

    // Filter by user ID if provided and user is admin
    if (userId && session.user.role === "admin") {
      filteredPromos = filteredPromos.filter((promo) => promo.createdBy === userId)
    }
    // If user is agent, only show their own promos
    else if (session.user.role === "agent") {
      filteredPromos = filteredPromos.filter((promo) => promo.createdBy === session.user.id)
    }

    // Sort by creation date (newest first)
    filteredPromos.sort((a, b) => {
      return new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
    })

    return NextResponse.json(filteredPromos)
  } catch (error) {
    console.error("Error fetching promos:", error)
    return NextResponse.json({ error: "Erro ao buscar promoções" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()

    // Validate promo data
    const validationResult = promoSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validationResult.error.format() }, { status: 400 })
    }

    const promoData = validationResult.data

    // Generate ID if not provided (new promo)
    const isNewPromo = !promoData.id
    const promoId = promoData.id || nanoid()
    const now = new Date().toISOString()

    // Set timestamps and user info
    if (isNewPromo) {
      promoData.createdAt = now
      promoData.createdBy = session.user.id
      promoData.createdByName = session.user.name
    }
    promoData.updatedAt = now
    promoData.id = promoId

    // Get current promos from Redis
    const promosData = (await redis.get<any[]>(REDIS_KEYS.PROMOS)) || []

    // Save to Redis
    if (isNewPromo) {
      promosData.push(promoData)
    } else {
      const index = promosData.findIndex((p) => p.id === promoId)
      if (index !== -1) {
        // Preserve the original creator when updating
        const originalCreatedBy = promosData[index].createdBy
        const originalCreatedByName = promosData[index].createdByName
        promosData[index] = {
          ...promoData,
          createdBy: originalCreatedBy,
          createdByName: originalCreatedByName,
        }
      } else {
        promosData.push(promoData)
      }
    }

    // Update Redis
    await redis.set(REDIS_KEYS.PROMOS, promosData)

    return NextResponse.json(promoData, { status: isNewPromo ? 201 : 200 })
  } catch (error) {
    console.error("Error saving promo:", error)
    return NextResponse.json({ error: "Erro ao salvar promoção" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get promo ID from query
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID da promoção não fornecido" }, { status: 400 })
    }

    // Get current promos from Redis
    const promosData = (await redis.get<any[]>(REDIS_KEYS.PROMOS)) || []

    // Check if promo exists
    const promo = promosData.find((p) => p.id === id)
    if (!promo) {
      return NextResponse.json({ error: "Promoção não encontrada" }, { status: 404 })
    }

    // Check if user has permission to delete
    if (session.user.role !== "admin" && promo.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Você não tem permissão para excluir esta promoção" }, { status: 403 })
    }

    // Delete promo
    const updatedPromos = promosData.filter((p) => p.id !== id)

    // Update Redis
    await redis.set(REDIS_KEYS.PROMOS, updatedPromos)

    return NextResponse.json({ success: true, message: "Promoção excluída com sucesso" })
  } catch (error) {
    console.error("Error deleting promo:", error)
    return NextResponse.json({ error: "Erro ao excluir promoção" }, { status: 500 })
  }
}
