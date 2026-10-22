import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { isAiConfigured } from "@/lib/ai/config"
import { storageDriver } from "@/lib/storage"

export const dynamic = "force-dynamic"

/** O painel usa para mostrar ou esconder os botões de IA */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  return NextResponse.json({ ai: isAiConfigured(), storage: storageDriver() !== null })
}
