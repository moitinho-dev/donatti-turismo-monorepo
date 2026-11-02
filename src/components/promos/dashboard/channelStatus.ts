import { CHANNELS, type Channel } from "@/lib/channels"
import type { PublishState } from "@/lib/publishState"

/** Situação de cada canal no card da lista (sem tela, para testar) */

export type ChannelTone = "ok" | "simulated" | "error" | "none"

export const toneOf = (state: PublishState): ChannelTone =>
  state === "published" || state === "scheduled" || state === "shared"
    ? "ok"
    : state === "simulated"
      ? "simulated"
      : state === "error"
        ? "error"
        : "none"

const SITUATION: Record<PublishState, string> = {
  none: "não publicado",
  published: "publicado",
  scheduled: "agendado",
  shared: "compartilhado",
  simulated: "simulado",
  error: "erro ao publicar",
}

export interface CardChannel {
  channel: Channel
  label: string
  state: PublishState
  tone: ChannelTone
  /** "Site: publicado" (dica e leitor de tela) */
  text: string
}

/**
 * Os 8 canais com o estado do último registro. O Site segue a promo: no site conta como publicado
 * (a lista publica sem registro); fora do site só mostra simulação ou erro da última tentativa.
 */
export function cardChannels(states: Partial<Record<Channel, PublishState>> | undefined, sitePublished: boolean): CardChannel[] {
  return CHANNELS.map(({ id, label }) => {
    let state: PublishState = states?.[id] ?? "none"
    if (id === "site") {
      if (sitePublished) state = "published"
      else if (state !== "simulated" && state !== "error") state = "none"
    }
    return { channel: id, label, state, tone: toneOf(state), text: `${label}: ${SITUATION[state]}` }
  })
}
