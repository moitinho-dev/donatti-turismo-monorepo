"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toPng } from "html-to-image"
import {
  Layers,
  ImageIcon,
  ZoomIn,
  ZoomOut,
  Type,
  Eye,
  EyeOff,
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
  Star,
  Grid3X3,
  Magnet,
} from "lucide-react"
import { useLayouts, type ElementConfig, type ImageArea } from "@/hooks/useLayouts"
import { SiteCardForm } from "./dashboard/SiteCardForm"
import { GoogleBusinessPanel } from "./dashboard/GoogleBusinessPanel"
import { InstagramPanel } from "./dashboard/InstagramPanel"
import type { PromoData, UserData } from "./dashboard/types"

// --- Constants ---
const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT_STORY = 1920
const CANVAS_HEIGHT_FEED = 1350
const SNAP_THRESHOLD = 8

const AVAILABLE_FONTS = [
  { name: "Montserrat", value: "'Montserrat', sans-serif", google: "Montserrat:wght@400;500;600;700;800;900" },
  { name: "Inter", value: "'Inter', sans-serif", google: "Inter:wght@400;500;600;700;800;900" },
  { name: "Poppins", value: "'Poppins', sans-serif", google: "Poppins:wght@400;500;600;700;800;900" },
  { name: "Roboto", value: "'Roboto', sans-serif", google: "Roboto:wght@400;500;700;900" },
  { name: "Open Sans", value: "'Open Sans', sans-serif", google: "Open+Sans:wght@400;500;600;700;800" },
  { name: "Playfair Display", value: "'Playfair Display', serif", google: "Playfair+Display:wght@400;500;600;700;800;900" },
]

const REGION_OPTIONS = ["Nordeste", "Sul", "Sudeste", "Norte", "Centro-Oeste", "Exterior", "Brasil"] as const
type RegionOption = (typeof REGION_OPTIONS)[number]

const elementLabels: Record<string, string> = {
  region: "Regiao", destination: "Destino", hotel: "Hotel", dates: "Datas",
  installments: "Parcelas", currency: "Moeda", price: "Preco",
  installmentText: "Texto Parcelas", flight: "Aereo", perPerson: "Por Pessoa",
  nights: "Noites", regime: "Regime", departureLabel: "Label Saida",
  departure: "Aeroporto", disclaimer: "Disclaimer", contactLabel: "Label Contato",
  contact: "Contato",
}

const normalizeFontFamily = (fontFamily: string | undefined): string => {
  if (!fontFamily) return "'Montserrat', sans-serif"
  if (fontFamily.includes("'") || fontFamily.includes('"')) return fontFamily
  const match = AVAILABLE_FONTS.find(f => f.name.toLowerCase() === fontFamily.toLowerCase())
  return match?.value || "'Montserrat', sans-serif"
}

const normalizeDestination = (value: string) =>
  (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

const inferRegion = (dest: string): RegionOption => {
  const d = normalizeDestination(dest)
  const ne = ["natal","recife","fortaleza","salvador","maceio","joao pessoa","aracaju","porto de galinhas","porto seguro","maragogi","jericoacoara","fernando de noronha","bahia","ceara","pernambuco"]
  const s = ["florianopolis","gramado","curitiba","foz do iguacu","balneario camboriu","canela","santa catarina","parana","rio grande do sul"]
  const se = ["rio de janeiro","sao paulo","belo horizonte","buzios","paraty","campos do jordao","minas gerais","aparecida"]
  const co = ["brasilia","goiania","bonito","caldas novas","pantanal","campo grande"]
  const n = ["manaus","belem","alter do chao","amazonas","para"]
  const intl = ["cancun","miami","orlando","paris","londres","roma","lisboa","dubai","buenos aires","santiago","punta cana"]
  if (intl.some(k => d.includes(k))) return "Exterior"
  if (ne.some(k => d.includes(k))) return "Nordeste"
  if (s.some(k => d.includes(k))) return "Sul"
  if (se.some(k => d.includes(k))) return "Sudeste"
  if (co.some(k => d.includes(k))) return "Centro-Oeste"
  if (n.some(k => d.includes(k))) return "Norte"
  return "Brasil"
}

// --- Style injection ---
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

// --- Types ---
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

// ============================================================
// MAIN COMPONENT
// ============================================================
export function DonatiStudio({
  promo, user,
  backgroundImage, setBackgroundImage,
  galleryImages, setGalleryImages,
  loadingImages, setLoadingImages,
  sitePublished, setSitePublished,
  siteSection, setSiteSection,
  siteSlug, setSiteSlug,
  siteDescription, setSiteDescription,
  savingSiteCard, siteCardError, siteCardMessage, onSaveSiteCard,
  gbp, ig, onClose,
}: DonatiStudioProps) {
  useStudioStyles()

  // --- Layout hook (direct, no nesting) ---
  const {
    layouts, currentLayout, isLoading: isLoadingLayouts,
    fetchLayouts, setCurrentLayout, updateElement,
    toggleElementVisibility, updateLayout, setAsDefault,
  } = useLayouts()

  // --- UI state ---
  const [activeTab, setActiveTab] = useState<"data" | "templates" | "publish">("data")
  const [zoom, setZoom] = useState(0.45)
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastDataUrl, setLastDataUrl] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showImageGallery, setShowImageGallery] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<"story" | "feed">("story")
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<RegionOption>(() => inferRegion(promo.DESTINO))
  const [showGrid, setShowGrid] = useState(false)
  const [snapEnabled, setSnapEnabled] = useState(true)

  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 })
  const [snapGuides, setSnapGuides] = useState<Array<{ type: "vertical" | "horizontal"; position: number }>>([])

  const canvasRef = useRef<HTMLDivElement>(null)
  const canvasHeight = currentLayout?.format === "feed" ? CANVAS_HEIGHT_FEED : CANVAS_HEIGHT_STORY

  // --- Load layouts ---
  useEffect(() => { fetchLayouts(selectedFormat) }, [selectedFormat]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setSelectedRegion(inferRegion(promo.DESTINO)) }, [promo.DESTINO])

  // Load Google Fonts
  useEffect(() => {
    const families = AVAILABLE_FONTS.map(f => f.google).join("&family=")
    const link = document.createElement("link")
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`
    link.rel = "stylesheet"
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  // --- Image search ---
  const searchImages = useCallback((query: string) => {
    if (!query.trim()) return
    setLoadingImages(true)
    fetch(`/api/image-search?query=${encodeURIComponent(query)}&limit=20`)
      .then(res => res.json())
      .then(data => { if (data.results?.length > 0) setGalleryImages(data.results) })
      .finally(() => setLoadingImages(false))
  }, [setGalleryImages, setLoadingImages])

  useEffect(() => {
    if (galleryImages.length === 0 && promo.DESTINO) searchImages(promo.DESTINO)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Promo values ---
  const promoValues = useMemo(() => {
    const totalValue = parseFloat(promo.VALOR) || 0
    const parcelas = parseInt(String(promo.PARCELAS || "15")) || 15
    return { totalValue, parcelas, installmentValue: totalValue / parcelas }
  }, [promo.VALOR, promo.PARCELAS])

  const getElementContent = useCallback((elementId: string) => {
    const { parcelas, installmentValue } = promoValues
    const getRegime = () => {
      if (promo.ALL_INCLUSIVE) return "All inclusive"
      if (promo.PENSAO_COMPLETA) return "Pensao completa"
      if (promo.MEIA_PENSAO) return "Meia pensao"
      if (promo.COM_CAFE) return "Com cafe da manha"
      if (promo.SEM_CAFE) return "Sem cafe da manha"
      return ""
    }
    const getAirport = () => {
      if (promo.CG && promo.SP) return "CGR ou GRU"
      if (promo.CG) return "Campo Grande (CGR)"
      if (promo.SP) return "Sao Paulo (GRU)"
      return ""
    }
    switch (elementId) {
      case "region": return selectedRegion
      case "destination": return promo.DESTINO
      case "hotel": return promo.HOTEL
      case "dates": return promo.DATA_FORMATADA
      case "installments": return `${parcelas}x de`
      case "currency": return "R$"
      case "price": return installmentValue.toFixed(2).replace(".", ",")
      case "installmentText": return `no cartao e ${parcelas}x no boleto sem juros.`
      case "flight": return promo.AEREO ? "Aereo Ida e Volta" : ""
      case "perPerson": return "Valor por pessoa"
      case "nights": return `${promo.NUMERO_DE_NOITES} Noites`
      case "regime": return getRegime()
      case "departureLabel": return "saindo de"
      case "departure": return getAirport()
      case "disclaimer": return "Preco por pessoa em apartamento duplo, sujeito a alteracao."
      case "contactLabel": return "Contato e Whatsapp"
      case "contact": return "(67) 9 9637-2769"
      default: return ""
    }
  }, [promo, promoValues, selectedRegion])

  const isElementVisibleByPromo = useCallback((elementId: string): boolean => {
    switch (elementId) {
      case "flight": return promo.AEREO === true
      case "regime": return !!(promo.ALL_INCLUSIVE || promo.PENSAO_COMPLETA || promo.MEIA_PENSAO || promo.COM_CAFE || promo.SEM_CAFE)
      case "departure": case "departureLabel": return promo.SP === true || promo.CG === true
      default: return true
    }
  }, [promo])

  const getAreaBounds = useCallback((area: ImageArea) => {
    const xs = area.points.map(p => p.x)
    const ys = area.points.map(p => p.y)
    return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) }
  }, [])

  // --- Drag handling ---
  const handleMouseDown = useCallback((elementId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!currentLayout?.elements[elementId]) return
    setSelectedElement(elementId)
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setElementStart({ x: currentLayout.elements[elementId].x, y: currentLayout.elements[elementId].y })
  }, [currentLayout])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !currentLayout) return
    const dx = (e.clientX - dragStart.x) / zoom
    const dy = (e.clientY - dragStart.y) / zoom
    let newX = Math.max(0, Math.min(CANVAS_WIDTH, elementStart.x + dx))
    let newY = Math.max(0, Math.min(canvasHeight, elementStart.y + dy))
    const guides: Array<{ type: "vertical" | "horizontal"; position: number }> = []
    if (snapEnabled) {
      const cx = CANVAS_WIDTH / 2, cy = canvasHeight / 2
      if (Math.abs(newX - cx) < SNAP_THRESHOLD) { newX = cx; guides.push({ type: "vertical", position: cx }) }
      if (Math.abs(newY - cy) < SNAP_THRESHOLD) { newY = cy; guides.push({ type: "horizontal", position: cy }) }
    }
    setSnapGuides(guides)
    updateElement(selectedElement, { x: newX, y: newY })
  }, [isDragging, selectedElement, currentLayout, dragStart, elementStart, zoom, canvasHeight, snapEnabled, updateElement])

  const handleMouseUp = useCallback(() => { setIsDragging(false); setSnapGuides([]) }, [])

  // --- Save & Export ---
  const handleSave = async () => {
    if (!currentLayout) return
    setIsSaving(true)
    try {
      await updateLayout(currentLayout.id, { elements: currentLayout.elements, colors: currentLayout.colors, imageAreas: currentLayout.imageAreas })
    } finally { setIsSaving(false) }
  }

  const handleExport = async () => {
    if (!canvasRef.current) return
    setIsExporting(true)
    try {
      await document.fonts.ready
      const dataUrl = await toPng(canvasRef.current, {
        quality: 1.0, width: CANVAS_WIDTH, height: canvasHeight, pixelRatio: 2,
        style: { transform: "none" }, cacheBust: true, skipAutoScale: true, includeQueryParams: true,
      })
      if (dataUrl) {
        setLastDataUrl(dataUrl)
        const link = document.createElement("a")
        link.download = `promo-${promo.DESTINO.toLowerCase().replace(/\s+/g, "-")}.png`
        link.href = dataUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      console.error("Export error:", err)
      try {
        const html2canvas = (await import("html2canvas")).default
        const captured = await html2canvas(canvasRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#ffffff" })
        const dataUrl = captured.toDataURL("image/png")
        setLastDataUrl(dataUrl)
        const link = document.createElement("a")
        link.download = `promo-${promo.DESTINO.toLowerCase().replace(/\s+/g, "-")}.png`
        link.href = dataUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch { alert("Erro ao exportar imagem.") }
    } finally { setIsExporting(false) }
  }

  const formatPrice = (valor: string) => {
    const v = parseFloat(valor || "0")
    const p = parseInt(String(promo.PARCELAS || "10"))
    return (v / p).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  const filteredLayouts = useMemo(() => layouts.filter(l => l.format === selectedFormat), [layouts, selectedFormat])

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row gap-3 bg-gray-950 text-gray-100 font-sans overflow-hidden text-[14px] p-3 selection:bg-amber-500 selection:text-black">

      {/* ========== LEFT PANEL ========== */}
      <motion.div
        initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 100 }}
        className="w-full md:w-[360px] flex flex-col h-full rounded-[20px] bg-gray-900 shadow-2xl overflow-hidden border border-gray-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-[52px] bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(247,158,10,0.4)] border border-gray-700">
              <img src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/1511914d-33e8-4dbe-aaf4-8a27bd98a45a/1773605008514-bb2f07ed/LOGOTIPO_PNG_COR.png" alt="Logo" className="w-4 h-4 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-[13px] leading-tight">Donatti Studio</span>
              <span className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Workspace Ativo
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-gray-900/50 border-b border-gray-800 gap-1">
          <StudioTabButton active={activeTab === "data"} onClick={() => setActiveTab("data")} icon={<FileText size={13} />}>Conteudo</StudioTabButton>
          <StudioTabButton active={activeTab === "templates"} onClick={() => setActiveTab("templates")} icon={<Layers size={13} />}>Visual</StudioTabButton>
          <StudioTabButton active={activeTab === "publish"} onClick={() => setActiveTab("publish")} icon={<Share2 size={13} />}>Publicar</StudioTabButton>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto studio-scrollbar p-4 bg-gray-900">
          <AnimatePresence mode="wait">
            {activeTab === "data" && (
              <motion.div key="data" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-4">
                <InfoRow label="Destino" value={promo.DESTINO || "Sem destino"} />
                <InfoRow label="Hotel" value={promo.HOTEL || "Sem hotel"} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Preco</label>
                  <div className="bg-gray-800 border border-gray-700 text-white text-[13px] rounded-lg p-2.5 shadow-sm font-bold">
                    R$ {formatPrice(promo.VALOR)} <span className="text-gray-400 font-normal">/ {promo.PARCELAS || 10}x</span>
                  </div>
                </div>
                <div className="h-px bg-gray-800" />
                {/* Image Gallery */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Galeria de Imagens</label>
                    <button onClick={() => setShowImageGallery(!showImageGallery)} className="text-amber-500 hover:text-amber-400 flex items-center gap-1 text-[11px] font-bold bg-amber-500/10 px-2 py-0.5 rounded-md transition-colors">
                      {showImageGallery ? <X size={11} /> : <Search size={11} />} {showImageGallery ? "Fechar" : "Buscar"}
                    </button>
                  </div>
                  {showImageGallery && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                      <input type="text" placeholder="Buscar imagens..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") searchImages(searchQuery || promo.DESTINO) }}
                        className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-[12px] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-all" />
                    </div>
                  )}
                  {loadingImages ? (
                    <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-amber-500" /></div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {galleryImages.slice(0, showImageGallery ? galleryImages.length : 4).map((img) => (
                        <button key={img.id} onClick={() => setBackgroundImage(img.urls.regular)}
                          className={`aspect-[4/3] bg-gray-800 border ${backgroundImage === img.urls.regular ? "border-amber-500 ring-2 ring-amber-500/20" : "border-gray-700 hover:border-amber-500/50"} rounded-xl overflow-hidden group relative cursor-pointer transition-all`}>
                          <img src={img.urls.small} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                          {backgroundImage === img.urls.regular && <div className="absolute top-1 left-1 bg-amber-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Capa</div>}
                        </button>
                      ))}
                    </div>
                  )}
                  {backgroundImage && (
                    <div className="flex items-center gap-2 p-2 bg-gray-800/50 border border-gray-700 rounded-lg">
                      <img src={backgroundImage} alt="" className="w-10 h-10 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-400">Imagem selecionada</p>
                        <button onClick={() => setBackgroundImage(null)} className="text-[11px] text-red-400 hover:text-red-300 font-medium">Remover</button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "templates" && (
              <motion.div key="templates" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-4">
                {/* Format toggle */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Formato</label>
                  <div className="flex gap-1 p-1 bg-gray-800 rounded-lg border border-gray-700">
                    <button onClick={() => { setSelectedFormat("story"); const l = layouts.find(x => x.format === "story"); if (l) setCurrentLayout(l) }}
                      className={`flex-1 py-1.5 rounded-md text-[12px] font-bold transition-all ${selectedFormat === "story" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"}`}>Story</button>
                    <button onClick={() => { setSelectedFormat("feed"); const l = layouts.find(x => x.format === "feed"); if (l) setCurrentLayout(l) }}
                      className={`flex-1 py-1.5 rounded-md text-[12px] font-bold transition-all ${selectedFormat === "feed" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"}`}>Feed</button>
                  </div>
                </div>
                {/* Template selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Template</label>
                  <div className="flex gap-2">
                    <select value={currentLayout?.id || ""} onChange={(e) => { const l = filteredLayouts.find(x => x.id === e.target.value); if (l) setCurrentLayout(l) }}
                      className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-amber-500">
                      {filteredLayouts.map(l => <option key={l.id} value={l.id}>{l.name} {l.isDefault ? "(Padrao)" : ""}</option>)}
                    </select>
                    <button onClick={async () => { if (currentLayout && !currentLayout.isDefault) { await setAsDefault(currentLayout.id); await fetchLayouts(selectedFormat) } }}
                      disabled={currentLayout?.isDefault} className={`p-2 rounded-lg border transition-colors ${currentLayout?.isDefault ? "bg-amber-500/20 border-amber-500/40 text-amber-500" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-amber-500"}`}>
                      <Star className={`h-4 w-4 ${currentLayout?.isDefault ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </div>
                {/* Region */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Regiao</label>
                  <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value as RegionOption)}
                    className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-amber-500">
                    {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="h-px bg-gray-800" />
                {/* Elements list */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Elementos</label>
                  <div className="flex flex-col gap-1">
                    {currentLayout && Object.entries(currentLayout.elements).map(([id, element]) => {
                      const promoVisible = isElementVisibleByPromo(id)
                      return (
                        <div key={id} onClick={() => setSelectedElement(id)}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedElement === id ? "bg-amber-500/10 border border-amber-500/40" : "hover:bg-gray-800 border border-transparent"} ${!promoVisible ? "opacity-40" : ""}`}>
                          <button onClick={(e) => { e.stopPropagation(); toggleElementVisibility(id) }} disabled={!promoVisible} className="p-0.5">
                            {element.visible && promoVisible ? <Eye className="h-3.5 w-3.5 text-amber-500" /> : <EyeOff className="h-3.5 w-3.5 text-gray-500" />}
                          </button>
                          <span className="text-[11px] text-gray-300 flex-1 truncate">{elementLabels[id] || id}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "publish" && (
              <motion.div key="publish" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-4">
                <div className="flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <Share className="text-amber-500 shrink-0 mt-0.5" size={14} />
                  <div>
                    <h3 className="text-amber-500 font-bold text-[12px] mb-0.5">Exportacao Omnichannel</h3>
                    <p className="text-amber-500/80 text-[11px] leading-relaxed">Configure SEO e disparo para redes sociais.</p>
                  </div>
                </div>
                <SiteCardForm sitePublished={sitePublished} setSitePublished={setSitePublished} siteSection={siteSection} setSiteSection={setSiteSection}
                  siteSlug={siteSlug} setSiteSlug={setSiteSlug} siteDescription={siteDescription} setSiteDescription={setSiteDescription}
                  destinoName={promo.DESTINO || ""} savingSiteCard={savingSiteCard} siteCardError={siteCardError} siteCardMessage={siteCardMessage} onSave={onSaveSiteCard} />
                {user.role === "admin" && (
                  <>
                    <GoogleBusinessPanel gbpConnected={gbp.gbpConnected} gbpAccountName={gbp.gbpAccountName} setGbpAccountName={gbp.setGbpAccountName}
                      gbpLocationName={gbp.gbpLocationName} setGbpLocationName={gbp.setGbpLocationName} gbpAccounts={gbp.gbpAccounts} gbpLocations={gbp.gbpLocations}
                      setGbpLocations={gbp.setGbpLocations} gbpMessage={gbp.gbpMessage} gbpError={gbp.gbpError} gbpBusy={gbp.gbpBusy}
                      onLoadAccounts={gbp.loadGbpAccounts} onLoadLocations={gbp.loadGbpLocations} onSaveTarget={gbp.saveGbpTarget} onSync={gbp.syncGbpPosts}
                      onPostSelected={() => promo.id && gbp.postPromoToGbp(promo.id)} hasSelectedPromo={!!promo.id} />
                    <InstagramPanel igConnected={ig.igConnected} igPageName={ig.igPageName} igBusy={ig.igBusy} igError={ig.igError} igMessage={ig.igMessage}
                      promoDestino={promo.DESTINO || ""} promoHotel={promo.HOTEL || ""} promoValor={promo.VALOR || ""} promoParcelas={promo.PARCELAS || "10"}
                      onPostFeed={(c) => { if (!lastDataUrl) { alert("Exporte a imagem primeiro."); return }; ig.postToInstagram(lastDataUrl, c, "FEED", promo.id) }}
                      onPostStories={(c) => { if (!lastDataUrl) { alert("Exporte a imagem primeiro."); return }; ig.postToInstagram(lastDataUrl, c, "STORIES", promo.id) }} />
                  </>
                )}
                <button onClick={onSaveSiteCard} disabled={savingSiteCard}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl transition-all font-black text-[13px] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(247,158,10,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50">
                  {savingSiteCard ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />} PUBLICAR EM MASSA
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ========== CANVAS AREA ========== */}
      <motion.div
        initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 100, delay: 0.1 }}
        className="flex-1 flex flex-col h-full rounded-[20px] bg-gray-900 shadow-2xl overflow-hidden border border-gray-800"
      >
        {/* Header */}
        <div className="h-[56px] px-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/80 backdrop-blur-md shrink-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-bold text-[15px]">Canvas</span>
            <span className="text-gray-700 mx-1">|</span>
            <span className="text-white font-medium text-[13px]">{promo.DESTINO} - {promo.HOTEL}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={isSaving}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-full border border-gray-700 transition-all font-bold shadow-sm text-[12px] disabled:opacity-50">
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Salvar
            </button>
            <button onClick={handleExport} disabled={isExporting}
              className="flex items-center gap-1.5 bg-white text-black hover:bg-gray-100 px-4 py-1.5 rounded-full transition-all font-bold shadow-md text-[12px] disabled:opacity-50">
              {isExporting ? <><Loader2 size={13} className="animate-spin" /> Exportando...</> : <><Download size={13} /> Exportar</>}
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 bg-gray-950 relative flex flex-col min-w-0"
            onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            {/* Dot grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            {/* Floating toolbar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-full h-10 px-4 flex items-center gap-3 shadow-xl z-20">
              <button className="text-gray-400 hover:text-white transition-colors" onClick={() => setZoom(z => Math.max(0.15, z - 0.1))}><ZoomOut size={15} /></button>
              <span className="text-white text-[12px] font-bold w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button className="text-gray-400 hover:text-white transition-colors" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}><ZoomIn size={15} /></button>
              <div className="w-px h-4 bg-gray-700" />
              <button className="text-gray-400 hover:text-white transition-colors" onClick={() => setZoom(0.45)} title="Reset"><RotateCcw size={15} /></button>
              <button className="text-gray-400 hover:text-white transition-colors" onClick={() => setZoom(1)} title="100%"><Maximize size={15} /></button>
              <div className="w-px h-4 bg-gray-700" />
              <button className={`transition-colors ${showGrid ? "text-amber-500" : "text-gray-400 hover:text-white"}`} onClick={() => setShowGrid(!showGrid)}><Grid3X3 size={15} /></button>
              <button className={`transition-colors ${snapEnabled ? "text-amber-500" : "text-gray-400 hover:text-white"}`} onClick={() => setSnapEnabled(!snapEnabled)}><Magnet size={15} /></button>
            </div>

            {/* Artboard */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-8 relative z-10 studio-scrollbar">
              {isLoadingLayouts || !currentLayout ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  <span className="text-gray-400 text-sm">Carregando template...</span>
                </div>
              ) : (
                <div className="relative bg-white shadow-2xl" style={{ width: CANVAS_WIDTH * zoom, height: canvasHeight * zoom }}>
                  <div ref={canvasRef} className="absolute inset-0 origin-top-left"
                    style={{ width: CANVAS_WIDTH, height: canvasHeight, transform: `scale(${zoom})` }}
                    onClick={() => setSelectedElement(null)}>
                    {/* Background Image */}
                    {backgroundImage && <img src={backgroundImage} alt="BG" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />}
                    {/* Image areas behind template */}
                    {currentLayout.imageAreas?.filter(a => a.visible && a.zIndex < 0).sort((a, b) => a.zIndex - b.zIndex).map((area) => {
                      const b = getAreaBounds(area)
                      return <div key={area.id} className="absolute overflow-hidden" style={{ left: b.x, top: b.y, width: b.width, height: b.height, zIndex: area.zIndex + 10 }}>
                        {(backgroundImage || area.imageUrl) && <img src={area.imageUrl || backgroundImage || ""} alt={area.name} className="w-full h-full" style={{ objectFit: area.fit }} crossOrigin="anonymous" />}
                      </div>
                    })}
                    {/* Template overlay */}
                    {currentLayout.url && <img src={currentLayout.url} alt="Template" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 20 }} crossOrigin="anonymous" />}
                    {/* Image areas in front of template */}
                    {currentLayout.imageAreas?.filter(a => a.visible && a.zIndex >= 0).sort((a, b) => a.zIndex - b.zIndex).map((area) => {
                      const b = getAreaBounds(area)
                      return <div key={area.id} className="absolute overflow-hidden" style={{ left: b.x, top: b.y, width: b.width, height: b.height, zIndex: area.zIndex + 30 }}>
                        {(backgroundImage || area.imageUrl) && <img src={area.imageUrl || backgroundImage || ""} alt={area.name} className="w-full h-full" style={{ objectFit: area.fit }} crossOrigin="anonymous" />}
                      </div>
                    })}
                    {/* Grid */}
                    {showGrid && <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 45 }}>
                      <svg width="100%" height="100%" className="opacity-20"><defs><pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="#fff" strokeWidth="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg>
                      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-amber-400 opacity-50" /><div className="absolute left-0 right-0 top-1/2 h-px bg-amber-400 opacity-50" />
                    </div>}
                    {/* Snap guides */}
                    {snapGuides.map((g, i) => <div key={i} className={`absolute bg-pink-500 ${g.type === "vertical" ? "w-px h-full top-0" : "h-px w-full left-0"}`} style={g.type === "vertical" ? { left: g.position, zIndex: 60 } : { top: g.position, zIndex: 60 }} />)}
                    {/* Text Elements */}
                    {Object.entries(currentLayout.elements).map(([id, el]) => {
                      if (!el.visible || !isElementVisibleByPromo(id)) return null
                      const content = getElementContent(id)
                      if (!content) return null
                      return <div key={id}
                        className={`absolute cursor-move select-none whitespace-nowrap ${selectedElement === id ? "ring-2 ring-amber-500 ring-offset-1 ring-offset-transparent" : ""}`}
                        style={{ left: el.x, top: el.y, fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, fontFamily: normalizeFontFamily(el.fontFamily), zIndex: 50 }}
                        onMouseDown={(e) => handleMouseDown(id, e)}>{content}</div>
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========== RIGHT PANEL: Properties ========== */}
          <div className="w-[260px] bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 overflow-hidden">
            <div className="h-[44px] border-b border-gray-800 bg-gray-900/50 flex items-center px-4 font-bold text-[12px] text-white shrink-0 uppercase tracking-wider">
              {selectedElement ? elementLabels[selectedElement] || selectedElement : "Propriedades"}
            </div>
            <div className="flex-1 overflow-y-auto studio-scrollbar p-3">
              {selectedElement && currentLayout?.elements[selectedElement] ? (
                <div className="flex flex-col gap-4">
                  {/* Position */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Posicao</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-gray-500 text-[9px]">X</span><input type="number" value={Math.round(currentLayout.elements[selectedElement].x)}
                        onChange={(e) => updateElement(selectedElement, { x: parseInt(e.target.value) || 0 })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-[12px] font-mono focus:outline-none focus:border-amber-500" /></div>
                      <div><span className="text-gray-500 text-[9px]">Y</span><input type="number" value={Math.round(currentLayout.elements[selectedElement].y)}
                        onChange={(e) => updateElement(selectedElement, { y: parseInt(e.target.value) || 0 })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-[12px] font-mono focus:outline-none focus:border-amber-500" /></div>
                    </div>
                  </div>
                  {/* Font Size */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Tamanho</span>
                    <input type="number" value={currentLayout.elements[selectedElement].fontSize}
                      onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) || 16 })} min="8" max="200"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-[12px] font-mono focus:outline-none focus:border-amber-500" />
                  </div>
                  {/* Font */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Fonte</span>
                    <select value={normalizeFontFamily(currentLayout.elements[selectedElement].fontFamily)}
                      onChange={(e) => updateElement(selectedElement, { fontFamily: e.target.value })}
                      className="bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:border-amber-500">
                      {AVAILABLE_FONTS.map(f => <option key={f.name} value={f.value}>{f.name}</option>)}
                    </select>
                  </div>
                  {/* Weight */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Peso</span>
                    <select value={currentLayout.elements[selectedElement].fontWeight}
                      onChange={(e) => updateElement(selectedElement, { fontWeight: e.target.value })}
                      className="bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:border-amber-500">
                      <option value="400">Normal</option><option value="500">Medium</option><option value="600">Semibold</option>
                      <option value="700">Bold</option><option value="800">Extrabold</option><option value="900">Black</option>
                    </select>
                  </div>
                  {/* Color */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Cor</span>
                    <div className="flex gap-2">
                      <input type="color" value={currentLayout.elements[selectedElement].color}
                        onChange={(e) => updateElement(selectedElement, { color: e.target.value })} className="w-8 h-7 rounded border border-gray-600 cursor-pointer" />
                      <input type="text" value={currentLayout.elements[selectedElement].color}
                        onChange={(e) => updateElement(selectedElement, { color: e.target.value })} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-[11px] text-white font-mono focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="flex gap-1 mt-1">
                      {["#FFFFFF", "#000000", "#F79E08", "#002043", "#DC2626", "#16A34A"].map(c => (
                        <button key={c} onClick={() => updateElement(selectedElement, { color: c })}
                          className="w-5 h-5 rounded border border-gray-600 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Dimensoes</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-gray-500 text-[9px]">W</span><input type="text" value={CANVAS_WIDTH} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-[12px] font-mono" readOnly /></div>
                      <div><span className="text-gray-500 text-[9px]">H</span><input type="text" value={canvasHeight} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-[12px] font-mono" readOnly /></div>
                    </div>
                  </div>
                  <div className="h-px bg-gray-800" />
                  <div className="flex flex-col gap-2 text-[11px]">
                    <span className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Dados</span>
                    <div className="flex justify-between"><span className="text-gray-500">Destino</span><span className="text-white font-medium truncate ml-2">{promo.DESTINO}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Hotel</span><span className="text-white font-medium truncate ml-2">{promo.HOTEL}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Valor</span><span className="text-amber-500 font-bold">R$ {formatPrice(promo.VALOR)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Noites</span><span className="text-white">{promo.NUMERO_DE_NOITES || "-"}</span></div>
                  </div>
                  <div className="h-px bg-gray-800" />
                  <p className="text-gray-500 text-[11px]">Clique em um elemento no canvas para editar suas propriedades.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// --- Sub-components ---
function StudioTabButton({ children, active, onClick, icon }: { children: React.ReactNode; active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-bold rounded-lg transition-all ${active ? "bg-gray-800 text-white shadow-sm border border-gray-700" : "text-gray-400 hover:text-white border border-transparent"}`} onClick={onClick}>
      {icon}{children}
    </button>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">{label}</label>
      <div className="bg-gray-800 border border-gray-700 text-white text-[13px] rounded-lg p-2.5 shadow-sm">{value}</div>
    </div>
  )
}
