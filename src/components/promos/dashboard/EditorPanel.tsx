"use client"

import { useState } from "react"
import {
  Search,
  Loader2,
  Eye,
  RefreshCw,
  X,
  Image as ImageIcon,
} from "lucide-react"
import { LayoutEditor } from "../editor/LayoutEditor"
import { SiteCardForm } from "./SiteCardForm"
import { GoogleBusinessPanel } from "./GoogleBusinessPanel"
import { InstagramPanel } from "./InstagramPanel"
import type { PromoData, UserData } from "./types"
import { slugify } from "./types"

interface GalleryImage {
  id: string
  urls: { regular: string; small: string }
}

interface EditorPanelProps {
  promo: PromoData
  user: UserData
  backgroundImage: string | null
  setBackgroundImage: (v: string | null) => void
  galleryImages: GalleryImage[]
  setGalleryImages: (v: GalleryImage[]) => void
  loadingImages: boolean
  setLoadingImages: (v: boolean) => void
  // Site card
  sitePublished: boolean
  setSitePublished: (v: boolean) => void
  siteSection: string
  setSiteSection: (v: string) => void
  siteSlug: string
  setSiteSlug: (v: string) => void
  siteDescription: string
  setSiteDescription: (v: string) => void
  savingSiteCard: boolean
  siteCardError: string | null
  siteCardMessage: string | null
  onSaveSiteCard: () => void
  // GBP
  gbp: {
    gbpConnected: boolean
    gbpAccountName: string
    setGbpAccountName: (v: string) => void
    gbpLocationName: string
    setGbpLocationName: (v: string) => void
    gbpAccounts: Array<{ name: string; accountName?: string }>
    gbpLocations: Array<{ name: string; title?: string }>
    setGbpLocations: (v: Array<{ name: string; title?: string }>) => void
    gbpMessage: string | null
    gbpError: string | null
    gbpBusy: boolean
    loadGbpAccounts: () => void
    loadGbpLocations: (accountName: string) => void
    saveGbpTarget: () => void
    syncGbpPosts: () => void
    postPromoToGbp: (promoId: string) => void
  }
  // Instagram
  ig: {
    igConnected: boolean
    igPageName: string
    igBusy: boolean
    igError: string | null
    igMessage: string | null
    postToInstagram: (dataUrl: string, caption: string, mediaType: "FEED" | "STORIES", promoId?: string) => Promise<unknown>
  }
  onClose: () => void
}

export function EditorPanel({
  promo,
  user,
  backgroundImage,
  setBackgroundImage,
  galleryImages,
  setGalleryImages,
  loadingImages,
  setLoadingImages,
  sitePublished,
  setSitePublished,
  siteSection,
  setSiteSection,
  siteSlug,
  setSiteSlug,
  siteDescription,
  setSiteDescription,
  savingSiteCard,
  siteCardError,
  siteCardMessage,
  onSaveSiteCard,
  gbp,
  ig,
  onClose,
}: EditorPanelProps) {
  const [lastDataUrl, setLastDataUrl] = useState<string | null>(null)
  const searchImages = (query: string) => {
    if (!query.trim()) return
    setLoadingImages(true)
    fetch(`/api/image-search?query=${encodeURIComponent(query)}&limit=20`)
      .then(res => res.json())
      .then(data => {
        if (data.results?.length > 0) {
          setGalleryImages(data.results)
        }
      })
      .finally(() => setLoadingImages(false))
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex">
      {/* Left Sidebar - Image Gallery */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Imagens de Fundo</h3>
            <p className="text-xs text-gray-400">{promo.DESTINO}</p>
          </div>
          <button
            onClick={() => searchImages(promo.DESTINO)}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
            title="Recarregar imagens"
          >
            <RefreshCw className={`h-4 w-4 ${loadingImages ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar outras imagens..."
              className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchImages((e.target as HTMLInputElement).value)
                }
              }}
            />
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {loadingImages ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm text-gray-400">Buscando imagens...</p>
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-12 w-12 text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">Nenhuma imagem encontrada</p>
              <p className="text-xs text-gray-500 mt-1">Tente buscar por outro termo</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {galleryImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setBackgroundImage(img.urls.regular)}
                  className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all group ${
                    backgroundImage === img.urls.regular
                      ? "border-blue-500 ring-2 ring-blue-500/30"
                      : "border-gray-700 hover:border-gray-500"
                  }`}
                >
                  <img src={img.urls.small} alt="" className="w-full h-full object-cover" />
                  {backgroundImage === img.urls.regular && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Selecionar</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="border-t border-gray-700 bg-gray-750 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <img
              src={backgroundImage || "/images/hero-beach.jpg"}
              alt=""
              className="w-12 h-12 rounded object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">{backgroundImage ? "Imagem selecionada" : "Selecione uma imagem"}</p>
              {backgroundImage && (
                <button
                  onClick={() => setBackgroundImage(null)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remover fundo
                </button>
              )}
            </div>
          </div>

          <SiteCardForm
            sitePublished={sitePublished}
            setSitePublished={setSitePublished}
            siteSection={siteSection}
            setSiteSection={setSiteSection}
            siteSlug={siteSlug}
            setSiteSlug={setSiteSlug}
            siteDescription={siteDescription}
            setSiteDescription={setSiteDescription}
            destinoName={promo.DESTINO || ""}
            savingSiteCard={savingSiteCard}
            siteCardError={siteCardError}
            siteCardMessage={siteCardMessage}
            onSave={onSaveSiteCard}
          />

          {user.role === "admin" && (
            <>
            <GoogleBusinessPanel
              gbpConnected={gbp.gbpConnected}
              gbpAccountName={gbp.gbpAccountName}
              setGbpAccountName={gbp.setGbpAccountName}
              gbpLocationName={gbp.gbpLocationName}
              setGbpLocationName={gbp.setGbpLocationName}
              gbpAccounts={gbp.gbpAccounts}
              gbpLocations={gbp.gbpLocations}
              setGbpLocations={gbp.setGbpLocations}
              gbpMessage={gbp.gbpMessage}
              gbpError={gbp.gbpError}
              gbpBusy={gbp.gbpBusy}
              onLoadAccounts={gbp.loadGbpAccounts}
              onLoadLocations={gbp.loadGbpLocations}
              onSaveTarget={gbp.saveGbpTarget}
              onSync={gbp.syncGbpPosts}
              onPostSelected={() => promo.id && gbp.postPromoToGbp(promo.id)}
              hasSelectedPromo={!!promo.id}
            />

            <InstagramPanel
              igConnected={ig.igConnected}
              igPageName={ig.igPageName}
              igBusy={ig.igBusy}
              igError={ig.igError}
              igMessage={ig.igMessage}
              promoDestino={promo.DESTINO || ""}
              promoHotel={promo.HOTEL || ""}
              promoValor={promo.VALOR || ""}
              promoParcelas={promo.PARCELAS || "10"}
              onPostFeed={(caption) => {
                if (!lastDataUrl) {
                  alert("Exporte a imagem primeiro (clique em Baixar) antes de postar no Instagram.")
                  return
                }
                ig.postToInstagram(lastDataUrl, caption, "FEED", promo.id)
              }}
              onPostStories={(caption) => {
                if (!lastDataUrl) {
                  alert("Exporte a imagem primeiro (clique em Baixar) antes de postar no Instagram.")
                  return
                }
                ig.postToInstagram(lastDataUrl, caption, "STORIES", promo.id)
              }}
            />
            </>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
              Fechar
            </button>
            <div className="h-6 w-px bg-gray-700" />
            <div>
              <h2 className="text-sm font-semibold text-white">{promo.DESTINO}</h2>
              <p className="text-xs text-gray-400">{promo.HOTEL}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <LayoutEditor
            promo={{ ...promo, NUMERO_DE_NOITES: promo.NUMERO_DE_NOITES || "" }}
            backgroundImage={backgroundImage}
            onSave={onSaveSiteCard}
            onExport={onSaveSiteCard}
            onDataUrlReady={(dataUrl) => setLastDataUrl(dataUrl)}
          />
        </div>
      </div>
    </div>
  )
}
