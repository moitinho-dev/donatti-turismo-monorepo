import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import prisma from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const { id } = await params
  const design = await prisma.design.findUnique({ where: { id } })
  if (!design) return NextResponse.json({ error: "Design não encontrado" }, { status: 404 })
  return NextResponse.json(design)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const { id } = await params
  const design = await prisma.design.findUnique({ where: { id }, select: { createdById: true } })
  if (!design) return NextResponse.json({ error: "Design não encontrado" }, { status: 404 })
  if (design.createdById !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Só quem criou ou um admin pode excluir" }, { status: 403 })
  }
  await prisma.design.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
