import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"
import { z } from "zod"
import prisma from "@/lib/db"

// Schema for lead validation (public submission)
const leadSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email().optional().or(z.literal("")),
  source: z.string().optional(),
  destino: z.string().optional(),
  hotel: z.string().optional(),
  promoDetails: z.string().optional(),
})

// Schema for lead update (admin only)
const leadUpdateSchema = z.object({
  id: z.string(),
  status: z.enum(["new", "contacted", "converted", "lost"]).optional(),
  notes: z.string().optional(),
})

// GET: List leads (authenticated only)
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const source = url.searchParams.get("source")
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const search = url.searchParams.get("search")

    // Build where clause for filters
    const where: {
      status?: string
      source?: string
      createdAt?: { gte?: Date; lte?: Date }
      OR?: Array<{ name?: { contains: string; mode: "insensitive" }; phone?: { contains: string }; email?: { contains: string; mode: "insensitive" }; destino?: { contains: string; mode: "insensitive" } }>
    } = {}

    if (status) {
      where.status = status
    }

    if (source) {
      where.source = source
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
        { destino: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get leads from database
    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error("Error fetching leads:", error)
    return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 })
  }
}

// POST: Create new lead (public - no auth required)
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json()

    // Validate lead data
    const validationResult = leadSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validationResult.error.format() }, { status: 400 })
    }

    const data = validationResult.data

    // Create new lead
    const newLead = await prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        source: data.source || "website",
        destino: data.destino || null,
        hotel: data.hotel || null,
        promoDetails: data.promoDetails || null,
        status: "new",
      },
    })

    return NextResponse.json(newLead, { status: 201 })
  } catch (error) {
    console.error("Error creating lead:", error)
    return NextResponse.json({ error: "Erro ao salvar lead" }, { status: 500 })
  }
}

// PUT: Update lead (authenticated only)
export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()

    // Validate update data
    const validationResult = leadUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validationResult.error.format() }, { status: 400 })
    }

    const data = validationResult.data

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: data.id },
    })

    if (!existingLead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
    }

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id: data.id },
      data: {
        status: data.status || existingLead.status,
        notes: data.notes !== undefined ? data.notes : existingLead.notes,
      },
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error("Error updating lead:", error)
    return NextResponse.json({ error: "Erro ao atualizar lead" }, { status: 500 })
  }
}

// DELETE: Delete lead (authenticated only)
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get lead ID from query
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID do lead não fornecido" }, { status: 400 })
    }

    // Check if lead exists
    const lead = await prisma.lead.findUnique({
      where: { id },
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
    }

    // Delete lead
    await prisma.lead.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Lead excluído com sucesso" })
  } catch (error) {
    console.error("Error deleting lead:", error)
    return NextResponse.json({ error: "Erro ao excluir lead" }, { status: 500 })
  }
}
