import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"
import { getBlackFridayPhase, type BlackFridaySettings } from "@/config/blackFriday"
import { blackFridaySettingsSchema, getBlackFridaySettings, saveBlackFridaySettings } from "@/lib/blackFridaySettings"

export const dynamic = "force-dynamic"

/** Configuração da campanha e fase atual (pública: a contagem do site usa) */
export async function GET() {
  const settings = await getBlackFridaySettings()
  return NextResponse.json({ settings, phase: getBlackFridayPhase(settings) })
}

/** Liga/desliga a página e muda datas e desconto do título (só equipe logada) */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const parsed = blackFridaySettingsSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos" }, { status: 400 })
  }

  try {
    const settings = await saveBlackFridaySettings(parsed.data as BlackFridaySettings)
    // Home e página da campanha mudam na próxima visita, sem esperar o revalidate de 5 min
    revalidatePath("/")
    revalidatePath("/black-friday")
    return NextResponse.json({ settings, phase: getBlackFridayPhase(settings) })
  } catch (error) {
    console.error("Black Friday: erro ao salvar", error)
    return NextResponse.json({ error: "Não foi possível salvar" }, { status: 500 })
  }
}
