"use client"

import { useState } from "react"
import { Loader2, Instagram } from "lucide-react"

interface InstagramPanelProps {
  igConnected: boolean
  igPageName: string
  igBusy: boolean
  igError: string | null
  igMessage: string | null
  onPostFeed: (caption: string) => void
  onPostStories: (caption: string) => void
  promoDestino: string
  promoHotel: string
  promoValor: string
  promoParcelas: string | number
}

export function InstagramPanel({
  igConnected,
  igPageName,
  igBusy,
  igError,
  igMessage,
  onPostFeed,
  onPostStories,
  promoDestino,
  promoHotel,
  promoValor,
  promoParcelas,
}: InstagramPanelProps) {
  const defaultCaption = [
    `${promoDestino} - ${promoHotel}`,
    promoValor ? `A partir de ${promoParcelas || 10}x no cartao` : "",
    "",
    "Entre em contato e garanta sua viagem!",
    "",
    "#donattiturismo #viagem #turismo #pacotedeviagem",
  ]
    .filter(Boolean)
    .join("\n")

  const [caption, setCaption] = useState(defaultCaption)

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Instagram className="h-4 w-4 text-pink-400" />
          <div>
            <p className="text-sm font-semibold text-white">Instagram</p>
            {igConnected && igPageName && (
              <p className="text-[11px] text-gray-400">{igPageName}</p>
            )}
          </div>
        </div>
        <a
          href="/api/instagram/connect"
          className="text-[11px] rounded-md bg-gray-900 border border-gray-700 px-3 py-1.5 text-gray-200 hover:bg-gray-850"
        >
          {igConnected ? "Reconectar" : "Conectar"}
        </a>
      </div>

      {igConnected && (
        <>
          <div className="space-y-2">
            <label className="text-[11px] text-gray-400">Legenda</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Legenda do post..."
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onPostFeed(caption)}
              disabled={igBusy || !caption.trim()}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-semibold py-2 disabled:opacity-50"
            >
              {igBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Feed
            </button>
            <button
              type="button"
              onClick={() => onPostStories(caption)}
              disabled={igBusy || !caption.trim()}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-xs font-semibold py-2 disabled:opacity-50"
            >
              {igBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Stories
            </button>
          </div>
        </>
      )}

      {!igConnected && (
        <p className="text-[11px] text-gray-500">
          Conecte sua conta Instagram Business para postar direto do editor.
        </p>
      )}

      {igError && <p className="text-[11px] text-red-400">{igError}</p>}
      {igMessage && <p className="text-[11px] text-green-400">{igMessage}</p>}
    </div>
  )
}
