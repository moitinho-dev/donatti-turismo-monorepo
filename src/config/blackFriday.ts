/**
 * Campanha Black Friday.
 *
 * - "esquenta": antes do início — site em clima de Black Friday, contagem para a abertura
 * - "ao-vivo": entre início e fim — contagem para o encerramento
 * - "encerrada" / "desligada": site volta ao layout padrão
 *
 * Datas e liga/desliga podem ser trocados sem deploy de código, pelas variáveis:
 *   NEXT_PUBLIC_BLACK_FRIDAY=off|on        (padrão: on)
 *   NEXT_PUBLIC_BLACK_FRIDAY_START=2026-11-23T00:00:00-03:00
 *   NEXT_PUBLIC_BLACK_FRIDAY_END=2026-11-30T23:59:59-03:00
 */

export type BlackFridayPhase = "desligada" | "esquenta" | "ao-vivo" | "encerrada"

const DEFAULT_START = "2026-11-23T00:00:00-03:00" // segunda da Black Week
const DEFAULT_END = "2026-11-30T23:59:59-03:00" // fim da Cyber Monday

const parseDate = (value: string | undefined, fallback: string) => {
  const date = new Date(value || fallback)
  return Number.isNaN(date.getTime()) ? new Date(fallback) : date
}

export const blackFriday = {
  enabled: (process.env.NEXT_PUBLIC_BLACK_FRIDAY || "on").toLowerCase() !== "off",
  startsAt: parseDate(process.env.NEXT_PUBLIC_BLACK_FRIDAY_START, DEFAULT_START),
  endsAt: parseDate(process.env.NEXT_PUBLIC_BLACK_FRIDAY_END, DEFAULT_END),
}

export function getBlackFridayPhase(now: Date = new Date()): BlackFridayPhase {
  if (!blackFriday.enabled) return "desligada"
  if (now < blackFriday.startsAt) return "esquenta"
  if (now <= blackFriday.endsAt) return "ao-vivo"
  return "encerrada"
}

export const isBlackFridayActive = (phase: BlackFridayPhase) => phase === "esquenta" || phase === "ao-vivo"

/** Data alvo da contagem regressiva da fase atual */
export function getCountdownTarget(phase: BlackFridayPhase): Date | null {
  if (phase === "esquenta") return blackFriday.startsAt
  if (phase === "ao-vivo") return blackFriday.endsAt
  return null
}

export function getTimeLeft(target: Date, now: Date = new Date()) {
  const diff = Math.max(0, target.getTime() - now.getTime())
  return {
    total: diff,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export const formatCampaignDate = (date: Date) =>
  date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", timeZone: "America/Campo_Grande" })
