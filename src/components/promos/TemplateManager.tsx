"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Upload,
  Trash2,
  Edit2,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Star,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid3X3,
  Magnet,
  Square,
  Image as ImageIcon,
  X,
  ArrowLeft,
  Settings,
  Layers,
} from "lucide-react"
import { useLayouts, type ElementConfig, type ImageArea } from "@/hooks/useLayouts"

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT_STORY = 1920
const CANVAS_HEIGHT_FEED = 1350

// Default font family
const DEFAULT_FONT = "'Montserrat', sans-serif"

// Available fonts
const AVAILABLE_FONTS = [
  { name: "Montserrat", value: "'Montserrat', sans-serif", google: "Montserrat:wght@400;500;600;700;800;900" },
  { name: "Inter", value: "'Inter', sans-serif", google: "Inter:wght@400;500;600;700;800;900" },
  { name: "Poppins", value: "'Poppins', sans-serif", google: "Poppins:wght@400;500;600;700;800;900" },
  { name: "Roboto", value: "'Roboto', sans-serif", google: "Roboto:wght@400;500;700;900" },
  { name: "Open Sans", value: "'Open Sans', sans-serif", google: "Open+Sans:wght@400;500;600;700;800" },
  { name: "Lato", value: "'Lato', sans-serif", google: "Lato:wght@400;700;900" },
  { name: "Oswald", value: "'Oswald', sans-serif", google: "Oswald:wght@400;500;600;700" },
  { name: "Playfair Display", value: "'Playfair Display', serif", google: "Playfair+Display:wght@400;500;600;700;800;900" },
  { name: "Bebas Neue", value: "'Bebas Neue', sans-serif", google: "Bebas+Neue" },
  { name: "Anton", value: "'Anton', sans-serif", google: "Anton" },
]

const normalizeFontFamily = (fontFamily: string | undefined): string => {
  if (!fontFamily) return DEFAULT_FONT
  if (fontFamily.includes("'") || fontFamily.includes('"')) return fontFamily
  const matchingFont = AVAILABLE_FONTS.find(
    f => f.name.toLowerCase() === fontFamily.toLowerCase() ||
         f.value.toLowerCase().includes(fontFamily.toLowerCase())
  )
  return matchingFont?.value || DEFAULT_FONT
}

const elementLabels: Record<string, string> = {
  region: "Regiao",
  destination: "Destino",
  hotel: "Hotel",
  dates: "Datas",
  installments: "Parcelas",
  currency: "Moeda",
  price: "Preco",
  installmentText: "Texto Parcelas",
  flight: "Aereo",
  perPerson: "Por Pessoa",
  nights: "Noites",
  regime: "Regime",
  departureLabel: "Label Saida",
  departure: "Aeroporto",
  disclaimer: "Disclaimer",
  contactLabel: "Label Contato",
  contact: "Contato",
}

// Sample promo data for preview
const samplePromo = {
  DESTINO: "Cancun",
  HOTEL: "Grand Oasis Cancun",
  DATA_FORMATADA: "15/03/2025",
  VALOR: "4500",
  PARCELAS: "12",
  COM_CAFE: false,
  SEM_CAFE: false,
  MEIA_PENSAO: false,
  PENSAO_COMPLETA: false,
  ALL_INCLUSIVE: true,
  NUMERO_DE_NOITES: "7",
  SP: true,
  CG: false,
  AEREO: true,
}

export default function TemplateManager() {
  const router = useRouter()
  const {
    layouts,
    currentLayout,
    isLoading,
    fetchLayouts,
    updateLayout,
    uploadLayout,
    deleteLayout,
    setCurrentLayout,
    updateElement,
    toggleElementVisibility,
    addImageArea,
    removeImageArea,
    updateImageArea,
    setAsDefault,
  } = useLayouts()

  const [selectedFormat, setSelectedFormat] = useState<"story" | "feed">("story")
  const [zoom, setZoom] = useState(0.4)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [areaDrawMode, setAreaDrawMode] = useState(false)
  const [isDrawingArea, setIsDrawingArea] = useState(false)
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null)
  const [drawingCurrent, setDrawingCurrent] = useState<{ x: number; y: number } | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [newName, setNewName] = useState("")

  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canvasHeight = selectedFormat === "feed" ? CANVAS_HEIGHT_FEED : CANVAS_HEIGHT_STORY

  useEffect(() => {
    fetchLayouts(selectedFormat)
  }, [selectedFormat])

  // Load Google Fonts
  useEffect(() => {
    const fontFamilies = AVAILABLE_FONTS.map(f => f.google).join("&family=")
    const link = document.createElement("link")
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`
    link.rel = "stylesheet"
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  const filteredLayouts = useMemo(() => {
    return layouts.filter(l => l.format === selectedFormat)
  }, [layouts, selectedFormat])

  // Get element content for preview
  const getElementContent = useCallback((elementId: string) => {
    const parcelas = parseInt(samplePromo.PARCELAS) || 12
    const totalValue = parseFloat(samplePromo.VALOR) || 0
    const installmentValue = totalValue / parcelas

    switch (elementId) {
      case "region": return "Exterior"
      case "destination": return samplePromo.DESTINO
      case "hotel": return samplePromo.HOTEL
      case "dates": return samplePromo.DATA_FORMATADA
      case "installments": return `${parcelas}x de`
      case "currency": return "R$"
      case "price": return installmentValue.toFixed(2).replace(".", ",")
      case "installmentText": return `no cartao e ${parcelas}x no boleto sem juros.`
      case "flight": return samplePromo.AEREO ? "Aereo Ida e Volta" : ""
      case "perPerson": return "Valor por pessoa"
      case "nights": return `${samplePromo.NUMERO_DE_NOITES} Noites`
      case "regime": return samplePromo.ALL_INCLUSIVE ? "All inclusive" : ""
      case "departureLabel": return "saindo de"
      case "departure": return samplePromo.SP ? "Sao Paulo (GRU)" : ""
      case "disclaimer": return "Preco por pessoa em apartamento duplo, sujeito a alteracao."
      case "contactLabel": return "Contato e Whatsapp"
      case "contact": return "(67) 9 9637-2769"
      default: return ""
    }
  }, [])

  const isElementVisibleByPromo = useCallback((elementId: string): boolean => {
    switch (elementId) {
      case "flight": return samplePromo.AEREO === true
      case "regime": return !!(samplePromo.ALL_INCLUSIVE || samplePromo.PENSAO_COMPLETA || samplePromo.MEIA_PENSAO || samplePromo.COM_CAFE || samplePromo.SEM_CAFE)
      case "departure":
      case "departureLabel": return samplePromo.SP === true || samplePromo.CG === true
      default: return true
    }
  }, [])

  // Mouse handlers for dragging elements
  const handleMouseDown = useCallback((elementId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!currentLayout?.elements[elementId]) return

    setSelectedElement(elementId)
    setSelectedArea(null)
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setElementStart({
      x: currentLayout.elements[elementId].x,
      y: currentLayout.elements[elementId].y,
    })
  }, [currentLayout])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !currentLayout) return

    const deltaX = (e.clientX - dragStart.x) / zoom
    const deltaY = (e.clientY - dragStart.y) / zoom

    const newX = Math.max(0, Math.min(CANVAS_WIDTH, elementStart.x + deltaX))
    const newY = Math.max(0, Math.min(canvasHeight, elementStart.y + deltaY))

    updateElement(selectedElement, { x: newX, y: newY })
  }, [isDragging, selectedElement, currentLayout, dragStart, elementStart, zoom, canvasHeight, updateElement])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Image area drawing
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!areaDrawMode || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    setIsDrawingArea(true)
    setDrawingStart({ x, y })
    setDrawingCurrent({ x, y })
    setSelectedElement(null)
    setSelectedArea(null)
  }, [areaDrawMode, zoom])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingArea || !drawingStart || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(CANVAS_WIDTH, (e.clientX - rect.left) / zoom))
    const y = Math.max(0, Math.min(canvasHeight, (e.clientY - rect.top) / zoom))

    setDrawingCurrent({ x, y })
  }, [isDrawingArea, drawingStart, zoom, canvasHeight])

  const handleCanvasMouseUp = useCallback(() => {
    if (!isDrawingArea || !drawingStart || !drawingCurrent) {
      setIsDrawingArea(false)
      return
    }

    const minX = Math.min(drawingStart.x, drawingCurrent.x)
    const minY = Math.min(drawingStart.y, drawingCurrent.y)
    const maxX = Math.max(drawingStart.x, drawingCurrent.x)
    const maxY = Math.max(drawingStart.y, drawingCurrent.y)
    const width = maxX - minX
    const height = maxY - minY

    if (width > 20 && height > 20) {
      const newArea: ImageArea = {
        id: `area-${Date.now()}`,
        name: `Area ${(currentLayout?.imageAreas?.length || 0) + 1}`,
        type: "rectangle",
        points: [
          { x: minX, y: minY },
          { x: maxX, y: minY },
          { x: maxX, y: maxY },
          { x: minX, y: maxY },
        ],
        zIndex: -1,
        fit: "cover",
        visible: true,
      }
      addImageArea(newArea)
      setSelectedArea(newArea.id)
    }

    setIsDrawingArea(false)
    setDrawingStart(null)
    setDrawingCurrent(null)
    setAreaDrawMode(false)
  }, [isDrawingArea, drawingStart, drawingCurrent, currentLayout, addImageArea])

  const getAreaBounds = useCallback((area: ImageArea) => {
    const xs = area.points.map(p => p.x)
    const ys = area.points.map(p => p.y)
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    }
  }, [])

  // Save layout
  const handleSave = async () => {
    if (!currentLayout) return
    setIsSaving(true)
    try {
      await updateLayout(currentLayout.id, {
        elements: currentLayout.elements,
        colors: currentLayout.colors,
        imageAreas: currentLayout.imageAreas,
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Upload new template
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const baseName = file.name.replace(/\.[^/.]+$/, "")
    const name = `${selectedFormat === "feed" ? "Feed" : "Story"} - ${baseName}`

    setIsUploading(true)
    try {
      const newLayout = await uploadLayout(file, selectedFormat, name)
      if (newLayout) {
        await fetchLayouts(selectedFormat)
        setCurrentLayout(newLayout)
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Erro ao fazer upload do template.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Delete template
  const handleDelete = async (id: string) => {
    try {
      await deleteLayout(id)
      await fetchLayouts(selectedFormat)
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Delete error:", error)
      alert("Erro ao excluir template.")
    }
  }

  // Rename template
  const handleRename = async (id: string) => {
    if (!newName.trim()) return
    try {
      await updateLayout(id, { name: newName })
      await fetchLayouts(selectedFormat)
      setEditingName(null)
      setNewName("")
    } catch (error) {
      console.error("Rename error:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/promos")}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Gerenciador de Templates
              </h1>
              <p className="text-xs text-gray-400">Upload, edite areas de foto e configure seus templates</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Format Toggle */}
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setSelectedFormat("story")}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedFormat === "story" ? "bg-blue-600 text-white" : "hover:bg-gray-600 text-gray-300"
                }`}
              >
                Story (1080x1920)
              </button>
              <button
                onClick={() => setSelectedFormat("feed")}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedFormat === "feed" ? "bg-blue-600 text-white" : "hover:bg-gray-600 text-gray-300"
                }`}
              >
                Feed (1080x1350)
              </button>
            </div>

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isUploading ? "Enviando..." : "Upload Template"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Templates List Sidebar */}
        <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-200">
              Templates ({filteredLayouts.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : filteredLayouts.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nenhum template</p>
                <p className="text-xs text-gray-500">Faca upload de um template PNG</p>
              </div>
            ) : (
              filteredLayouts.map((layout) => (
                <div
                  key={layout.id}
                  onClick={() => setCurrentLayout(layout)}
                  className={`relative group rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    currentLayout?.id === layout.id
                      ? "border-blue-500 ring-2 ring-blue-500/30"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[9/16] bg-gray-900 relative">
                    {layout.url && (
                      <img
                        src={layout.url}
                        alt={layout.name}
                        className="w-full h-full object-contain"
                      />
                    )}

                    {/* Default badge */}
                    {layout.isDefault && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-600 text-white text-[10px] font-bold rounded flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Padrao
                      </div>
                    )}

                    {/* Actions overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingName(layout.id)
                          setNewName(layout.name)
                        }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                        title="Renomear"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {!layout.isDefault && (
                        <>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              await setAsDefault(layout.id)
                              await fetchLayouts(selectedFormat)
                            }}
                            className="p-2 bg-white/10 hover:bg-yellow-600 rounded-lg text-white"
                            title="Definir como padrao"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteConfirm(layout.id)
                            }}
                            className="p-2 bg-white/10 hover:bg-red-600 rounded-lg text-white"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="p-2 bg-gray-750">
                    {editingName === layout.id ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(layout.id)
                            if (e.key === "Escape") setEditingName(null)
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRename(layout.id)
                          }}
                          className="p-1 bg-blue-600 rounded text-white"
                        >
                          <Save className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300 truncate">{layout.name}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor Area */}
        {currentLayout ? (
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Zoom */}
                <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}
                    className="p-1.5 hover:bg-gray-600 rounded text-gray-300"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-gray-300 w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(z => Math.min(1, z + 0.1))}
                    className="p-1.5 hover:bg-gray-600 rounded text-gray-300"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setZoom(0.4)}
                    className="p-1.5 hover:bg-gray-600 rounded text-gray-300"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                {/* Grid */}
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-2 rounded-lg ${showGrid ? "bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>

                {/* Draw Area Mode */}
                <button
                  onClick={() => {
                    setAreaDrawMode(!areaDrawMode)
                    setSelectedElement(null)
                    setSelectedArea(null)
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${
                    areaDrawMode ? "bg-green-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                >
                  <Square className="h-4 w-4" />
                  {areaDrawMode ? "Desenhando..." : "Desenhar Area de Foto"}
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Alteracoes
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Canvas */}
              <div
                className="flex-1 overflow-auto bg-gray-900 p-8"
                onMouseMove={(e) => {
                  handleMouseMove(e)
                  handleCanvasMouseMove(e)
                }}
                onMouseUp={() => {
                  handleMouseUp()
                  handleCanvasMouseUp()
                }}
                onMouseLeave={() => {
                  handleMouseUp()
                  handleCanvasMouseUp()
                }}
              >
                <div
                  className="relative mx-auto bg-white shadow-2xl"
                  style={{
                    width: CANVAS_WIDTH * zoom,
                    height: canvasHeight * zoom,
                    cursor: areaDrawMode ? "crosshair" : "default",
                  }}
                >
                  <div
                    ref={canvasRef}
                    className="absolute inset-0 origin-top-left"
                    style={{
                      width: CANVAS_WIDTH,
                      height: canvasHeight,
                      transform: `scale(${zoom})`,
                    }}
                    onClick={() => {
                      if (!areaDrawMode) {
                        setSelectedElement(null)
                        setSelectedArea(null)
                      }
                    }}
                    onMouseDown={handleCanvasMouseDown}
                  >
                    {/* Sample background for preview */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600" />

                    {/* Image Areas (Behind template) */}
                    {currentLayout?.imageAreas?.filter(a => a.visible && a.zIndex < 0).map((area) => {
                      const bounds = getAreaBounds(area)
                      return (
                        <div
                          key={area.id}
                          className={`absolute overflow-hidden ${selectedArea === area.id ? "ring-4 ring-green-500" : ""}`}
                          style={{
                            left: bounds.x,
                            top: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                            zIndex: area.zIndex + 10,
                            backgroundColor: "rgba(34, 197, 94, 0.3)",
                            border: "3px dashed rgba(34, 197, 94, 0.8)",
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedArea(area.id)
                            setSelectedElement(null)
                          }}
                        >
                          <div className="flex items-center justify-center h-full text-green-600 font-bold">
                            <div className="text-center">
                              <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                              <span className="text-sm">{area.name}</span>
                              <span className="text-xs block">(z: {area.zIndex})</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Layout Template */}
                    {currentLayout.url && (
                      <img
                        src={currentLayout.url}
                        alt="Layout"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ zIndex: 20 }}
                        crossOrigin="anonymous"
                      />
                    )}

                    {/* Image Areas (In front of template) */}
                    {currentLayout?.imageAreas?.filter(a => a.visible && a.zIndex >= 0).map((area) => {
                      const bounds = getAreaBounds(area)
                      return (
                        <div
                          key={area.id}
                          className={`absolute overflow-hidden ${selectedArea === area.id ? "ring-4 ring-blue-500" : ""}`}
                          style={{
                            left: bounds.x,
                            top: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                            zIndex: area.zIndex + 30,
                            backgroundColor: "rgba(59, 130, 246, 0.3)",
                            border: "3px dashed rgba(59, 130, 246, 0.8)",
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedArea(area.id)
                            setSelectedElement(null)
                          }}
                        >
                          <div className="flex items-center justify-center h-full text-blue-600 font-bold">
                            <div className="text-center">
                              <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                              <span className="text-sm">{area.name}</span>
                              <span className="text-xs block">(z: {area.zIndex})</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Drawing preview */}
                    {isDrawingArea && drawingStart && drawingCurrent && (
                      <div
                        className="absolute border-4 border-dashed border-green-500 bg-green-500/30 pointer-events-none"
                        style={{
                          left: Math.min(drawingStart.x, drawingCurrent.x),
                          top: Math.min(drawingStart.y, drawingCurrent.y),
                          width: Math.abs(drawingCurrent.x - drawingStart.x),
                          height: Math.abs(drawingCurrent.y - drawingStart.y),
                          zIndex: 100,
                        }}
                      />
                    )}

                    {/* Grid */}
                    {showGrid && (
                      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 90 }}>
                        <svg width="100%" height="100%" className="opacity-30">
                          <defs>
                            <pattern id="grid-template" width="100" height="100" patternUnits="userSpaceOnUse">
                              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#fff" strokeWidth="1" />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid-template)" />
                        </svg>
                        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-pink-500 opacity-70" />
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-pink-500 opacity-70" />
                      </div>
                    )}

                    {/* Elements Preview */}
                    {Object.entries(currentLayout.elements).map(([id, element]) => {
                      if (!element.visible || !isElementVisibleByPromo(id)) return null
                      const content = getElementContent(id)
                      if (!content) return null
                      const isSelected = selectedElement === id

                      return (
                        <div
                          key={id}
                          className={`absolute cursor-move select-none whitespace-nowrap ${
                            isSelected ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent" : ""
                          }`}
                          style={{
                            left: element.x,
                            top: element.y,
                            fontSize: element.fontSize,
                            fontWeight: element.fontWeight,
                            color: element.color,
                            fontFamily: normalizeFontFamily(element.fontFamily),
                            zIndex: 50,
                          }}
                          onMouseDown={(e) => handleMouseDown(id, e)}
                        >
                          {content}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Properties Panel */}
              <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
                {/* Image Areas List */}
                <div className="border-b border-gray-700">
                  <div className="p-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-200">Areas de Foto</h3>
                    <span className="text-xs text-gray-500">{currentLayout?.imageAreas?.length || 0}</span>
                  </div>
                  <div className="px-2 pb-2 space-y-1 max-h-48 overflow-y-auto">
                    {currentLayout?.imageAreas?.map((area) => (
                      <div
                        key={area.id}
                        onClick={() => {
                          setSelectedArea(area.id)
                          setSelectedElement(null)
                        }}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          selectedArea === area.id ? "bg-green-600" : "hover:bg-gray-700"
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateImageArea(area.id, { visible: !area.visible })
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                        >
                          {area.visible ? <Eye className="h-3.5 w-3.5 text-gray-300" /> : <EyeOff className="h-3.5 w-3.5 text-gray-500" />}
                        </button>
                        <ImageIcon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs text-gray-300 flex-1 truncate">{area.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${area.zIndex < 0 ? "bg-orange-600" : "bg-blue-600"} text-white`}>
                          z:{area.zIndex}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeImageArea(area.id)
                            if (selectedArea === area.id) setSelectedArea(null)
                          }}
                          className="p-1 hover:bg-red-600 rounded text-gray-400 hover:text-white"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {(!currentLayout?.imageAreas || currentLayout.imageAreas.length === 0) && (
                      <p className="text-xs text-gray-500 p-2 text-center">
                        Clique em "Desenhar Area de Foto" para criar areas
                      </p>
                    )}
                  </div>
                </div>

                {/* Selected Area Properties */}
                {selectedArea && currentLayout?.imageAreas && (() => {
                  const area = currentLayout.imageAreas.find(a => a.id === selectedArea)
                  if (!area) return null
                  const bounds = getAreaBounds(area)

                  return (
                    <div className="p-3 space-y-4 border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-green-400" />
                        <h3 className="text-sm font-semibold text-green-400">Propriedades da Area</h3>
                      </div>

                      {/* Name */}
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Nome</label>
                        <input
                          type="text"
                          value={area.name}
                          onChange={(e) => updateImageArea(area.id, { name: e.target.value })}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200"
                        />
                      </div>

                      {/* Z-Index */}
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">
                          Camada (Z-Index)
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateImageArea(area.id, { zIndex: area.zIndex - 1 })}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={area.zIndex}
                            onChange={(e) => updateImageArea(area.id, { zIndex: parseInt(e.target.value) || 0 })}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200 text-center"
                          />
                          <button
                            onClick={() => updateImageArea(area.id, { zIndex: area.zIndex + 1 })}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => updateImageArea(area.id, { zIndex: -1 })}
                            className={`flex-1 px-2 py-1.5 text-xs rounded ${area.zIndex < 0 ? "bg-orange-600 text-white" : "bg-gray-700 text-gray-300"}`}
                          >
                            Atras do Template
                          </button>
                          <button
                            onClick={() => updateImageArea(area.id, { zIndex: 1 })}
                            className={`flex-1 px-2 py-1.5 text-xs rounded ${area.zIndex >= 0 ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}
                          >
                            Na Frente
                          </button>
                        </div>
                      </div>

                      {/* Position */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">X</label>
                          <input
                            type="number"
                            value={Math.round(bounds.x)}
                            onChange={(e) => {
                              const newX = parseInt(e.target.value) || 0
                              const deltaX = newX - bounds.x
                              updateImageArea(area.id, {
                                points: area.points.map(p => ({ x: p.x + deltaX, y: p.y }))
                              })
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Y</label>
                          <input
                            type="number"
                            value={Math.round(bounds.y)}
                            onChange={(e) => {
                              const newY = parseInt(e.target.value) || 0
                              const deltaY = newY - bounds.y
                              updateImageArea(area.id, {
                                points: area.points.map(p => ({ x: p.x, y: p.y + deltaY }))
                              })
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200"
                          />
                        </div>
                      </div>

                      {/* Size */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Largura</label>
                          <input
                            type="number"
                            value={Math.round(bounds.width)}
                            onChange={(e) => {
                              const newWidth = parseInt(e.target.value) || 100
                              updateImageArea(area.id, {
                                points: [
                                  { x: bounds.x, y: bounds.y },
                                  { x: bounds.x + newWidth, y: bounds.y },
                                  { x: bounds.x + newWidth, y: bounds.y + bounds.height },
                                  { x: bounds.x, y: bounds.y + bounds.height },
                                ]
                              })
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200"
                            min="20"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Altura</label>
                          <input
                            type="number"
                            value={Math.round(bounds.height)}
                            onChange={(e) => {
                              const newHeight = parseInt(e.target.value) || 100
                              updateImageArea(area.id, {
                                points: [
                                  { x: bounds.x, y: bounds.y },
                                  { x: bounds.x + bounds.width, y: bounds.y },
                                  { x: bounds.x + bounds.width, y: bounds.y + newHeight },
                                  { x: bounds.x, y: bounds.y + newHeight },
                                ]
                              })
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200"
                            min="20"
                          />
                        </div>
                      </div>

                      {/* Fit */}
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Ajuste da Imagem</label>
                        <select
                          value={area.fit}
                          onChange={(e) => updateImageArea(area.id, { fit: e.target.value as "cover" | "contain" | "fill" })}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200"
                        >
                          <option value="cover">Cobrir (Cover)</option>
                          <option value="contain">Conter (Contain)</option>
                          <option value="fill">Preencher (Fill)</option>
                        </select>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          removeImageArea(area.id)
                          setSelectedArea(null)
                        }}
                        className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm flex items-center justify-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover Area
                      </button>
                    </div>
                  )
                })()}

                {/* Text Elements */}
                <div className="border-b border-gray-700">
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-gray-200">Elementos de Texto</h3>
                  </div>
                  <div className="px-2 pb-2 space-y-1 max-h-64 overflow-y-auto">
                    {Object.entries(currentLayout.elements).map(([id, element]) => {
                      const promoVisible = isElementVisibleByPromo(id)
                      const isSelected = selectedElement === id

                      return (
                        <div
                          key={id}
                          onClick={() => {
                            setSelectedElement(id)
                            setSelectedArea(null)
                          }}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-600" : "hover:bg-gray-700"
                          } ${!promoVisible ? "opacity-40" : ""}`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleElementVisibility(id)
                            }}
                            disabled={!promoVisible}
                            className="p-1 hover:bg-gray-600 rounded"
                          >
                            {element.visible && promoVisible ? (
                              <Eye className="h-3.5 w-3.5 text-gray-300" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                            )}
                          </button>
                          <span className="text-xs text-gray-300 flex-1 truncate">
                            {elementLabels[id] || id}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Selected Element Properties */}
                {selectedElement && currentLayout?.elements[selectedElement] && (
                  <div className="p-3 space-y-4">
                    <h3 className="text-sm font-semibold text-blue-400">
                      {elementLabels[selectedElement] || selectedElement}
                    </h3>

                    {/* Position */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">X</label>
                        <input
                          type="number"
                          value={Math.round(currentLayout.elements[selectedElement].x)}
                          onChange={(e) => updateElement(selectedElement, { x: parseInt(e.target.value) || 0 })}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Y</label>
                        <input
                          type="number"
                          value={Math.round(currentLayout.elements[selectedElement].y)}
                          onChange={(e) => updateElement(selectedElement, { y: parseInt(e.target.value) || 0 })}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200"
                        />
                      </div>
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Tamanho da Fonte</label>
                      <input
                        type="number"
                        value={currentLayout.elements[selectedElement].fontSize}
                        onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) || 16 })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200"
                        min="8"
                        max="200"
                      />
                    </div>

                    {/* Font Family */}
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Fonte</label>
                      <select
                        value={normalizeFontFamily(currentLayout.elements[selectedElement].fontFamily)}
                        onChange={(e) => updateElement(selectedElement, { fontFamily: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200"
                      >
                        {AVAILABLE_FONTS.map(font => (
                          <option key={font.name} value={font.value}>{font.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Font Weight */}
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Peso</label>
                      <select
                        value={currentLayout.elements[selectedElement].fontWeight}
                        onChange={(e) => updateElement(selectedElement, { fontWeight: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200"
                      >
                        <option value="400">Normal</option>
                        <option value="500">Medium</option>
                        <option value="600">Semibold</option>
                        <option value="700">Bold</option>
                        <option value="800">Extrabold</option>
                        <option value="900">Black</option>
                      </select>
                    </div>

                    {/* Color */}
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Cor</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={currentLayout.elements[selectedElement].color}
                          onChange={(e) => updateElement(selectedElement, { color: e.target.value })}
                          className="w-10 h-8 rounded border border-gray-600 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={currentLayout.elements[selectedElement].color}
                          onChange={(e) => updateElement(selectedElement, { color: e.target.value })}
                          className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                        />
                      </div>
                    </div>

                    {/* Quick Colors */}
                    <div className="flex gap-1 flex-wrap">
                      {["#FFFFFF", "#000000", "#F79E08", "#002043", "#DC2626", "#16A34A"].map(color => (
                        <button
                          key={color}
                          onClick={() => updateElement(selectedElement, { color })}
                          className="w-7 h-7 rounded border border-gray-600"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {!selectedElement && !selectedArea && (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Selecione um elemento ou area para editar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <Layers className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">Selecione um Template</h3>
              <p className="text-gray-500">Escolha um template na lista ou faca upload de um novo</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">Confirmar exclusao</h3>
            <p className="text-gray-400 mb-6">Tem certeza que deseja excluir este template? Esta acao nao pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
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
