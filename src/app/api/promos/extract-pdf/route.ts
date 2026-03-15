import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const EXTRACTION_PROMPT = `Voce e um assistente de extracao de dados para uma agencia de turismo brasileira.
Extraia os seguintes campos deste PDF de promocao de viagem.
Retorne APENAS um JSON valido com estes campos (sem markdown, sem backticks, apenas o JSON):

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

Regras de parsing:
- Precos em formato brasileiro: "R$ 5.000,00" = "5000.00", "R$ 1.299,00" = "1299.00"
- Se o preco for por parcela (ex: "10x de R$ 500"), multiplique para obter o total: VALOR = "5000.00", PARCELAS = "10"
- Se o preco for total (ex: "R$ 5.000 em 10x"), use direto: VALOR = "5000.00", PARCELAS = "10"
- Datas: "15 a 22 de marco de 2026" = DE:"15", ATE:"22", MES_DE:"03", MES_ATE:"03", ANO:"2026"
- Datas com meses diferentes: "28/03 a 04/04 de 2026" = DE:"28", MES_DE:"03", ATE:"04", MES_ATE:"04", ANO:"2026"
- Se nao conseguir determinar um campo, use null
- Cafe da manha = COM_CAFE, sem cafe = SEM_CAFE, meia pensao = MEIA_PENSAO, pensao completa = PENSAO_COMPLETA, all inclusive = ALL_INCLUSIVE`

function parseGeminiJson(rawText: string): Record<string, unknown> {
  let cleaned = rawText.trim()
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")
  }

  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0])
    }
    throw new Error("Nao foi possivel extrair JSON da resposta do Gemini")
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY nao configurada" },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Apenas arquivos PDF sao aceitos" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande (max 10MB)" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")

    // Send PDF directly to Gemini Vision — handles both text-based and scanned PDFs
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: EXTRACTION_PROMPT },
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: base64,
                },
              },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
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
    const fields = parseGeminiJson(rawText)

    // Count extracted fields
    const fieldKeys = ["DESTINO", "HOTEL", "DE", "ATE", "MES_DE", "MES_ATE", "ANO", "VALOR", "PARCELAS", "NUMERO_DE_NOITES", "regime", "AEREO", "SP", "CG"]
    const filledCount = fieldKeys.filter(k => fields[k] != null).length
    const confidence = filledCount / fieldKeys.length

    const warnings: string[] = []
    if (filledCount === 0) {
      warnings.push("Nenhum campo foi identificado no PDF")
    }

    return NextResponse.json({ fields, confidence, warnings })
  } catch (error) {
    console.error("PDF extraction error:", error)
    const message = error instanceof Error ? error.message : "Erro ao processar PDF"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
