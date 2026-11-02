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

/** Mensagens do próprio app (tela e servidor) */
export const NETWORK_ERROR = "Sem conexão. Confira a internet e tente de novo."
export const IMAGE_ERROR = "Não deu para gerar a imagem: alguma foto da arte não permite exportação. Troque a foto e tente de novo."
export const UPLOAD_ERROR = "Não foi possível enviar a arte. Tente de novo."
export const COPY_ERROR = "Não deu para copiar a mensagem. Selecione e copie a legenda do WhatsApp."
export const NO_SHARE_ERROR = "Este aparelho não abre o compartilhar com imagens. Use Baixar e Copiar mensagem."
export const SHARE_ERROR = "Não deu para abrir o compartilhar. Tente de novo."
export const SHARED_MARK_ERROR = "Não foi possível marcar como compartilhado"
export const UNSAVED = "Salve a promoção para publicar."
export const SCHEDULE_TOO_CLOSE = "O horário agendado ficou perto demais. Escolha outro horário e tente de novo."

/** Mensagens já no jeito da equipe; o resto (erro técnico da rede social, do Google ou do navegador) vira uma mensagem simples */
const KNOWN = new Set([
  NETWORK_ERROR,
  IMAGE_ERROR,
  UPLOAD_ERROR,
  COPY_ERROR,
  NO_SHARE_ERROR,
  SHARE_ERROR,
  SHARED_MARK_ERROR,
  UNSAVED,
  SCHEDULE_TOO_CLOSE,
  "Conecte a Meta no painel antes de publicar",
  "Conecte o Google no painel antes de publicar",
  "A Página conectada não tem Instagram profissional ligado",
  "Publique no site antes",
  "Sem permissão para publicar esta promoção",
  "Promoção não encontrada",
  "Não autorizado",
  "Envie a arte antes de publicar",
  "Envie uma arte para o Google",
  "Agende entre 10 minutos e 30 dias a partir de agora",
])
const RETRY_LATER = /^Não foi possível publicar no .+\. Tente de novo em alguns minutos\.$/

export function friendlyError(error: string | null | undefined, channelLabel: string): string {
  if (error && (KNOWN.has(error) || RETRY_LATER.test(error))) return error
  return `Não foi possível publicar no ${channelLabel}. Tente de novo em alguns minutos.`
}

/** Endereço que /api/meta/media já devolveu (https, ou http do próprio app no desenvolvimento): não sobe de novo */
export const isUploadedUrl = (url: string) => /^https?:\/\//i.test(url)

/**
 * O Site segue a promo, como na lista: no site conta como publicado (a lista publica sem registro);
 * fora do site, um "publicado" antigo vira "—" (e o Site vem marcado). Simulação e erro continuam aparecendo.
 */
export function withSiteState(status: Record<Channel, ChannelState>, sitePublished: boolean): Record<Channel, ChannelState> {
  const site = status.site
  if (sitePublished) {
    if (site && site.state === "published") return status
    return { ...status, site: { state: "published", at: null, by: null, error: null, stale: false } }
  }
  if (site && (site.state === "simulated" || site.state === "error" || site.state === "none")) return status
  return { ...status, site: { state: "none", at: null, by: null, error: null, stale: false } }
}

/** A promo sem SITE_PUBLISHED: salvar a oferta no Studio não muda a promo no site (o servidor mantém a situação) */
export const offerOnly = (p: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(p).filter(([k]) => k !== "SITE_PUBLISHED"))

/**
 * Canais que já vêm marcados ao abrir: sem post, com erro, só simulado ou com a oferta alterada depois do post.
 * Publicado, agendado ou compartilhado (e em dia) vem desmarcado. Site marcado leva o Google junto.
 */
export function initialSelection(status: Record<Channel, ChannelState>): Set<Channel> {
  const out = new Set<Channel>()
  for (const { id } of CHANNELS) {
    const s = status[id]
    if (!s || s.stale || s.state === "none" || s.state === "error" || s.state === "simulated") out.add(id)
  }
  if (out.has("site")) out.add("google")
  return out
}

export const REMEMBER_KEY = "donatti.publicar.canais"

/** Lê os canais lembrados (null se não houver, estiver inválido ou o armazenamento estiver bloqueado) */
export function readRemembered(): Channel[] | null {
  try {
    const raw = window.localStorage.getItem(REMEMBER_KEY)
    const v: unknown = raw ? JSON.parse(raw) : null
    return Array.isArray(v) ? (v.filter((x) => typeof x === "string") as Channel[]) : null
  } catch {
    return null
  }
}

export function writeRemembered(selected: Iterable<Channel>): void {
  try {
    window.localStorage.setItem(REMEMBER_KEY, JSON.stringify([...selected]))
  } catch {
    /* modo privado ou armazenamento cheio: segue sem lembrar */
  }
}

/**
 * Marcados ao abrir lembrando a última escolha: parte dos canais lembrados, tira o que já está publicado/agendado/compartilhado
 * e em dia, e Site marcado leva o Google. Nunca marca um canal que não estava na escolha lembrada.
 * Sem escolha lembrada (ou inválida), vale initialSelection.
 */
export function initialSelectionWith(status: Record<Channel, ChannelState>, remembered: Channel[] | null): Set<Channel> {
  const valid = new Set<Channel>(CHANNELS.map((c) => c.id))
  const kept = Array.isArray(remembered) ? remembered.filter((c) => valid.has(c)) : []
  if (!kept.length) return initialSelection(status)
  const out = new Set<Channel>()
  for (const id of kept) {
    const s = status[id]
    const done = s && !s.stale && (s.state === "published" || s.state === "scheduled" || s.state === "shared")
    if (!done) out.add(id)
  }
  if (out.has("site")) out.add("google")
  return out
}

export function stateLabel(s: ChannelState | undefined, channelLabel = "canal"): string {
  if (!s) return "—"
  switch (s.state) {
    case "none":
      return "—"
    case "published":
      return `✓ publicado${s.at ? ` ${shortDate(s.at)}` : ""}${s.by ? ` por ${s.by}` : ""}`
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
