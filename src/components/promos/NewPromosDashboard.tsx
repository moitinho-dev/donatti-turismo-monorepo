"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { usePromo } from "@/hooks/usePromo"
import { signOut } from "next-auth/react"
import { toPng } from "html-to-image"
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Calendar,
  MapPin,
  Hotel,
  DollarSign,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Download,
  MoreVertical,
  X,
  ChevronDown,
  Loader2,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Moon,
  Bell,
  User,
  Plane,
  Coffee,
  Utensils,
  Eye,
  RefreshCw,
  ImagePlus,
  Users,
} from "lucide-react"
import Link from "next/link"
import { PromoForm } from "./PromoForm"
import { LayoutEditor } from "./editor/LayoutEditor"
import { ImageGallery } from "./ImageGallery"

interface UserData {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
}

interface NewPromosDashboardProps {
  user: UserData
}

type ViewMode = "grid" | "list"
type ActivePanel = "list" | "form" | "editor" | "stats"

export default function NewPromosDashboard({ user }: NewPromosDashboardProps) {
  const { promos, isLoading, error, fetchPromos, deletePromo, stats, fetchStats } = usePromo()

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [activePanel, setActivePanel] = useState<ActivePanel>("list")
  const [selectedPromo, setSelectedPromo] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    region: "",
    dateFrom: "",
    dateTo: "",
    priceMin: "",
    priceMax: "",
  })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [showImageGallery, setShowImageGallery] = useState(true)
  const [galleryImages, setGalleryImages] = useState<any[]>([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [promoImages, setPromoImages] = useState<Record<string, string>>({})
  const [loadingPromoImages, setLoadingPromoImages] = useState<Record<string, boolean>>({})
  const [downloadingPromo, setDownloadingPromo] = useState<string | null>(null)

  useEffect(() => {
    fetchPromos()
    fetchStats()
  }, [])

  // Fetch images for promos when they load
  useEffect(() => {
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

    if (promos.length > 0) {
      fetchImagesForPromos()
    }
  }, [promos])

  // Filter promos
  const filteredPromos = promos.filter((promo) => {
    const matchesSearch =
      promo.DESTINO?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.HOTEL?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Handle edit
  const handleEdit = (promo: any) => {
    setSelectedPromo(promo)
    setActivePanel("form")
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    await deletePromo(id)
    setDeleteConfirm(null)
    fetchPromos()
  }

  // Handle generate image
  const handleGenerateImage = async (promo: any) => {
    setSelectedPromo(promo)
    setLoadingImages(true)

    try {
      const response = await fetch(`/api/image-search?query=${encodeURIComponent(promo.DESTINO)}&limit=20`)
      const data = await response.json()
      if (data.results?.length > 0) {
        setGalleryImages(data.results)
        setBackgroundImage(data.results[0].urls.regular)
      }
    } catch (err) {
      console.error("Error fetching images:", err)
    } finally {
      setLoadingImages(false)
    }

    setActivePanel("editor")
  }

  // Handle form success
  const handleFormSuccess = () => {
    setActivePanel("list")
    setSelectedPromo(null)
    fetchPromos()
    fetchStats()
  }

  // Get regime label
  const getRegimeLabel = (promo: any) => {
    if (promo.ALL_INCLUSIVE) return "All Inclusive"
    if (promo.PENSAO_COMPLETA) return "Pensao Completa"
    if (promo.MEIA_PENSAO) return "Meia Pensao"
    if (promo.COM_CAFE) return "Com Cafe"
    if (promo.SEM_CAFE) return "Sem Cafe"
    return "-"
  }

  // Get departure label
  const getDepartureLabel = (promo: any) => {
    const airports = []
    if (promo.CG) airports.push("CGR")
    if (promo.SP) airports.push("GRU")
    return airports.length > 0 ? airports.join(" / ") : "-"
  }

  // Format price - VALOR é o valor total, divide por parcelas para ter o valor da parcela
  const formatPrice = (promo: any) => {
    const value = parseFloat(promo.VALOR || "0")
    const parcelas = parseInt(promo.PARCELAS || "15")
    const installment = value / parcelas
    return installment.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Promocoes</h1>
            <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActivePanel("list")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activePanel === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="h-4 w-4 inline mr-1.5" />
                Lista
              </button>
              <button
                onClick={() => { setSelectedPromo(null); setActivePanel("form") }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activePanel === "form" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Plus className="h-4 w-4 inline mr-1.5" />
                Nova
              </button>
              <button
                onClick={() => setActivePanel("stats")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activePanel === "stats" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-1.5" />
                Stats
              </button>
              <Link
                href="/promos/leads"
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-gray-900"
              >
                <Users className="h-4 w-4 inline mr-1.5" />
                Leads
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="h-5 w-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {user.name?.[0] || "U"}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/promos/login" })}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Sair"
              >
                <LogOut className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {activePanel === "list" && (
          <>
            {/* Search & Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por destino ou hotel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                    filterOpen ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  <ChevronDown className={`h-4 w-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
                </button>

                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded ${viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => { setSelectedPromo(null); setActivePanel("form") }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nova Promo
                </button>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Total de Promos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.overall?.totalPromos || promos.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Destinos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.overall?.uniqueDestinations || 0}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Valor Medio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats?.overall?.averageValue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Destino Popular</p>
                <p className="text-lg font-bold text-gray-900 truncate">{stats?.overall?.mostPopularDestination?.name || "-"}</p>
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}

            {/* Grid View */}
            {!isLoading && viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPromos.map((promo) => (
                  <div
                    key={promo.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
                  >
                    {/* Image Header */}
                    <div className="relative h-40 bg-gradient-to-br from-[#F59E0B] to-[#efaa34] overflow-hidden">
                      {promoImages[promo.id] ? (
                        <img
                          src={promoImages[promo.id]}
                          alt={promo.DESTINO}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : loadingPromoImages[promo.id] ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-white/50 animate-spin" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <MapPin className="h-12 w-12 text-white/30" />
                        </div>
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Action buttons - always visible on mobile, hover on desktop */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(promo)}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-sm"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleGenerateImage(promo)}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-sm"
                          title="Abrir Editor"
                        >
                          <ImagePlus className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(promo.id)}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-sm"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>

                      {/* Badges on image */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800 shadow-sm">
                          {promo.NUMERO_DE_NOITES} noites
                        </span>
                        {promo.AEREO && (
                          <span className="px-2.5 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
                            <Plane className="h-3 w-3" />
                            Aereo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate text-lg">{promo.DESTINO}</h3>
                          <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                            <Hotel className="h-3.5 w-3.5" />
                            {promo.HOTEL}
                          </p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-gray-500">{promo.PARCELAS || 15}x de</span>
                          <span className="text-xl font-bold text-blue-600">{formatPrice(promo)}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">por pessoa no cartao</p>
                      </div>

                      {/* Info Row */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{promo.DATA_FORMATADA}</span>
                        </div>
                        {(promo.COM_CAFE || promo.ALL_INCLUSIVE || promo.MEIA_PENSAO || promo.PENSAO_COMPLETA) && (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                            {getRegimeLabel(promo)}
                          </span>
                        )}
                      </div>

                      {/* Quick Download Button */}
                      <button
                        onClick={() => handleGenerateImage(promo)}
                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Gerar Imagem
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {!isLoading && viewMode === "list" && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Destino</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hotel</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Noites</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Regime</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPromos.map((promo) => (
                      <tr key={promo.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{promo.DESTINO}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{promo.HOTEL}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{promo.DATA_FORMATADA}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-blue-600">{formatPrice(promo)}</span>
                          <span className="text-xs text-gray-500 ml-1">/{promo.PARCELAS || 15}x</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{promo.NUMERO_DE_NOITES}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{getRegimeLabel(promo)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(promo)}
                              className="p-1.5 hover:bg-gray-100 rounded"
                            >
                              <Edit2 className="h-4 w-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleGenerateImage(promo)}
                              className="p-1.5 hover:bg-gray-100 rounded"
                            >
                              <ImageIcon className="h-4 w-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(promo.id)}
                              className="p-1.5 hover:bg-gray-100 rounded"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredPromos.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma promocao encontrada</h3>
                <p className="text-gray-500 mb-4">Comece criando sua primeira promocao</p>
                <button
                  onClick={() => { setSelectedPromo(null); setActivePanel("form") }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Nova Promocao
                </button>
              </div>
            )}
          </>
        )}

        {/* Form Panel */}
        {activePanel === "form" && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
              <button
                onClick={() => { setActivePanel("list"); setSelectedPromo(null) }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedPromo ? "Editar Promocao" : "Nova Promocao"}
              </h2>
            </div>
            <PromoForm promo={selectedPromo} onSuccess={handleFormSuccess} />
          </div>
        )}

        {/* Editor Panel */}
        {activePanel === "editor" && selectedPromo && (
          <div className="fixed inset-0 z-50 bg-gray-900 flex">
            {/* Left Sidebar - Image Gallery (Always visible) */}
            <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Imagens de Fundo</h3>
                  <p className="text-xs text-gray-400">{selectedPromo.DESTINO}</p>
                </div>
                <button
                  onClick={() => {
                    setLoadingImages(true)
                    fetch(`/api/image-search?query=${encodeURIComponent(selectedPromo.DESTINO)}&limit=20`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.results?.length > 0) {
                          setGalleryImages(data.results)
                        }
                      })
                      .finally(() => setLoadingImages(false))
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
                  title="Recarregar imagens"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingImages ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Search input */}
              <div className="p-3 border-b border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar outras imagens..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const query = (e.target as HTMLInputElement).value
                        if (query.trim()) {
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
                        <img
                          src={img.urls.small}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {/* Selected indicator */}
                        {backgroundImage === img.urls.regular && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <Eye className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-medium">Selecionar</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Selection Info */}
              {backgroundImage && (
                <div className="p-3 border-t border-gray-700 bg-gray-750">
                  <div className="flex items-center gap-2">
                    <img
                      src={backgroundImage}
                      alt=""
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">Imagem selecionada</p>
                      <button
                        onClick={() => setBackgroundImage(null)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remover fundo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col">
              {/* Top Bar */}
              <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setActivePanel("list"); setSelectedPromo(null); setBackgroundImage(null); setGalleryImages([]) }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Fechar
                  </button>
                  <div className="h-6 w-px bg-gray-700" />
                  <div>
                    <h2 className="text-sm font-semibold text-white">{selectedPromo.DESTINO}</h2>
                    <p className="text-xs text-gray-400">{selectedPromo.HOTEL}</p>
                  </div>
                </div>
              </div>

              {/* Editor Content */}
              <div className="flex-1 overflow-hidden">
                <LayoutEditor
                  promo={selectedPromo}
                  backgroundImage={backgroundImage}
                  onSave={() => {}}
                />
              </div>
            </div>
          </div>
        )}

        {/* Stats Panel */}
        {activePanel === "stats" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Estatisticas</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Resumo Geral</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total de Promos</span>
                    <span className="font-medium">{stats?.overall?.totalPromos || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Destinos Unicos</span>
                    <span className="font-medium">{stats?.overall?.uniqueDestinations || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valor Medio</span>
                    <span className="font-medium">
                      {(stats?.overall?.averageValue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Media de Noites</span>
                    <span className="font-medium">{stats?.overall?.averageNights || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Destino Mais Popular</h3>
                {stats?.overall?.mostPopularDestination ? (
                  <div className="text-center py-4">
                    <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-gray-900">{stats.overall.mostPopularDestination.name}</p>
                    <p className="text-gray-500">{stats.overall.mostPopularDestination.count} promocoes</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Sem dados</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar exclusao</h3>
            <p className="text-gray-500 mb-6">Tem certeza que deseja excluir esta promocao? Esta acao nao pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
