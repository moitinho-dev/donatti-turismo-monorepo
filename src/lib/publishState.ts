/** Situação de um canal no Publicar: tipos e regras sem banco, para usar também na tela */

export type PublishState = "none" | "published" | "scheduled" | "shared" | "simulated" | "error"

export interface ChannelState {
  state: PublishState
  at: string | null
  by: string | null
  error: string | null
  stale: boolean
  /** Só quando agendado: quando o post sai */
  scheduledFor?: string | null
}

export function needsConfirm(state: ChannelState): boolean {
  return (
    state.state === "published" ||
    state.state === "scheduled" ||
    state.state === "shared" ||
    state.state === "simulated"
  )
}
