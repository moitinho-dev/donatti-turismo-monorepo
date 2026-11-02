"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { PromoData } from "@/components/promos/dashboard/types"
import { fetchStatus } from "@/hooks/usePublish"
import type { Channel } from "@/lib/channels"
import { PublishError, uploadImage } from "@/lib/client/publishChannel"
import type { ChannelState } from "@/lib/publishState"
import type { ArtSet } from "../artSet"
import { renderDoc } from "../render"
import type { ArtFormat } from "../types"
import { promoVariables } from "../variables"
import type { StatusByPromo } from "./bulkView"
import { IMAGE_ERROR, UPLOAD_ERROR, withSiteState } from "./publishView"

/** Situação dos canais de cada promo (o Site segue a promo, como na lista); quiet: relê sem voltar a "carregando" */
export function useBulkStatus(promos: PromoData[], ids: string[]) {
  const [raw, setRaw] = useState<Record<string, Record<Channel, ChannelState>>>({})
  const [load, setLoad] = useState<"loading" | "ready" | "error">("loading")
  /** Releitura em andamento: a situação na tela pode estar velha (o Publicar espera) */
  const [refreshing, setRefreshing] = useState(false)
  // Só a leitura mais recente vale: uma resposta antiga que chega depois não sobrescreve a nova
  const seq = useRef(0)
  const apply = useCallback(
    (got: (Record<Channel, ChannelState> | null)[]) => {
      setRaw((prev) => ({ ...prev, ...Object.fromEntries(ids.flatMap((id, i) => (got[i] ? [[id, got[i]]] : []))) }))
      setLoad(got.every(Boolean) ? "ready" : "error")
    },
    [ids],
  )
  const reload = useCallback(
    async (quiet = false) => {
      const mine = ++seq.current
      if (!quiet) setLoad("loading")
      setRefreshing(true)
      const got = await Promise.all(ids.map((id) => fetchStatus(id)))
      if (mine !== seq.current) return
      apply(got)
      setRefreshing(false)
    },
    [ids, apply],
  )
  useEffect(() => {
    const mine = ++seq.current
    let alive = true
    void Promise.all(ids.map((id) => fetchStatus(id))).then((got) => alive && mine === seq.current && apply(got))
    return () => {
      alive = false
    }
  }, [ids, apply])
  const status: StatusByPromo = useMemo(
    () => Object.fromEntries(promos.filter((p) => raw[p.id]).map((p) => [p.id, withSiteState(raw[p.id], p.SITE_PUBLISHED === true)])),
    [promos, raw],
  )
  return { status, load, refreshing, reload }
}

/** Formatos que o WhatsApp compartilha (Canal: quadrado; Status: story) */
const WA_FORMATS: ArtFormat[] = ["square", "story"]

/** Artes do Publicar todas: cada promo × formato desenhada uma vez (JPEG 0,9) e enviada uma vez */
export function useBulkImages(promos: PromoData[], sets: Record<string, ArtSet | undefined>) {
  const rendered = useRef(new Map<string, Promise<string>>())
  const uploaded = useRef(new Map<string, Promise<string>>())

  const renderOnce = useCallback(
    (id: string, f: ArtFormat) => {
      const key = `${id}:${f}`
      let p = rendered.current.get(key)
      if (!p) {
        const set = sets[id]
        const promo = promos.find((x) => x.id === id)
        // Sem arte carregada (leitura que falhou na grade): não dá para gerar a imagem
        p = set && promo ? renderDoc(set.docs[f], promoVariables(promo as never), { mime: "image/jpeg", quality: 0.9 }) : Promise.reject(new Error(IMAGE_ERROR))
        rendered.current.set(key, p)
        p.catch(() => rendered.current.delete(key))
      }
      return p
    },
    [promos, sets],
  )

  const uploadOnce = useCallback(
    (id: string, f: ArtFormat) => {
      const key = `${id}:${f}`
      let p = uploaded.current.get(key)
      if (!p) {
        p = renderOnce(id, f)
          .catch(() => Promise.reject(new Error(IMAGE_ERROR)))
          // Mensagem do servidor passa; erro de rede ou desconhecido vira a mensagem simples
          .then((dataUrl) => uploadImage(dataUrl).catch((err) => Promise.reject(err instanceof PublishError ? err : new Error(UPLOAD_ERROR))))
        uploaded.current.set(key, p)
        p.then(
          // Já enviada: a data URL só fica guardada se o WhatsApp ainda puder precisar dela (quadrado e story)
          () => !WA_FORMATS.includes(f) && rendered.current.delete(key),
          () => uploaded.current.delete(key),
        )
      }
      return p
    },
    [renderOnce],
  )

  return { renderOnce, uploadOnce }
}
