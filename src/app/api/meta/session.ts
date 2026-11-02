import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"

/** Usuário logado do painel; `admin` diz se pode conectar e trocar a conta da Meta */
export async function metaSession() {
  const session = await getServerSession(authOptions)
  const user = session?.user as { id?: string; email?: string | null; role?: string } | undefined
  return user ? { id: user.id || "", email: user.email || "", admin: user.role === "admin" } : null
}
