"use client"

import { useState, useCallback } from "react"

export function useInstagram() {
  const [igConnected, setIgConnected] = useState(false)
  const [igPageName, setIgPageName] = useState("")
  const [igBusy, setIgBusy] = useState(false)
  const [igError, setIgError] = useState<string | null>(null)
  const [igMessage, setIgMessage] = useState<string | null>(null)

  const refreshIg = useCallback(async () => {
    try {
      const res = await fetch("/api/instagram/status")
      if (!res.ok) return
      const data = await res.json()
      setIgConnected(Boolean(data?.connected))
      setIgPageName(data?.pageName || "")
    } catch {
      // Status endpoint may not exist yet — silently ignore
    }
  }, [])

  /** Convert PNG data URL to JPEG base64 string */
  function pngToJpegBase64(pngDataUrl: string, quality = 0.92): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) { reject(new Error("Canvas context failed")); return }
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        const jpegDataUrl = canvas.toDataURL("image/jpeg", quality)
        const base64 = jpegDataUrl.split(",")[1]
        resolve(base64)
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = pngDataUrl
    })
  }

  const postToInstagram = useCallback(async (
    pngDataUrl: string,
    caption: string,
    mediaType: "FEED" | "STORIES",
    promoId?: string,
  ) => {
    setIgBusy(true)
    setIgError(null)
    setIgMessage(null)

    try {
      // Step 1: Convert PNG to JPEG
      const jpegBase64 = await pngToJpegBase64(pngDataUrl)

      // Step 2: Upload to Supabase Storage
      const uploadRes = await fetch("/api/instagram/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: jpegBase64,
          filename: `promo-${promoId || Date.now()}`,
        }),
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || "Erro no upload")

      // Step 3: Post to Instagram
      const postRes = await fetch("/api/instagram/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadData.publicUrl,
          caption,
          mediaType,
          promoId,
        }),
      })
      const postData = await postRes.json()
      if (!postRes.ok) throw new Error(postData.error || "Erro ao postar")

      const label = mediaType === "FEED" ? "Feed" : "Stories"
      setIgMessage(`Postado no ${label} do Instagram com sucesso!`)
      return postData
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao postar no Instagram"
      setIgError(msg)
      throw err
    } finally {
      setIgBusy(false)
    }
  }, [])

  return {
    igConnected,
    igPageName,
    igBusy,
    igError,
    igMessage,
    refreshIg,
    postToInstagram,
  }
}
