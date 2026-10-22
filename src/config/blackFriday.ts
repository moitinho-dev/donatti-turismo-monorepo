/**
 * Campanha Black Friday.
 *
 * - "esquenta": página ligada, antes do início — contagem para a abertura
 * - "ao-vivo": entre início e fim — contagem para o encerramento
 * - "encerrada" / "desligada": site volta ao layout padrão e /black-friday sai do ar
 *
 * A página é ligada e as datas são trocadas no painel de promos (tabela site_settings).
 * As variáveis abaixo só definem o padrão, usado até alguém salvar no painel:
 *   NEXT_PUBLIC_BLACK_FRIDAY=off|on        (padrão: off, liga pelo botão do painel)
 *   NEXT_PUBLIC_BLACK_FRIDAY_START=2026-11-23T00:00:00-03:00
 *   NEXT_PUBLIC_BLACK_FRIDAY_END=2026-11-30T23:59:59-03:00
 */

export type BlackFridayPhase = "desligada" | "esquenta" | "ao-vivo" | "encerrada"

/** Configuração da campanha. Datas em ISO para poder ir do servidor para o navegador. */
export interface BlackFridaySettings {
  /** Página /black-friday e faixa da home no ar */
  enabled: boolean
  startsAt: string
  endsAt: string
  /** Número do título "até X% OFF" */
  maxDiscount: number
}

const DEFAULT_START = "2026-11-23T00:00:00-03:00" // segunda da Black Week
const DEFAULT_END = "2026-11-30T23:59:59-03:00" // fim da Cyber Monday

const toIso = (value: string | undefined, fallback: string) => {
  const date = new Date(value || fallback)
  return (Number.isNaN(date.getTime()) ? new Date(fallback) : date).toISOString()
}

export const defaultBlackFridaySettings: BlackFridaySettings = {
  enabled: (process.env.NEXT_PUBLIC_BLACK_FRIDAY || "off").toLowerCase() === "on",
  startsAt: toIso(process.env.NEXT_PUBLIC_BLACK_FRIDAY_START, DEFAULT_START),
  endsAt: toIso(process.env.NEXT_PUBLIC_BLACK_FRIDAY_END, DEFAULT_END),
  maxDiscount: 40,
}

export function getBlackFridayPhase(settings: BlackFridaySettings, now: Date = new Date()): BlackFridayPhase {
  if (!settings.enabled) return "desligada"
  if (now < new Date(settings.startsAt)) return "esquenta"
  if (now <= new Date(settings.endsAt)) return "ao-vivo"
  return "encerrada"
}

export const isBlackFridayActive = (phase: BlackFridayPhase) => phase === "esquenta" || phase === "ao-vivo"

/** Data alvo da contagem regressiva da fase atual */
export function getCountdownTarget(settings: BlackFridaySettings, phase: BlackFridayPhase): Date | null {
  if (phase === "esquenta") return new Date(settings.startsAt)
  if (phase === "ao-vivo") return new Date(settings.endsAt)
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

export const formatCampaignDate = (date: Date | string) =>
  new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", timeZone: "America/Campo_Grande" })

export const formatCampaignShortDate = (date: Date | string) =>
  new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Campo_Grande" })
