import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const EXTRACTION_PROMPT = `Voce e um assistente de extracao de dados para uma agencia de turismo brasileira.
Extraia os seguintes campos deste texto de uma pagina web de operadora/hotel com promocao de viagem.
Retorne APENAS um JSON valido com estes campos:

{
  "DESTINO": "nome da cidade/regiao de destino ou null",
  "HOTEL": "nome do hotel ou null",
  "DE": "dia de ida (DD) ou null",
  "ATE": "dia de volta (DD) ou null",
  "MES_DE": "mes de ida (MM) ou null",
  "MES_ATE": "mes de volta (MM) ou null",
  "ANO": "ano (YYYY) ou null",
  "VALOR": "preco total em BRL como string numerica ex: '5000.00' ou null",
  "PARCELAS": "numero de parcelas como string ex: '10' ou null",
  "NUMERO_DE_NOITES": "numero de noites como string ou null",
  "regime": "um de: COM_CAFE, SEM_CAFE, MEIA_PENSAO, PENSAO_COMPLETA, ALL_INCLUSIVE, ou null",
  "AEREO": true ou false se inclui passagem aerea,
  "SP": true ou false se saida de Sao Paulo,
  "CG": true ou false se saida de Campo Grande
}

Regras:
- Precos em formato brasileiro: "R$ 5.000,00" = "5000.00"
- Se o preco for por parcela (ex: "10x de R$ 500"), multiplique: VALOR = "5000.00", PARCELAS = "10"
- Se o preco for total (ex: "R$ 5.000 em 10x"), use direto: VALOR = "5000.00", PARCELAS = "10"
- Datas: "15 a 22 de marco de 2026" = DE:"15", ATE:"22", MES_DE:"03", MES_ATE:"03", ANO:"2026"
- Se nao conseguir determinar um campo, use null
- Se houver multiplas promos na pagina, extraia a PRIMEIRA ou a mais relevante
- Cafe da manha = COM_CAFE, sem cafe = SEM_CAFE, meia pensao = MEIA_PENSAO, pensao completa = PENSAO_COMPLETA, all inclusive = ALL_INCLUSIVE`

function parseGeminiJson(rawText: string): Record<string, unknown> {
  if (!rawText?.trim()) throw new Error("Resposta vazia do Gemini")

  let cleaned = rawText.trim()
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/g, "").replace(/\n?\s*```$/g, "")

  try {
    const parsed = JSON.parse(cleaned)
    if (typeof parsed === "object" && parsed !== null) return parsed
  } catch { /* continue */ }

  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch { /* continue */ }
  }

  throw new Error("Nao foi possivel extrair JSON da resposta")
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY nao configurada" }, { status: 500 })
    }

    const body = await request.json()
    const { text, url: pageUrl } = body as { text?: string; url?: string }

    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: "Texto da pagina muito curto ou vazio" }, { status: 400 })
    }

    // Truncate to avoid token limits (keep first 8000 chars)
    const truncatedText = text.slice(0, 8000)

    const contextLine = pageUrl ? `\nURL da pagina: ${pageUrl}\n` : ""

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${EXTRACTION_PROMPT}${contextLine}\n\nTexto extraido da pagina web:\n\n${truncatedText}`,
            }],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      },
    )

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${err}`)
    }

    const data = await response.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    if (!rawText) {
      return NextResponse.json({ error: "Gemini nao retornou dados" }, { status: 500 })
    }

    const fields = parseGeminiJson(rawText)

    const fieldKeys = ["DESTINO", "HOTEL", "DE", "ATE", "MES_DE", "MES_ATE", "ANO", "VALOR", "PARCELAS", "NUMERO_DE_NOITES", "regime", "AEREO", "SP", "CG"]
    const filledCount = fieldKeys.filter(k => fields[k] != null).length

    return NextResponse.json({ fields, confidence: filledCount / fieldKeys.length })
  } catch (error) {
    console.error("Page extraction error:", error)
    const message = error instanceof Error ? error.message : "Erro ao processar pagina"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
