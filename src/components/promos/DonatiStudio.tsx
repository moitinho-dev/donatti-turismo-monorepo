"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Layers,
  ImageIcon,
  ZoomIn,
  ZoomOut,
  Type,
  Eye,
  Lock,
  Maximize,
  SlidersHorizontal,
  Plus,
  Save,
  Sparkles,
  Image as ImgIcon,
  Share2,
  Share,
  Instagram,
  MessageCircle,
  FileText,
  Download,
  Loader2,
  X,
  Search,
  RefreshCw,
  RotateCcw,
} from "lucide-react"
import { LayoutEditor } from "./editor/LayoutEditor"
import { SiteCardForm } from "./dashboard/SiteCardForm"
import { GoogleBusinessPanel } from "./dashboard/GoogleBusinessPanel"
import { InstagramPanel } from "./dashboard/InstagramPanel"
import type { PromoData, UserData } from "./dashboard/types"

interface GalleryImage {
  id: string
  urls: { regular: string; small: string }
}

interface DonatiStudioProps {
  promo: PromoData
  user: UserData
  backgroundImage: string | null
  setBackgroundImage: (v: string | null) => void
  galleryImages: GalleryImage[]
  setGalleryImages: (v: GalleryImage[]) => void
  loadingImages: boolean
  setLoadingImages: (v: boolean) => void
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

// Inject studio scrollbar styles once
const STUDIO_STYLE_ID = "donati-studio-styles"
function useStudioStyles() {
  useEffect(() => {
    if (document.getElementById(STUDIO_STYLE_ID)) return
    const style = document.createElement("style")
    style.id = STUDIO_STYLE_ID
    style.textContent = [
      ".studio-scrollbar::-webkit-scrollbar { width: 5px; }",
      ".studio-scrollbar::-webkit-scrollbar-track { background: transparent; }",
      ".studio-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }",
      ".studio-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }",
    ].join("\n")
    document.head.appendChild(style)
    return () => { style.remove() }
  }, [])
}

export function DonatiStudio({
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
}: DonatiStudioProps) {
  useStudioStyles()

  const [activeTab, setActiveTab] = useState<"data" | "templates" | "publish">("data")
  const [zoom, setZoom] = useState(45)
  const [isExporting, setIsExporting] = useState(false)
  const [lastDataUrl, setLastDataUrl] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showImageGallery, setShowImageGallery] = useState(false)

  const [layers] = useState([
    { id: 1, name: "Imagem de Fundo", type: "image" as const, visible: true, locked: true },
    { id: 2, name: "Gradiente Overlay", type: "adjustment" as const, visible: true, locked: false },
    { id: 3, name: "Titulo Destino", type: "text" as const, visible: true, locked: false },
    { id: 4, name: "Preco Pacote", type: "text" as const, visible: true, locked: false },
    { id: 5, name: "Badge Hotel", type: "shape" as const, visible: true, locked: false },
  ])
  const [activeLayer, setActiveLayer] = useState(1)

  const searchImages = useCallback((query: string) => {
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
  }, [setGalleryImages, setLoadingImages])

  useEffect(() => {
    if (galleryImages.length === 0 && promo.DESTINO) {
      searchImages(promo.DESTINO)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const formatPrice = (valor: string) => {
    const v = parseFloat(valor || "0")
    const parcelas = parseInt(String(promo.PARCELAS || "10"))
    const installment = v / parcelas
    return installment.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row gap-4 bg-gray-950 text-gray-100 font-sans overflow-hidden text-[14px] p-3 md:p-4 selection:bg-amber-500 selection:text-black">

      {/* --- LEFT ISLAND: Settings & Tools --- */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 100 }}
        className="w-full md:w-[380px] flex flex-col h-full rounded-[20px] bg-gray-900 shadow-2xl relative overflow-hidden border border-gray-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-[56px] bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(247,158,10,0.4)] border border-gray-700">
              <img
                src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/1511914d-33e8-4dbe-aaf4-8a27bd98a45a/1773605008514-bb2f07ed/LOGOTIPO_PNG_COR.png"
                alt="Donatti Logo"
                className="w-5 h-5 object-contain"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-bold text-white text-[14px] leading-tight">Donatti Studio</span>
              <span className="text-[11px] text-amber-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Workspace Ativo
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Floating Tabs */}
        <div className="flex p-2.5 bg-gray-900/50 border-b border-gray-800 gap-1">
          <StudioTabButton active={activeTab === "data"} onClick={() => setActiveTab("data")} icon={<FileText size={14} />}>
            Conteudo
          </StudioTabButton>
          <StudioTabButton active={activeTab === "templates"} onClick={() => setActiveTab("templates")} icon={<Layers size={14} />}>
            Visual
          </StudioTabButton>
          <StudioTabButton active={activeTab === "publish"} onClick={() => setActiveTab("publish")} icon={<Share2 size={14} />}>
            Publicar
          </StudioTabButton>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto studio-scrollbar p-4 bg-gray-900">
          <AnimatePresence mode="wait">
            {activeTab === "data" && (
              <motion.div
                key="data"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-5"
              >
                {/* Destination */}
                <div className="flex flex-col gap-2">
                  <label className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Destino Principal</label>
                  <div className="w-full bg-gray-800 border border-gray-700 text-white text-[13px] rounded-lg p-3 shadow-sm">
                    {promo.DESTINO || "Sem destino"}
                  </div>
                </div>

                {/* Hotel */}
                <div className="flex flex-col gap-2">
                  <label className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Hotel</label>
                  <div className="w-full bg-gray-800 border border-gray-700 text-white text-[13px] rounded-lg p-3 shadow-sm">
                    {promo.HOTEL || "Sem hotel"}
                  </div>
                </div>

                {/* Price */}
                <div className="flex flex-col gap-2">
                  <label className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Preco em Destaque</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400 text-[13px] font-medium">R$</span>
                    <div className="w-full bg-gray-800 border border-gray-700 text-white text-[13px] rounded-lg p-3 pl-9 shadow-sm font-bold">
                      {formatPrice(promo.VALOR)}
                      <span className="text-gray-400 font-normal ml-1">/ {promo.PARCELAS || 10}x</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-800 my-1" />

                {/* Image Gallery */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Galeria de Imagens</label>
                    <button
                      onClick={() => setShowImageGallery(!showImageGallery)}
                      className="text-amber-500 hover:text-amber-400 flex items-center gap-1 text-[12px] font-bold bg-amber-500/10 px-2 py-1 rounded-md transition-colors"
                    >
                      {showImageGallery ? <X size={12} /> : <Search size={12} />}
                      {showImageGallery ? "Fechar" : "Buscar"}
                    </button>
                  </div>

                  {showImageGallery && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Buscar imagens..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") searchImages(searchQuery || promo.DESTINO)
                        }}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-[13px] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                      />
                      <button
                        onClick={() => searchImages(searchQuery || promo.DESTINO)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${loadingImages ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  )}

                  {loadingImages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      {galleryImages.slice(0, showImageGallery ? galleryImages.length : 4).map((img) => (
                        <button
                          key={img.id}
                          onClick={() => setBackgroundImage(img.urls.regular)}
                          className={`aspect-[4/3] bg-gray-800 border ${
                            backgroundImage === img.urls.regular
                              ? "border-amber-500 ring-2 ring-amber-500/20"
                              : "border-gray-700 hover:border-amber-500/50"
                          } rounded-xl overflow-hidden group relative cursor-pointer transition-all shadow-sm`}
                        >
                          <img
                            src={img.urls.small}
                            alt="Destination"
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                          />
                          {backgroundImage === img.urls.regular && (
                            <div className="absolute top-1.5 left-1.5 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide shadow-md">
                              Selecionada
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-medium">Selecionar</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {backgroundImage && (
                    <div className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-xl">
                      <img
                        src={backgroundImage}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-gray-400">Imagem selecionada</p>
                        <button
                          onClick={() => setBackgroundImage(null)}
                          className="text-[12px] text-red-400 hover:text-red-300 font-medium"
                        >
                          Remover fundo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "templates" && (
              <motion.div
                key="templates"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="text-amber-500" size={14} />
                  </div>
                  <div>
                    <h3 className="text-amber-500 font-bold text-[13px] mb-1">Editor Visual</h3>
                    <p className="text-amber-500/80 text-[12px] leading-relaxed">O editor de templates esta integrado ao canvas. Use os controles do painel direito para ajustar propriedades visuais.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Tipografia</span>
                  <select className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 w-full text-[13px] focus:outline-none focus:border-amber-500 shadow-sm font-medium">
                    <option>Montserrat (Sans)</option>
                    <option>Inter (Modern)</option>
                    <option>Poppins (Round)</option>
                    <option>Playfair Display (Serif)</option>
                  </select>
                  <div className="flex gap-2 p-1 bg-gray-800 rounded-lg border border-gray-700">
                    <button className="flex-1 bg-gray-700 shadow-sm text-white py-1.5 rounded-md text-[12px] font-bold transition-all">Bold</button>
                    <button className="flex-1 text-gray-400 hover:text-white py-1.5 rounded-md text-[12px] font-medium transition-all">Regular</button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Design System</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 p-2 rounded-lg flex-1 shadow-sm">
                      <div className="w-5 h-5 rounded-sm bg-amber-500 shadow-inner border border-black/10"></div>
                      <span className="text-[12px] text-white font-mono font-medium">#F79E0A</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 p-2 rounded-lg flex-1 shadow-sm">
                      <div className="w-5 h-5 rounded-sm bg-gray-950 shadow-inner border border-gray-700"></div>
                      <span className="text-[12px] text-white font-mono font-medium">#0A0A0A</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "publish" && (
              <motion.div
                key="publish"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-5"
              >
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Share className="text-amber-500" size={14} />
                  </div>
                  <div>
                    <h3 className="text-amber-500 font-bold text-[13px] mb-1">Exportacao Omnichannel</h3>
                    <p className="text-amber-500/80 text-[12px] leading-relaxed">Configure SEO para o site e prepare o disparo simultaneo para redes sociais.</p>
                  </div>
                </div>

                {/* Site Card */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-white font-bold text-[14px] flex items-center gap-2 border-b border-gray-800 pb-2">
                    <ImgIcon size={14} className="text-gray-400" /> Card do Site
                  </h4>
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
                </div>

                {/* Distribution */}
                <div className="flex flex-col gap-4 pt-2">
                  <h4 className="text-white font-bold text-[14px] flex items-center gap-2 border-b border-gray-800 pb-2">
                    <Share2 size={14} className="text-gray-400" /> Distribuicao Automatica
                  </h4>

                  {/* Google Business */}
                  <div className="flex flex-col gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-amber-500/30 transition-colors shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center p-1.5 shadow-sm">
                          <svg viewBox="0 0 24 24" className="w-full h-full">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                        </div>
                        <span className="font-bold text-[13px] text-white">Google Business</span>
                      </div>
                      {gbp.gbpConnected ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">Ativo</span>
                      ) : (
                        <a href="/api/google-business/connect" className="text-[11px] font-bold bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white px-3 py-1 rounded-full transition-all">
                          Conectar
                        </a>
                      )}
                    </div>
                    {user.role === "admin" && (
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
                    )}
                  </div>

                  {/* Instagram */}
                  <div className="flex flex-col gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-amber-500/30 transition-colors shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-sm">
                          <Instagram size={14} />
                        </div>
                        <span className="font-bold text-[13px] text-white">Instagram</span>
                      </div>
                      {ig.igConnected ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">Ativo</span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-700 px-2 py-1 rounded-full border border-gray-600 uppercase tracking-wider">Desconectado</span>
                      )}
                    </div>
                    {user.role === "admin" && (
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
                            alert("Exporte a imagem primeiro antes de postar no Instagram.")
                            return
                          }
                          ig.postToInstagram(lastDataUrl, caption, "FEED", promo.id)
                        }}
                        onPostStories={(caption) => {
                          if (!lastDataUrl) {
                            alert("Exporte a imagem primeiro antes de postar no Instagram.")
                            return
                          }
                          ig.postToInstagram(lastDataUrl, caption, "STORIES", promo.id)
                        }}
                      />
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div className="flex flex-col gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-amber-500/30 transition-colors shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-sm">
                          <MessageCircle size={14} fill="currentColor" />
                        </div>
                        <span className="font-bold text-[13px] text-white">WhatsApp API</span>
                      </div>
                      <button className="text-[11px] font-bold bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white px-3 py-1 rounded-full transition-all">
                        Conectar
                      </button>
                    </div>
                    <label className="flex items-center gap-3 cursor-not-allowed bg-gray-800 p-2.5 border border-gray-700 rounded-lg opacity-60">
                      <StudioSwitch checked={false} />
                      <span className="text-[12px] text-gray-400 font-medium">Atualizar Catalogo e Status</span>
                    </label>
                  </div>
                </div>

                {/* Publish Button */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <button
                    onClick={onSaveSiteCard}
                    disabled={savingSiteCard}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-xl transition-all font-black text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(247,158,10,0.3)] hover:shadow-[0_6px_20px_rgba(247,158,10,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingSiteCard ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                    PUBLICAR EM MASSA
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* --- RIGHT ISLAND: Workspace Canvas --- */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 100, delay: 0.1 }}
        className="flex-1 flex flex-col h-full rounded-[20px] bg-gray-900 shadow-2xl relative overflow-hidden border border-gray-800"
      >
        {/* Workspace Header */}
        <div className="h-[64px] px-5 border-b border-gray-800 flex items-center justify-between bg-gray-900/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-bold text-[16px]">Canvas</span>
            <span className="text-gray-700 mx-2">|</span>
            <span className="text-white font-medium">{promo.DESTINO} - {promo.HOTEL}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full border border-gray-700 transition-all font-bold shadow-sm text-[13px]"
              onClick={onSaveSiteCard}
              disabled={savingSiteCard}
            >
              {savingSiteCard ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar
            </button>
            <button
              className="flex items-center gap-2 bg-white text-black hover:bg-gray-100 px-5 py-2 rounded-full transition-all font-bold shadow-md text-[13px]"
              onClick={() => {
                setIsExporting(true)
                setTimeout(() => setIsExporting(false), 1500)
              }}
              disabled={isExporting}
            >
              {isExporting ? (
                <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Renderizando...</span>
              ) : (
                <>
                  <Download size={14} />
                  Exportar Asset
                </>
              )}
            </button>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Central Canvas Area */}
          <div className="flex-1 bg-gray-950 relative flex flex-col min-w-0">
            {/* Dot Grid Background */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            />

            {/* Canvas Floating Toolbar */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-full h-11 px-5 flex items-center gap-4 shadow-xl z-20">
              <button className="text-gray-400 hover:text-white transition-colors p-1" onClick={() => setZoom(Math.max(10, zoom - 10))}>
                <ZoomOut size={16} />
              </button>
              <span className="text-white text-[13px] font-bold w-11 text-center">{zoom}%</span>
              <button className="text-gray-400 hover:text-white transition-colors p-1" onClick={() => setZoom(Math.min(200, zoom + 10))}>
                <ZoomIn size={16} />
              </button>
              <div className="w-px h-5 bg-gray-700 mx-1" />
              <button className="text-gray-400 hover:text-white transition-colors p-1" onClick={() => setZoom(45)} title="Resetar zoom">
                <RotateCcw size={16} />
              </button>
              <button className="text-gray-400 hover:text-white transition-colors p-1" onClick={() => setZoom(100)} title="100%">
                <Maximize size={16} />
              </button>
            </div>

            {/* Artboard Container */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-10 relative z-10 studio-scrollbar">
              <div
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "center",
                  transition: "transform 0.2s ease-out",
                }}
              >
                <LayoutEditor
                  promo={{
                    DESTINO: promo.DESTINO,
                    HOTEL: promo.HOTEL,
                    DATA_FORMATADA: promo.DATA_FORMATADA,
                    VALOR: promo.VALOR,
                    PARCELAS: promo.PARCELAS,
                    COM_CAFE: promo.COM_CAFE,
                    SEM_CAFE: promo.SEM_CAFE,
                    MEIA_PENSAO: promo.MEIA_PENSAO,
                    PENSAO_COMPLETA: promo.PENSAO_COMPLETA,
                    ALL_INCLUSIVE: promo.ALL_INCLUSIVE,
                    NUMERO_DE_NOITES: promo.NUMERO_DE_NOITES || "",
                    SP: promo.SP,
                    CG: promo.CG,
                    AEREO: promo.AEREO,
                  }}
                  backgroundImage={backgroundImage}
                  onDataUrlReady={(dataUrl) => setLastDataUrl(dataUrl)}
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Properties & Layers */}
          <div className="w-[280px] bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 z-10 relative">
            {/* Properties */}
            <div className="flex-1 flex flex-col">
              <div className="h-[52px] border-b border-gray-800 bg-gray-900/50 flex items-center px-4 font-bold text-[13px] text-white shrink-0 uppercase tracking-wider">
                Propriedades
              </div>
              <div className="p-4 flex flex-col gap-5 overflow-y-auto studio-scrollbar">
                <div className="flex flex-col gap-2.5">
                  <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Dimensoes (px)</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[10px]">W</span>
                      <input type="text" value="1080" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-amber-500 font-mono shadow-sm" readOnly />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[10px]">H</span>
                      <input type="text" value="1920" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-amber-500 font-mono shadow-sm" readOnly />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-800 my-1" />

                <div className="flex flex-col gap-2.5">
                  <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Dados da Promo</span>
                  <div className="flex flex-col gap-2 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Destino</span>
                      <span className="text-white font-medium truncate ml-2">{promo.DESTINO}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hotel</span>
                      <span className="text-white font-medium truncate ml-2">{promo.HOTEL}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Datas</span>
                      <span className="text-white font-medium">{promo.DATA_FORMATADA || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valor</span>
                      <span className="text-amber-500 font-bold">R$ {formatPrice(promo.VALOR)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Noites</span>
                      <span className="text-white font-medium">{promo.NUMERO_DE_NOITES || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-800 my-1" />

                <div className="flex flex-col gap-2.5">
                  <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Design System</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 p-2 rounded-lg flex-1 shadow-sm">
                      <div className="w-5 h-5 rounded-sm bg-amber-500 shadow-inner border border-black/10"></div>
                      <span className="text-[11px] text-white font-mono font-medium">#F79E0A</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 p-2 rounded-lg flex-1 shadow-sm">
                      <div className="w-5 h-5 rounded-sm bg-gray-950 shadow-inner border border-gray-700"></div>
                      <span className="text-[11px] text-white font-mono font-medium">#0A0A0A</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Layers Panel */}
            <div className="h-[38%] flex flex-col border-t border-gray-800 bg-gray-900">
              <div className="h-[44px] border-b border-gray-800 flex items-center justify-between px-4 shrink-0 bg-gray-900/50">
                <span className="font-bold text-[12px] text-white uppercase tracking-wider">Camadas</span>
                <button className="text-amber-500 hover:text-amber-400 bg-amber-500/10 p-1 rounded-md">
                  <Plus size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 studio-scrollbar flex flex-col gap-1.5">
                {layers.map((layer) => (
                  <button
                    key={layer.id}
                    className={`flex items-center px-3 py-2.5 gap-2.5 rounded-lg cursor-pointer border transition-all text-left w-full ${
                      activeLayer === layer.id
                        ? "bg-amber-500/10 border-amber-500/40 text-white shadow-sm"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:border-amber-500/30"
                    }`}
                    onClick={() => setActiveLayer(layer.id)}
                  >
                    <Eye size={14} className={layer.visible ? "text-amber-500" : "opacity-40"} />
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gray-700 border border-gray-600 shrink-0 text-gray-400">
                      {layer.type === "image" && <ImageIcon size={12} />}
                      {layer.type === "text" && <Type size={12} />}
                      {layer.type === "shape" && <Layers size={12} />}
                      {layer.type === "adjustment" && <SlidersHorizontal size={12} />}
                    </div>
                    <span className={`flex-1 text-[12px] truncate ${activeLayer === layer.id ? "font-bold" : "font-medium"}`}>
                      {layer.name}
                    </span>
                    {layer.locked && <Lock size={12} className="text-amber-500/60" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// --- Sub-components ---

function StudioTabButton({ children, active, onClick, icon }: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      className={`flex-1 py-2 flex items-center justify-center gap-2 text-[12px] font-bold rounded-lg transition-all duration-200 ${
        active
          ? "bg-gray-800 text-white shadow-sm border border-gray-700"
          : "text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent"
      }`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  )
}

function StudioSwitch({ checked, onChange }: { checked: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
        checked ? "bg-amber-500" : "bg-gray-600"
      }`}
    >
      <span className="sr-only">Toggle</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
          checked ? "translate-x-[18px]" : "translate-x-0"
        }`}
      />
    </button>
  )
}
