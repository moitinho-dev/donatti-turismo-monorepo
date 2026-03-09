import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"
import { z } from "zod"
import prisma from "@/lib/db"

// Schema for user validation
const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email("Email inválido"),
  name: z.string().min(1, "Nome é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["admin", "agent"], {
    errorMap: () => ({ message: "Função deve ser admin ou agent" }),
  }),
  active: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Only admins can list users
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    // If ID is provided, return specific user
    if (id) {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
      })

      if (!user) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
      }

      return NextResponse.json(user)
    }

    // Return all users without passwords
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Only admins can create users
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Parse request body
    const body = await req.json()

    // Validate user data
    const validationResult = userSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validationResult.error.format() }, { status: 400 })
    }

    const userData = validationResult.data
    const isNewUser = !userData.id

    if (isNewUser) {
      // Check if email already exists
      const existing = await prisma.user.findUnique({ where: { email: userData.email } })
      if (existing) {
        return NextResponse.json({ error: "Email já está em uso" }, { status: 400 })
      }

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: userData.password,
          role: userData.role,
        },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      })

      return NextResponse.json(user, { status: 201 })
    } else {
      // Check if email already exists for other user
      const existing = await prisma.user.findFirst({
        where: { email: userData.email, NOT: { id: userData.id } },
      })
      if (existing) {
        return NextResponse.json({ error: "Email já está em uso" }, { status: 400 })
      }

      const user = await prisma.user.update({
        where: { id: userData.id },
        data: {
          email: userData.email,
          name: userData.name,
          password: userData.password,
          role: userData.role,
        },
        select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
      })

      return NextResponse.json(user)
    }
  } catch (error) {
    console.error("Error saving user:", error)
    return NextResponse.json({ error: "Erro ao salvar usuário" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Only admins can delete users
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Get user ID from query
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID do usuário não fornecido" }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Don't allow deleting the last admin
    if (user.role === "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } })
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Não é possível excluir o último administrador" }, { status: 400 })
      }
    }

    // Delete user
    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Usuário excluído com sucesso" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 })
  }
}
