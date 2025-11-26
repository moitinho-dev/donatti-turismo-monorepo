"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Pencil,
  Square,
  Trash2,
  Check,
  X,
  Image,
  Layers,
  Move,
  Plus,
  Minus,
  Save,
  Upload,
  Search,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react"

export interface ImageArea {
  id: string
  name: string
  type: "rectangle" | "polygon"
  points: { x: number; y: number }[]
  zIndex: number
  imageUrl?: string
  fit: "cover" | "contain" | "fill"
  visible: boolean
}

interface TemplateAreaEditorProps {
  templateUrl: string
  imageAreas: ImageArea[]
  onAreasChange: (areas: ImageArea[]) => void
  onSave: () => void
  format: "story" | "feed"
}

type Tool = "select" | "rectangle" | "polygon"

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT_STORY = 1920
const CANVAS_HEIGHT_FEED = 1350

export function TemplateAreaEditor({
  templateUrl,
  imageAreas,
  onAreasChange,
  onSave,
  format,
}: TemplateAreaEditorProps) {
  const [zoom, setZoom] = useState(0.4)
  const [activeTool, setActiveTool] = useState<Tool>("select")
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([])
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isSaving, setIsSaving] = useState(false)

  // Image search
  const [showImageSearch, setShowImageSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const canvasHeight = format === "feed" ? CANVAS_HEIGHT_FEED : CANVAS_HEIGHT_STORY

  // Get mouse position relative to canvas
  const getCanvasPosition = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      if (!canvasRef.current) return { x: 0, y: 0 }
      const rect = canvasRef.current.getBoundingClientRect()
      return {
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      }
    },
    [zoom]
  )

  // Generate unique ID
  const generateId = () => `area-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (showImageSearch) return
      const pos = getCanvasPosition(e)

      if (activeTool === "rectangle") {
        setIsDrawing(true)
        setDrawingStart(pos)
        setCurrentPoints([pos, pos])
      } else if (activeTool === "polygon") {
        if (!isDrawing) {
          setIsDrawing(true)
          setCurrentPoints([pos])
        } else {
          setCurrentPoints((prev) => [...prev, pos])
        }
      } else if (activeTool === "select") {
        const clickedArea = [...imageAreas]
          .sort((a, b) => b.zIndex - a.zIndex)
          .find((area) => isPointInArea(pos, area))
        if (clickedArea) {
          setSelectedAreaId(clickedArea.id)
          setIsDragging(true)
          setDragStart(pos)
        } else {
          setSelectedAreaId(null)
        }
      }
    },
    [activeTool, isDrawing, imageAreas, getCanvasPosition, showImageSearch]
  )

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = getCanvasPosition(e)

      if (activeTool === "rectangle" && isDrawing && drawingStart) {
        setCurrentPoints([
          drawingStart,
          { x: pos.x, y: drawingStart.y },
          pos,
          { x: drawingStart.x, y: pos.y },
        ])
      } else if (isDragging && selectedAreaId) {
        const deltaX = pos.x - dragStart.x
        const deltaY = pos.y - dragStart.y

        const updatedAreas = imageAreas.map((area) => {
          if (area.id !== selectedAreaId) return area
          return {
            ...area,
            points: area.points.map((p) => ({
              x: Math.max(0, Math.min(CANVAS_WIDTH, p.x + deltaX)),
              y: Math.max(0, Math.min(canvasHeight, p.y + deltaY)),
            })),
          }
        })

        onAreasChange(updatedAreas)
        setDragStart(pos)
      }
    },
    [activeTool, isDrawing, drawingStart, isDragging, selectedAreaId, imageAreas, dragStart, getCanvasPosition, onAreasChange, canvasHeight]
  )

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (activeTool === "rectangle" && isDrawing && currentPoints.length >= 4) {
      const minArea = 50 * 50 // Minimum area size
      const bounds = getAreaBoundsFromPoints(currentPoints)
      if (bounds.width * bounds.height >= minArea) {
        const newArea: ImageArea = {
          id: generateId(),
          name: `Foto ${imageAreas.length + 1}`,
          type: "rectangle",
          points: currentPoints,
          zIndex: imageAreas.length,
          fit: "cover",
          visible: true,
        }
        onAreasChange([...imageAreas, newArea])
        setSelectedAreaId(newArea.id)
      }
      setCurrentPoints([])
      setIsDrawing(false)
      setDrawingStart(null)
    }
    setIsDragging(false)
  }, [activeTool, isDrawing, currentPoints, imageAreas, onAreasChange])

  // Complete polygon on double click
  const handleDoubleClick = useCallback(() => {
    if (activeTool === "polygon" && isDrawing && currentPoints.length >= 3) {
      const newArea: ImageArea = {
        id: generateId(),
        name: `Foto ${imageAreas.length + 1}`,
        type: "polygon",
        points: currentPoints,
        zIndex: imageAreas.length,
        fit: "cover",
        visible: true,
      }
      onAreasChange([...imageAreas, newArea])
      setCurrentPoints([])
      setIsDrawing(false)
      setSelectedAreaId(newArea.id)
    }
  }, [activeTool, isDrawing, currentPoints, imageAreas, onAreasChange])

  // Check if point is inside area
  const isPointInArea = (point: { x: number; y: number }, area: ImageArea): boolean => {
    if (!area.visible) return false
    const bounds = getAreaBoundsFromPoints(area.points)
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    )
  }

  // Get bounding box from points
  const getAreaBoundsFromPoints = (points: { x: number; y: number }[]) => {
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }

  // Delete selected area
  const deleteSelectedArea = useCallback(() => {
    if (selectedAreaId) {
      onAreasChange(imageAreas.filter((a) => a.id !== selectedAreaId))
      setSelectedAreaId(null)
    }
  }, [selectedAreaId, imageAreas, onAreasChange])

  // Update selected area
  const updateSelectedArea = useCallback(
    (updates: Partial<ImageArea>) => {
      if (!selectedAreaId) return
      onAreasChange(
        imageAreas.map((area) => (area.id === selectedAreaId ? { ...area, ...updates } : area))
      )
    },
    [selectedAreaId, imageAreas, onAreasChange]
  )

  // Move area z-index
  const moveAreaZIndex = useCallback(
    (direction: "up" | "down") => {
      if (!selectedAreaId) return
      const selectedArea = imageAreas.find((a) => a.id === selectedAreaId)
      if (!selectedArea) return

      const newZIndex =
        direction === "up"
          ? Math.min(selectedArea.zIndex + 1, imageAreas.length - 1)
          : Math.max(selectedArea.zIndex - 1, 0)

      const updatedAreas = imageAreas.map((area) => {
        if (area.id === selectedAreaId) {
          return { ...area, zIndex: newZIndex }
        }
        if (direction === "up" && area.zIndex === newZIndex) {
          return { ...area, zIndex: area.zIndex - 1 }
        }
        if (direction === "down" && area.zIndex === newZIndex) {
          return { ...area, zIndex: area.zIndex + 1 }
        }
        return area
      })

      onAreasChange(updatedAreas)
    },
    [selectedAreaId, imageAreas, onAreasChange]
  )

  // Cancel current drawing
  const cancelDrawing = useCallback(() => {
    setIsDrawing(false)
    setCurrentPoints([])
    setDrawingStart(null)
  }, [])

  // Search images from Unsplash
  const searchImages = async (query: string) => {
    if (!query.trim()) return
    setIsSearching(true)
    try {
      const response = await fetch(`/api/images/search?query=${encodeURIComponent(query)}&per_page=20`)
      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (error) {
      console.error("Error searching images:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Select image for area
  const selectImageForArea = (imageUrl: string) => {
    if (selectedAreaId) {
      updateSelectedArea({ imageUrl })
      setShowImageSearch(false)
    }
  }

  // Handle save
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showImageSearch) {
          setShowImageSearch(false)
        } else {
          cancelDrawing()
          setSelectedAreaId(null)
        }
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedAreaId && !isDrawing && !showImageSearch) {
        deleteSelectedArea()
      }
      if (e.key === "v" && !showImageSearch) setActiveTool("select")
      if (e.key === "r" && !showImageSearch) setActiveTool("rectangle")
      if (e.key === "p" && !showImageSearch) setActiveTool("polygon")
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [cancelDrawing, deleteSelectedArea, selectedAreaId, isDrawing, showImageSearch])

  const selectedArea = imageAreas.find((a) => a.id === selectedAreaId)

  // Render polygon path
  const getPolygonPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return ""
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z"
  }

  // Get clip path for image
  const getClipPath = (points: { x: number; y: number }[], bounds: { x: number; y: number; width: number; height: number }) => {
    return points.map((p) => `${((p.x - bounds.x) / bounds.width) * 100}% ${((p.y - bounds.y) / bounds.height) * 100}%`).join(", ")
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {/* Tools */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => { setActiveTool("select"); cancelDrawing() }}
              className={`p-1.5 rounded ${activeTool === "select" ? "bg-blue-600 text-white" : "hover:bg-gray-600 text-gray-300"}`}
              title="Selecionar (V)"
            >
              <Move className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setActiveTool("rectangle"); cancelDrawing() }}
              className={`p-1.5 rounded ${activeTool === "rectangle" ? "bg-blue-600 text-white" : "hover:bg-gray-600 text-gray-300"}`}
              title="Retangulo (R)"
            >
              <Square className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setActiveTool("polygon"); cancelDrawing() }}
              className={`p-1.5 rounded ${activeTool === "polygon" ? "bg-blue-600 text-white" : "hover:bg-gray-600 text-gray-300"}`}
              title="Caneta/Poligono (P)"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))} className="p-1.5 hover:bg-gray-600 rounded text-gray-300">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-300 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1, z + 0.1))} className="p-1.5 hover:bg-gray-600 rounded text-gray-300">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button onClick={() => setZoom(0.4)} className="p-1.5 hover:bg-gray-600 rounded text-gray-300">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {isDrawing && (
            <div className="flex items-center gap-2 px-2 py-1 bg-yellow-600/20 rounded">
              <span className="text-xs text-yellow-400">
                {activeTool === "polygon" ? "Clique duplo para finalizar" : "Arraste para criar a area"}
              </span>
              <button onClick={cancelDrawing} className="p-1 hover:bg-gray-600 rounded text-red-400">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Areas
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Areas Panel */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Areas de Imagem
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Use retangulo ou caneta para criar areas onde as fotos serao inseridas
            </p>
          </div>

          <div className="p-2 space-y-1">
            {imageAreas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nenhuma area criada</p>
                <p className="text-xs mt-1">Use as ferramentas acima</p>
              </div>
            ) : (
              imageAreas
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((area) => (
                  <div
                    key={area.id}
                    onClick={() => setSelectedAreaId(area.id)}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                      selectedAreaId === area.id ? "bg-blue-600" : "hover:bg-gray-700"
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateSelectedArea({ visible: !area.visible })
                      }}
                      className="p-1 hover:bg-gray-600 rounded"
                    >
                      {area.visible ? (
                        <Eye className="h-3.5 w-3.5 text-gray-300" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-300 truncate block">{area.name}</span>
                      <span className="text-[10px] text-gray-500">
                        {area.type === "rectangle" ? "Retangulo" : "Poligono"}
                      </span>
                    </div>
                    {area.imageUrl ? (
                      <img src={area.imageUrl} alt="" className="w-8 h-8 object-cover rounded" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                        <Image className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-gray-900 p-8">
          <div
            ref={canvasRef}
            className="relative mx-auto bg-white shadow-2xl"
            style={{
              width: CANVAS_WIDTH * zoom,
              height: canvasHeight * zoom,
              cursor: activeTool === "select" ? "default" : "crosshair",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
          >
            {/* Scale container */}
            <div
              className="absolute inset-0 origin-top-left"
              style={{
                width: CANVAS_WIDTH,
                height: canvasHeight,
                transform: `scale(${zoom})`,
              }}
            >
              {/* Image areas with photos (rendered first/behind) */}
              {imageAreas
                .filter((a) => a.visible && a.imageUrl)
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((area) => {
                  const bounds = getAreaBoundsFromPoints(area.points)
                  return (
                    <div
                      key={`img-${area.id}`}
                      className="absolute overflow-hidden"
                      style={{
                        left: bounds.x,
                        top: bounds.y,
                        width: bounds.width,
                        height: bounds.height,
                        clipPath: area.type === "polygon" ? `polygon(${getClipPath(area.points, bounds)})` : undefined,
                      }}
                    >
                      <img
                        src={area.imageUrl}
                        alt=""
                        className="w-full h-full"
                        style={{ objectFit: area.fit }}
                        crossOrigin="anonymous"
                      />
                    </div>
                  )
                })}

              {/* Template overlay */}
              {templateUrl && (
                <img
                  src={templateUrl}
                  alt="Template"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  crossOrigin="anonymous"
                />
              )}

              {/* SVG for area outlines */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={CANVAS_WIDTH}
                height={canvasHeight}
                style={{ pointerEvents: "none" }}
              >
                {imageAreas
                  .filter((a) => a.visible)
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map((area) => {
                    const isSelected = selectedAreaId === area.id
                    const path = getPolygonPath(area.points)
                    const hasImage = !!area.imageUrl

                    return (
                      <g key={area.id} style={{ pointerEvents: "all" }}>
                        <path
                          d={path}
                          fill={hasImage ? "transparent" : "rgba(59, 130, 246, 0.1)"}
                          stroke={isSelected ? "#3B82F6" : hasImage ? "transparent" : "#6B7280"}
                          strokeWidth={isSelected ? 3 : 2}
                          strokeDasharray={isSelected ? "none" : "8,4"}
                        />
                        {isSelected && area.points.map((point, i) => (
                          <circle
                            key={i}
                            cx={point.x}
                            cy={point.y}
                            r={8}
                            fill="#3B82F6"
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </g>
                    )
                  })}

                {/* Current drawing */}
                {isDrawing && currentPoints.length > 0 && (
                  <g>
                    <path
                      d={getPolygonPath(currentPoints)}
                      fill="rgba(34, 197, 94, 0.2)"
                      stroke="#22C55E"
                      strokeWidth={2}
                    />
                    {currentPoints.map((point, i) => (
                      <circle key={i} cx={point.x} cy={point.y} r={6} fill="#22C55E" stroke="#fff" strokeWidth={2} />
                    ))}
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          {selectedArea ? (
            <div className="p-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-200">Propriedades</h3>
                <button
                  onClick={deleteSelectedArea}
                  className="p-1.5 hover:bg-red-600 rounded text-red-400"
                  title="Excluir (Delete)"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Nome da Area</label>
                <input
                  type="text"
                  value={selectedArea.name}
                  onChange={(e) => updateSelectedArea({ name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200"
                />
              </div>

              {/* Z-Index */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Ordem (Z-Index)</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveAreaZIndex("down")}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex-1 text-center text-gray-300">{selectedArea.zIndex}</span>
                  <button
                    onClick={() => moveAreaZIndex("up")}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Menor = mais atras, Maior = mais na frente</p>
              </div>

              {/* Fit */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Ajuste da Imagem</label>
                <select
                  value={selectedArea.fit}
                  onChange={(e) => updateSelectedArea({ fit: e.target.value as "cover" | "contain" | "fill" })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200"
                >
                  <option value="cover">Cobrir (recorta para preencher)</option>
                  <option value="contain">Conter (mostra toda a imagem)</option>
                  <option value="fill">Esticar (distorce)</option>
                </select>
              </div>

              {/* Image */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-2">Imagem</label>
                {selectedArea.imageUrl ? (
                  <div className="relative">
                    <img
                      src={selectedArea.imageUrl}
                      alt=""
                      className="w-full h-40 object-cover rounded border border-gray-600"
                    />
                    <button
                      onClick={() => updateSelectedArea({ imageUrl: undefined })}
                      className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 rounded text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowImageSearch(true)}
                      className="absolute bottom-2 right-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowImageSearch(true)}
                    className="w-full h-32 border-2 border-dashed border-gray-600 rounded flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-gray-700/50 transition-colors"
                  >
                    <Search className="h-6 w-6 text-gray-400" />
                    <span className="text-sm text-gray-400">Buscar Imagem</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Selecione uma area para editar</p>
              <p className="text-xs mt-2">ou crie uma nova usando as ferramentas</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Search Modal */}
      {showImageSearch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg w-[800px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-gray-200">Buscar Imagem</h3>
              <button
                onClick={() => setShowImageSearch(false)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchImages(searchQuery)}
                  placeholder="Digite para buscar (ex: praia, montanha, cidade...)"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200"
                />
                <button
                  onClick={() => searchImages(searchQuery)}
                  disabled={isSearching}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white flex items-center gap-2"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Buscar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {searchResults.map((image: any) => (
                    <button
                      key={image.id}
                      onClick={() => selectImageForArea(image.urls?.regular || image.src?.large || image.largeImageURL)}
                      className="relative aspect-square overflow-hidden rounded border-2 border-transparent hover:border-blue-500 transition-colors"
                    >
                      <img
                        src={image.urls?.small || image.src?.medium || image.previewURL}
                        alt={image.alt_description || ""}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Digite algo para buscar imagens</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
