"use client"

import { useCallback, useEffect, useState } from "react"
import type { Channel } from "@/lib/channels"
import type { ChannelState, PublishState } from "@/lib/publishState"
import { NETWORK_ERROR, SHARED_MARK_ERROR, UNSAVED, isUploadedUrl } from "@/components/studio/v2/publishView"

/** error só vem quando ok é false (o projeto roda sem strict, então o tipo não separa os dois casos) */
export interface PublishResult {
  ok: boolean
  status?: PublishState
  error?: string
  /** Só no Site publicado de verdade: campos do site como ficaram no servidor (SITE_PUBLISHED, seção, slug, foto) */
  promo?: Record<string, unknown>
}

export interface PublishOptions {
  /** URLs já enviadas ou data URLs (estas sobem antes por /api/meta/media) */
  images: string[]
  caption?: string
  /** ISO; só no feed do Facebook */
  scheduledAt?: string
  group?: { kind: "carousel" | "album"; promoIds: string[] }
}

const errorOf = async (res: Response, fallback: string) => {
  const data = await res.json().catch(() => null)
  return (data && typeof data.error === "string" && data.error) || fallback
}

/** Erro com mensagem já pronta para a equipe (o resto vira "sem conexão" ou mensagem simples) */
class PublishError extends Error {}

/** Sobe uma arte (data URL) e devolve a URL pública que a rede social e o Google vão baixar */
export async function uploadImage(dataUrl: string): Promise<string> {
  if (isUploadedUrl(dataUrl)) return dataUrl
  const res = await fetch("/api/meta/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: dataUrl }),
  })
  if (!res.ok) throw new PublishError(await errorOf(res, "Não foi possível enviar a arte"))
  const { url } = (await res.json()) as { url?: string }
  if (!url) throw new PublishError("Não foi possível enviar a arte")
  return url
}

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
        const images: string[] = []
        for (const img of opts.images) images.push(await uploadImage(img))
        const res = await fetch("/api/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            promoId,
            channel,
            images,
            ...(opts.caption ? { caption: opts.caption } : {}),
            ...(opts.scheduledAt ? { scheduledAt: opts.scheduledAt } : {}),
            ...(opts.group ? { group: opts.group } : {}),
          }),
        })
        if (!res.ok) return { ok: false, error: await errorOf(res, "Erro ao publicar") }
        const data = (await res.json()) as { status?: PublishState; promo?: Record<string, unknown> }
        return { ok: true, status: data.status ?? "published", ...(data.promo ? { promo: data.promo } : {}) }
      } catch (err) {
        // Falha de rede ("Failed to fetch", "Load failed") nunca aparece crua
        if (err instanceof PublishError && err.message) return { ok: false, error: err.message }
        return { ok: false, error: err instanceof TypeError ? NETWORK_ERROR : "Erro ao publicar" }
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
