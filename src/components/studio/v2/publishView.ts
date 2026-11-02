import { CHANNELS, type Channel } from "@/lib/channels"
import type { ChannelState } from "@/lib/publishState"

/** Textos e regras do painel Publicar (sem tela, para testar) */

/** "02/11 às 14:30" */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} às ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Mensagens que o servidor grava já no jeito da equipe; o resto (erro técnico da rede) vira uma mensagem simples */
const FRIENDLY = /^(Conecte (a Meta|o Google) no painel antes de publicar|A Página conectada não tem Instagram profissional ligado|Publique no site antes)$/

export function friendlyError(error: string | null, channelLabel: string): string {
  if (error && FRIENDLY.test(error)) return error
  return `Não foi possível publicar no ${channelLabel}. Tente de novo em alguns minutos.`
}

export function stateLabel(s: ChannelState | undefined, channelLabel = "canal"): string {
  if (!s) return "—"
  switch (s.state) {
    case "none":
      return "—"
    case "published":
      return `✓ publicado ${shortDate(s.at)}${s.by ? ` por ${s.by}` : ""}`
    case "scheduled":
      return `Agendado para ${shortDate(s.scheduledFor || s.at)}`
    case "shared":
      return `Compartilhado ${shortDate(s.at)}`
    case "simulated":
      return "Simulado"
    case "error":
      return `Erro: ${friendlyError(s.error, channelLabel)}`
  }
}

/** Canais que o botão Publicar envia (o WhatsApp é compartilhado pelos botões da linha) */
export const isApiChannel = (c: Channel) => c !== "wa-channel" && c !== "wa-status"

/** Site, depois Google, depois os demais na ordem da lista */
export function publishOrder(selected: Iterable<Channel>): Channel[] {
  const set = new Set(selected)
  const rank = (c: Channel) => (c === "site" ? 0 : c === "google" ? 1 : 2)
  return CHANNELS.map((c) => c.id)
    .filter((c) => set.has(c) && isApiChannel(c))
    .sort((a, b) => rank(a) - rank(b))
}

/** Site marcado leva o Google junto */
export function toggleChannel(selected: Set<Channel>, c: Channel): Set<Channel> {
  const next = new Set(selected)
  if (c === "google" && next.has("site")) return next
  if (next.has(c)) next.delete(c)
  else next.add(c)
  if (next.has("site")) next.add("google")
  return next
}

export type Device = "android" | "ios" | "desktop"

export function deviceOf(ua: string, touchMac = false): Device {
  if (/android/i.test(ua)) return "android"
  if (/iphone|ipad|ipod/i.test(ua) || touchMac) return "ios"
  return "desktop"
}

/** Agendamento direto: entre 10 minutos e 30 dias a partir de agora */
export function scheduleError(local: string, now = Date.now()): string | null {
  if (!local) return "Escolha a data e a hora"
  const t = new Date(local).getTime()
  if (Number.isNaN(t)) return "Data inválida"
  const ahead = t - now
  if (ahead < 10 * 60_000 || ahead > 30 * 86_400_000) return "Agende entre 10 minutos e 30 dias a partir de agora"
  return null
}
