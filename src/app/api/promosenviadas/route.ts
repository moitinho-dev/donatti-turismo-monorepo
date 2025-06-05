import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"
import type { NextRequest, NextResponse } from "next/server"

// Add this line to mark the route as dynamic
export const dynamic = "force-dynamic"

// Defina o tipo de dados da linha
export type PlanilhaData = {
  DESTINO: string
  HOTEL: string
  DATA_FORMATADA: string
  VALOR: string
  COM_CAFE: boolean
  SEM_CAFE: boolean
  MEIA_PENSAO: boolean
  PENSAO_COMPLETA: boolean
  ALL_INCLUSIVE: boolean
  NUMERO_DE_NOITES: string
  SP: boolean
  CG: boolean
  AEREO: boolean
}

const spreadsheetId = "1bleP_G4IDE-Aj1gB5O-KjGOpXaDwj556NKk672lYwr4"

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY,
  scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.file"],
})

// Função para obter dados da planilha
async function getPlanilhaData(): Promise<PlanilhaData[]> {
  const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth)
  await doc.loadInfo()
  const sheet = doc.sheetsByIndex[0]
  const promos = await sheet.getRows<PlanilhaData>()
  const responseData = promos.map((promo) => ({
    DESTINO: promo.get("DESTINO"),
    HOTEL: promo.get("HOTEL"),
    DATA_FORMATADA: promo.get("DATA_FORMATADA"),
    VALOR: promo.get("VALOR"),
    COM_CAFE: promo.get("COM_CAFE"),
    SEM_CAFE: promo.get("SEM_CAFE"),
    MEIA_PENSAO: promo.get("MEIA_PENSAO"),
    PENSAO_COMPLETA: promo.get("PENSAO_COMPLETA"),
    ALL_INCLUSIVE: promo.get("ALL_INCLUSIVE"),
    NUMERO_DE_NOITES: promo.get("NUMERO_DE_NOITES"),
    SP: promo.get("SP"),
    CG: promo.get("CG"),
    AEREO: promo.get("AEREO"),
  }))

  return responseData
}

export async function GET(req: Request | NextRequest, res: Response | NextResponse) {
  try {
    const responseData = await getPlanilhaData()
    console.log(responseData)
    return Response.json(responseData)
  } catch (error) {
    console.error("Erro ao obter dados da planilha:", error)
    return Response.json({ error: "Erro ao obter dados da planilha.." }, { status: 500 })
  }
}
