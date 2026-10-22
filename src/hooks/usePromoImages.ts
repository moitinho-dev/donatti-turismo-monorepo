"use client"

import { useState, useEffect, useRef } from "react"
import type { PromoData } from "@/components/promos/dashboard/types"
import { normalizeDestination } from "@/lib/destinations"

// Cache por destino entre renders: dez promos de "Cancún" fazem uma única busca
const destinationImageCache = new Map<string, Promise<string | null>>()

function fetchDestinationThumb(destino: string): Promise<string | null> {
  const key = normalizeDestination(destino)
  if (!key) return Promise.resolve(null)
  const cached = destinationImageCache.get(key)
  if (cached) return cached

  const request = fetch(`/api/image-search?query=${encodeURIComponent(destino)}&limit=1&orientation=landscape`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => (data?.results?.[0]?.urls?.small as string | undefined) || null)
    .catch(() => {
      destinationImageCache.delete(key)
      return null
    })

  destinationImageCache.set(key, request)
  return request
}

export function usePromoImages(promos: PromoData[]) {
  const [promoImages, setPromoImages] = useState<Record<string, string>>({})
  const [loadingPromoImages, setLoadingPromoImages] = useState<Record<string, boolean>>({})
  const requested = useRef(new Set<string>())

  useEffect(() => {
    // Foto salva no card sempre vence a busca automática
    const saved: Record<string, string> = {}
    for (const promo of promos) {
      if (promo.SITE_IMAGE) saved[promo.id] = promo.SITE_IMAGE
    }
    if (Object.keys(saved).length) setPromoImages((prev) => ({ ...prev, ...saved }))

    const pending = promos.filter((p) => !p.SITE_IMAGE && !requested.current.has(p.id))
    if (pending.length === 0) return

    pending.forEach((p) => requested.current.add(p.id))
    setLoadingPromoImages((prev) => ({ ...prev, ...Object.fromEntries(pending.map((p) => [p.id, true])) }))

    pending.forEach((promo) => {
      void fetchDestinationThumb(promo.DESTINO).then((url) => {
        if (url) setPromoImages((prev) => (prev[promo.id] ? prev : { ...prev, [promo.id]: url }))
        setLoadingPromoImages((prev) => {
          const next = { ...prev }
          delete next[promo.id]
          return next
        })
      })
    })
  }, [promos])

  const updatePromoImage = (promoId: string, imageUrl: string) => {
    setPromoImages((prev) => ({ ...prev, [promoId]: imageUrl }))
  }

  return { promoImages, loadingPromoImages, updatePromoImage }
}
