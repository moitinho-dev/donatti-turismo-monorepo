"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { PromoData } from "@/components/promos/dashboard/types"
import { fetchStatus } from "@/hooks/usePublish"
import type { Channel } from "@/lib/channels"
import { uploadImage } from "@/lib/client/publishChannel"
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
  const apply = useCallback(
    (got: (Record<Channel, ChannelState> | null)[]) => {
      setRaw((prev) => ({ ...prev, ...Object.fromEntries(ids.flatMap((id, i) => (got[i] ? [[id, got[i]]] : []))) }))
      setLoad(got.every(Boolean) ? "ready" : "error")
    },
    [ids],
  )
  const reload = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoad("loading")
      apply(await Promise.all(ids.map((id) => fetchStatus(id))))
    },
    [ids, apply],
  )
  useEffect(() => {
    let alive = true
    void Promise.all(ids.map((id) => fetchStatus(id))).then((got) => alive && apply(got))
    return () => {
      alive = false
    }
  }, [ids, apply])
  const status: StatusByPromo = useMemo(
    () => Object.fromEntries(promos.filter((p) => raw[p.id]).map((p) => [p.id, withSiteState(raw[p.id], p.SITE_PUBLISHED === true)])),
    [promos, raw],
  )
  return { status, load, reload }
}

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
          .then((dataUrl) => uploadImage(dataUrl).catch(() => Promise.reject(new Error(UPLOAD_ERROR))))
        uploaded.current.set(key, p)
        p.catch(() => uploaded.current.delete(key))
      }
      return p
    },
    [renderOnce],
  )

  return { renderOnce, uploadOnce }
}
