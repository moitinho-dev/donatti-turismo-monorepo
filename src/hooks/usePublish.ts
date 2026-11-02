"use client"

import { useCallback, useEffect, useState } from "react"
import type { Channel } from "@/lib/channels"
import type { ChannelState, PublishState } from "@/lib/publishState"
import { SHARED_MARK_ERROR, UNSAVED } from "@/components/studio/v2/publishView"
import { errorOf, publishChannel, type PublishOptions, type PublishResult } from "@/lib/client/publishChannel"

export { uploadImage } from "@/lib/client/publishChannel"
export type { PublishOptions, PublishResult } from "@/lib/client/publishChannel"

/** Situação de cada canal; null se não deu para ler (mantém o que já estava na tela) */
async function fetchStatus(promoId: string): Promise<Record<Channel, ChannelState> | null> {
  try {
    const res = await fetch(`/api/publish?promoId=${encodeURIComponent(promoId)}`, { cache: "no-store" })
    return res.ok ? ((await res.json()) as Record<Channel, ChannelState>) : null
  } catch {
    return null
  }
}

/** Situação de cada canal da promo e as ações do Publicar; promoId nulo: nada é chamado */
export function usePublish(promoId: string | null) {
  const [status, setStatus] = useState<Record<Channel, ChannelState> | null>(null)
  /** A primeira situação lida: decide o que já vem marcado (uma vez só) */
  const [initialStatus, setInitialStatus] = useState<Record<Channel, ChannelState> | null>(null)
  /** A primeira leitura falhou (enquanto não houver situação na tela) */
  const [loadFailed, setLoadFailed] = useState(false)

  const apply = useCallback((next: Record<Channel, ChannelState> | null) => {
    if (next) {
      setStatus(next)
      setInitialStatus((cur) => cur ?? next)
      setLoadFailed(false)
    } else setLoadFailed(true)
  }, [])

  const refresh = useCallback(async () => {
    if (!promoId) return
    setLoadFailed(false)
    apply(await fetchStatus(promoId))
  }, [promoId, apply])

  useEffect(() => {
    if (!promoId) return
    let alive = true
    void fetchStatus(promoId).then((next) => alive && apply(next))
    return () => {
      alive = false
    }
  }, [promoId, apply])

  /** "loading" até a primeira leitura; "error" se ela falhou; sem promo salva: "idle" */
  const load: "idle" | "loading" | "ready" | "error" = !promoId ? "idle" : status ? "ready" : loadFailed ? "error" : "loading"

  const publish = useCallback(
    async (channel: Channel, opts: PublishOptions): Promise<PublishResult> => {
      if (!promoId) return { ok: false, error: UNSAVED }
      try {
        return await publishChannel(promoId, channel, opts)
      } finally {
        await refresh()
      }
    },
    [promoId, refresh],
  )

  /** Canal e Status do WhatsApp: a equipe compartilha pelo celular; aqui só fica registrado */
  const markShared = useCallback(
    async (channel: "wa-channel" | "wa-status"): Promise<PublishResult> => {
      if (!promoId) return { ok: false, error: UNSAVED }
      try {
        const res = await fetch("/api/publish/shared", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promoId, channel }),
        })
        if (!res.ok) return { ok: false, error: await errorOf(res, SHARED_MARK_ERROR) }
        const data = (await res.json()) as { status?: PublishState }
        return { ok: true, status: data.status ?? "shared" }
      } catch {
        return { ok: false, error: SHARED_MARK_ERROR }
      } finally {
        await refresh()
      }
    },
    [promoId, refresh],
  )

  return { status, initialStatus, load, refresh, publish, markShared }
}
