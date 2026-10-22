import { z } from "zod"
import prisma from "./db"
import { defaultBlackFridaySettings, type BlackFridaySettings } from "@/config/blackFriday"

const KEY = "black-friday"

export const blackFridaySettingsSchema = z
  .object({
    enabled: z.boolean(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    maxDiscount: z.number().int().min(1).max(90),
  })
  .refine((s) => new Date(s.endsAt) > new Date(s.startsAt), { message: "O fim precisa ser depois do início", path: ["endsAt"] })

/** Configuração salva no painel; sem banco ou sem registro, usa o padrão das variáveis de ambiente */
export async function getBlackFridaySettings(): Promise<BlackFridaySettings> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: KEY } })
    if (!row) return defaultBlackFridaySettings
    const parsed = blackFridaySettingsSchema.safeParse({ ...defaultBlackFridaySettings, ...(row.value as object) })
    return parsed.success ? (parsed.data as BlackFridaySettings) : defaultBlackFridaySettings
  } catch (error) {
    console.error("Black Friday: não foi possível ler a configuração", error)
    return defaultBlackFridaySettings
  }
}

export async function saveBlackFridaySettings(settings: BlackFridaySettings): Promise<BlackFridaySettings> {
  const value = {
    enabled: settings.enabled,
    startsAt: new Date(settings.startsAt).toISOString(),
    endsAt: new Date(settings.endsAt).toISOString(),
    maxDiscount: settings.maxDiscount,
  }
  await prisma.siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } })
  return value
}
