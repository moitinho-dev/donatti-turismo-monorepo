"use client"

import { useCallback, useEffect, useState } from "react"

export interface MetaStatus {
  configured: boolean
  connected: boolean
  canManage: boolean
  pageName: string | null
  igUsername: string | null
  hasInstagram: boolean
  pages?: { id: string; name: string; instagram: string | null; selected: boolean }[]
  pagesError?: string
}

export type MetaNetwork = "facebook" | "instagram"

/** Conexão com a Meta e publicação (as imagens sobem uma a uma antes, por causa do limite de corpo da Vercel) */
export function useMeta() {
  const [status, setStatus] = useState<MetaStatus | null>(null)

  const refresh = useCallback(async (withPages = false) => {
    const res = await fetch(`/api/meta/status${withPages ? "?pages=1" : ""}`).catch(() => null)
    if (res?.ok) setStatus(await res.json())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const upload = async (image: string) => {
    if (/^https:\/\//.test(image)) return image
    const res = await fetch("/api/meta/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Erro ao enviar a imagem")
    return data.url as string
  }

  const publish = async (input: { network: MetaNetwork; kind: "post" | "story"; images: string[]; caption?: string; scheduledAt?: string; promoId?: string }) => {
    const images = []
    for (const img of input.images) images.push(await upload(img))
    const res = await fetch("/api/meta/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, images }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Erro ao publicar")
    return data as { id: string | null; scheduled: boolean }
  }

  const selectPage = async (pageId: string) => {
    const res = await fetch("/api/meta/page", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId }) })
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao trocar a Página")
    await refresh(true)
  }

  const disconnect = async () => {
    await fetch("/api/meta/status", { method: "DELETE" })
    await refresh()
  }

  return { status, refresh, publish, selectPage, disconnect }
}
