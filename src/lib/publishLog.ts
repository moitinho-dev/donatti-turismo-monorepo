import { createHash } from "node:crypto"
import type { Prisma } from "@prisma/client"
import prisma from "./db"
import { CHANNELS, type Channel } from "./channels"

export type PublishLogCreate = Prisma.PublishLogUncheckedCreateInput

export type PublishState = "none" | "published" | "scheduled" | "shared" | "simulated" | "error"

export interface ChannelState {
  state: PublishState
  at: string | null
  by: string | null
  error: string | null
  stale: boolean
}

export interface OfferFields {
  destino: string
  hotel: string
  dataFormatada: string
  valor: string
  parcelas: number | string
  numeroDeNoites: string
}

export function offerHash(p: OfferFields): string {
  const raw = [p.destino, p.hotel, p.dataFormatada, p.valor, p.parcelas, p.numeroDeNoites].join("|")
  return createHash("sha1").update(raw).digest("hex")
}

export interface ChannelLogInput {
  channel: Channel
  status: string
  createdAt: Date
  createdByName?: string | null
  error?: string | null
  offerHash: string
}

const NONE: ChannelState = { state: "none", at: null, by: null, error: null, stale: false }

export function channelStatus(logs: ChannelLogInput[], currentHash: string): Record<Channel, ChannelState> {
  const latest = new Map<Channel, ChannelLogInput>()
  for (const log of logs) {
    const prev = latest.get(log.channel)
    if (!prev || log.createdAt.getTime() > prev.createdAt.getTime()) latest.set(log.channel, log)
  }
  const out = {} as Record<Channel, ChannelState>
  for (const { id } of CHANNELS) {
    const log = latest.get(id)
    if (!log) {
      out[id] = { ...NONE }
      continue
    }
    const state = log.status as PublishState
    out[id] = {
      state,
      at: log.createdAt.toISOString(),
      by: log.createdByName ?? null,
      error: log.error ?? null,
      stale: state !== "none" && state !== "error" && log.offerHash !== currentHash,
    }
  }
  return out
}

export function needsConfirm(state: ChannelState): boolean {
  return (
    state.state === "published" ||
    state.state === "scheduled" ||
    state.state === "shared" ||
    state.state === "simulated"
  )
}

/** Mesma regra das promos: admin publica qualquer uma; agente só as que criou */
export function canPublish(user: { id: string; admin: boolean }, promo: { createdById: string }): boolean {
  return user.admin || promo.createdById === user.id
}

export async function recordPublish(data: Omit<PublishLogCreate, "id" | "createdAt">): Promise<void> {
  await prisma.publishLog.create({ data })
}
