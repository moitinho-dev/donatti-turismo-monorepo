import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"
import { nanoid } from "nanoid"
import { z } from "zod"
import { redis, REDIS_KEYS } from "@/lib/redis"
import type { User } from "@/types/user"

// Add this line to mark the route as dynamic
export const dynamic = "force-dynamic"

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
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
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

    // Get users from Redis
    const usersData = (await redis.get<User[]>(REDIS_KEYS.USERS)) || []

    // If ID is provided, return specific user
    if (id) {
      const user = usersData.find((u) => u.id === id)
      if (!user) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
      }

      // Don't return password
      const { password, ...userWithoutPassword } = user
      return NextResponse.json(userWithoutPassword)
    }

    // Return all users without passwords
    const usersWithoutPasswords = usersData.map(({ password, ...user }) => user)
    return NextResponse.json(usersWithoutPasswords)
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

    // Get current users from Redis
    const usersData = (await redis.get<User[]>(REDIS_KEYS.USERS)) || []

    // Check if email already exists
    const emailExists = usersData.some((u) => u.email === userData.email && (!userData.id || u.id !== userData.id))
    if (emailExists) {
      return NextResponse.json({ error: "Email já está em uso" }, { status: 400 })
    }

    // Generate ID if not provided (new user)
    const isNewUser = !userData.id
    const userId = userData.id || nanoid()
    const now = new Date().toISOString()

    // Set timestamps
    const completeUserData: User = {
      id: userId,
      email: userData.email,
      name: userData.name,
      password: userData.password,
      role: userData.role,
      createdAt: isNewUser ? now : userData.createdAt || now,
      updatedAt: now,
      active: isNewUser ? true : (userData.active ?? true),
    }

    // Save to Redis
    if (isNewUser) {
      usersData.push(completeUserData)
    } else {
      const index = usersData.findIndex((u) => u.id === userId)
      if (index !== -1) {
        usersData[index] = completeUserData
      } else {
        usersData.push(completeUserData)
      }
    }

    // Update Redis
    await redis.set(REDIS_KEYS.USERS, usersData)

    // Don't return password
    const { password, ...userWithoutPassword } = userData
    return NextResponse.json(userWithoutPassword, { status: isNewUser ? 201 : 200 })
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

    // Get current users from Redis
    const usersData = (await redis.get<User[]>(REDIS_KEYS.USERS)) || []

    // Check if user exists
    const index = usersData.findIndex((u) => u.id === id)
    if (index === -1) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Don't allow deleting the last admin
    if (usersData[index].role === "admin") {
      const adminCount = usersData.filter((u) => u.role === "admin").length
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Não é possível excluir o último administrador" }, { status: 400 })
      }
    }

    // Instead of deleting, mark as inactive
    usersData[index].active = false
    usersData[index].updatedAt = new Date().toISOString()

    // Update Redis
    await redis.set(REDIS_KEYS.USERS, usersData)

    return NextResponse.json({ success: true, message: "Usuário desativado com sucesso" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 })
  }
}
