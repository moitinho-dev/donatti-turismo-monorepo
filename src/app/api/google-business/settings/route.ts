import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { ACCOUNT_NAME_RE, LOCATION_NAME_RE, getBusinessConnection, saveBusinessTarget } from "@/lib/googleBusiness"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const schema = z.object({
  accountName: z.string().regex(ACCOUNT_NAME_RE),
  locationName: z.string().regex(LOCATION_NAME_RE),
  locationTitle: z.string().max(300).optional().nullable(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Apenas admin" }, { status: 403 })

  const conn = await getBusinessConnection()
  return NextResponse.json({
    connected: Boolean(conn?.refreshToken),
    accountName: conn?.accountName || null,
    locationName: conn?.locationName || null,
    locationTitle: conn?.locationTitle || null,
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Apenas admin" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })

  const conn = await getBusinessConnection()
  if (!conn?.refreshToken) return NextResponse.json({ error: "Conecte o Google antes de escolher o local." }, { status: 409 })
  await saveBusinessTarget(parsed.data.accountName, parsed.data.locationName, parsed.data.locationTitle)
  return NextResponse.json({ ok: true })
}
