"use client"

import { useState, useEffect } from "react"
import type { PromoData } from "@/components/promos/dashboard/types"

export function usePromoImages(promos: PromoData[]) {
  const [promoImages, setPromoImages] = useState<Record<string, string>>({})
  const [loadingPromoImages, setLoadingPromoImages] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (promos.length === 0) return

    const fetchImagesForPromos = async () => {
      const newImages: Record<string, string> = {}
      const loading: Record<string, boolean> = {}

      for (const promo of promos) {
        if (!promoImages[promo.id]) {
          loading[promo.id] = true
        }
      }
      setLoadingPromoImages(loading)

      for (const promo of promos) {
        if (!promoImages[promo.id]) {
          if (promo.SITE_IMAGE) {
            newImages[promo.id] = promo.SITE_IMAGE
            continue
          }
          try {
            const response = await fetch(`/api/image-search?query=${encodeURIComponent(promo.DESTINO)}&limit=1`)
            const data = await response.json()
            if (data.results?.[0]) {
              newImages[promo.id] = data.results[0].urls.small
            }
          } catch (err) {
            console.error("Error fetching image for", promo.DESTINO)
          }
        }
      }

      setPromoImages(prev => ({ ...prev, ...newImages }))
      setLoadingPromoImages({})
    }

    fetchImagesForPromos()
  }, [promos]) // eslint-disable-line react-hooks/exhaustive-deps

  const updatePromoImage = (promoId: string, imageUrl: string) => {
    setPromoImages(prev => ({ ...prev, [promoId]: imageUrl }))
  }

  return { promoImages, loadingPromoImages, updatePromoImage }
}
