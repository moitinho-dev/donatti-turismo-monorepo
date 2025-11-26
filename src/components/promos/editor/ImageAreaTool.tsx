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
  RotateCcw,
} from "lucide-react"

export interface ImageArea {
  id: string
  name: string
  type: "rectangle" | "polygon"
  points: { x: number; y: number }[]
  zIndex: number
  imageUrl?: string
  fit: "cover" | "contain" | "fill"
}

interface ImageAreaToolProps {
  areas: ImageArea[]
  onAreasChange: (areas: ImageArea[]) => void
  canvasWidth: number
  canvasHeight: number
  zoom: number
  templateUrl?: string
}

type Tool = "select" | "rectangle" | "polygon"

export function ImageAreaTool({
  areas,
  onAreasChange,
  canvasWidth,
  canvasHeight,
  zoom,
  templateUrl,
}: ImageAreaToolProps) {
  const [activeTool, setActiveTool] = useState<Tool>("select")
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([])
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLDivElement>(null)

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
          // Add point to polygon
          setCurrentPoints((prev) => [...prev, pos])
        }
      } else if (activeTool === "select") {
        // Check if clicking on an area
        const clickedArea = areas.find((area) => isPointInArea(pos, area))
        if (clickedArea) {
          setSelectedAreaId(clickedArea.id)
          setIsDragging(true)
          setDragStart(pos)
          const bounds = getAreaBounds(clickedArea)
          setDragOffset({ x: pos.x - bounds.x, y: pos.y - bounds.y })
        } else {
          setSelectedAreaId(null)
        }
      }
    },
    [activeTool, isDrawing, areas, getCanvasPosition]
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
        const selectedArea = areas.find((a) => a.id === selectedAreaId)
        if (selectedArea) {
          const bounds = getAreaBounds(selectedArea)
          const deltaX = pos.x - dragStart.x
          const deltaY = pos.y - dragStart.y

          const updatedAreas = areas.map((area) => {
            if (area.id !== selectedAreaId) return area
            return {
              ...area,
              points: area.points.map((p) => ({
                x: p.x + deltaX,
                y: p.y + deltaY,
              })),
            }
          })

          onAreasChange(updatedAreas)
          setDragStart(pos)
        }
      }
    },
    [activeTool, isDrawing, drawingStart, isDragging, selectedAreaId, areas, dragStart, getCanvasPosition, onAreasChange]
  )

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (activeTool === "rectangle" && isDrawing && currentPoints.length >= 4) {
      const newArea: ImageArea = {
        id: generateId(),
        name: `Area ${areas.length + 1}`,
        type: "rectangle",
        points: currentPoints,
        zIndex: areas.length,
        fit: "cover",
      }
      onAreasChange([...areas, newArea])
      setCurrentPoints([])
      setIsDrawing(false)
      setDrawingStart(null)
      setSelectedAreaId(newArea.id)
    }

    setIsDragging(false)
  }, [activeTool, isDrawing, currentPoints, areas, onAreasChange])

  // Complete polygon on double click
  const handleDoubleClick = useCallback(() => {
    if (activeTool === "polygon" && isDrawing && currentPoints.length >= 3) {
      const newArea: ImageArea = {
        id: generateId(),
        name: `Area ${areas.length + 1}`,
        type: "polygon",
        points: currentPoints,
        zIndex: areas.length,
        fit: "cover",
      }
      onAreasChange([...areas, newArea])
      setCurrentPoints([])
      setIsDrawing(false)
      setSelectedAreaId(newArea.id)
    }
  }, [activeTool, isDrawing, currentPoints, areas, onAreasChange])

  // Check if point is inside area
  const isPointInArea = (point: { x: number; y: number }, area: ImageArea): boolean => {
    const bounds = getAreaBounds(area)
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    )
  }

  // Get bounding box of area
  const getAreaBounds = (area: ImageArea) => {
    const xs = area.points.map((p) => p.x)
    const ys = area.points.map((p) => p.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }

  // Delete selected area
  const deleteSelectedArea = useCallback(() => {
    if (selectedAreaId) {
      onAreasChange(areas.filter((a) => a.id !== selectedAreaId))
      setSelectedAreaId(null)
    }
  }, [selectedAreaId, areas, onAreasChange])

  // Update selected area
  const updateSelectedArea = useCallback(
    (updates: Partial<ImageArea>) => {
      if (!selectedAreaId) return
      onAreasChange(
        areas.map((area) => (area.id === selectedAreaId ? { ...area, ...updates } : area))
      )
    },
    [selectedAreaId, areas, onAreasChange]
  )

  // Move area z-index
  const moveAreaZIndex = useCallback(
    (direction: "up" | "down") => {
      if (!selectedAreaId) return
      const selectedArea = areas.find((a) => a.id === selectedAreaId)
      if (!selectedArea) return

      const newZIndex =
        direction === "up"
          ? Math.min(selectedArea.zIndex + 1, areas.length - 1)
          : Math.max(selectedArea.zIndex - 1, 0)

      const updatedAreas = areas.map((area) => {
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
    [selectedAreaId, areas, onAreasChange]
  )

  // Cancel current drawing
  const cancelDrawing = useCallback(() => {
    setIsDrawing(false)
    setCurrentPoints([])
    setDrawingStart(null)
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelDrawing()
        setSelectedAreaId(null)
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedAreaId && !isDrawing) {
          deleteSelectedArea()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [cancelDrawing, deleteSelectedArea, selectedAreaId, isDrawing])

  const selectedArea = areas.find((a) => a.id === selectedAreaId)

  // Render polygon path
  const getPolygonPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return ""
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z"
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tool Panel */}
      <div className="bg-gray-800 border-b border-gray-700 p-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400">Ferramentas:</span>
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => {
                setActiveTool("select")
                cancelDrawing()
              }}
              className={`p-1.5 rounded ${
                activeTool === "select" ? "bg-blue-600 text-white" : "hover:bg-gray-600 text-gray-300"
              }`}
              title="Selecionar (V)"
            >
              <Move className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setActiveTool("rectangle")
                cancelDrawing()
              }}
              className={`p-1.5 rounded ${
                activeTool === "rectangle" ? "bg-blue-600 text-white" : "hover:bg-gray-600 text-gray-300"
              }`}
              title="Retangulo (R)"
            >
              <Square className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setActiveTool("polygon")
                cancelDrawing()
              }}
              className={`p-1.5 rounded ${
                activeTool === "polygon" ? "bg-blue-600 text-white" : "hover:bg-gray-600 text-gray-300"
              }`}
              title="Caneta/Poligono (P)"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          {isDrawing && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs text-yellow-400">
                {activeTool === "polygon" ? "Clique duplo para finalizar" : "Arraste para criar"}
              </span>
              <button
                onClick={cancelDrawing}
                className="p-1 hover:bg-gray-600 rounded text-red-400"
                title="Cancelar (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Areas list */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs text-gray-400 flex-shrink-0">Areas:</span>
          {areas.length === 0 ? (
            <span className="text-xs text-gray-500">Nenhuma area criada</span>
          ) : (
            areas
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((area) => (
                <button
                  key={area.id}
                  onClick={() => setSelectedAreaId(area.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    selectedAreaId === area.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <Image className="h-3 w-3" />
                  {area.name}
                  {area.imageUrl && <Check className="h-3 w-3 text-green-400" />}
                </button>
              ))
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-gray-900 p-4">
        <div
          ref={canvasRef}
          className="relative mx-auto bg-gray-800 shadow-2xl cursor-crosshair"
          style={{
            width: canvasWidth * zoom,
            height: canvasHeight * zoom,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        >
          {/* Template preview */}
          {templateUrl && (
            <img
              src={templateUrl}
              alt="Template"
              className="absolute inset-0 w-full h-full object-cover opacity-50"
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* SVG for areas */}
          <svg
            className="absolute inset-0"
            width={canvasWidth * zoom}
            height={canvasHeight * zoom}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            style={{ pointerEvents: "none" }}
          >
            {/* Existing areas */}
            {areas
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((area) => {
                const isSelected = selectedAreaId === area.id
                const path = getPolygonPath(area.points)

                return (
                  <g key={area.id}>
                    {/* Area fill */}
                    <path
                      d={path}
                      fill={isSelected ? "rgba(59, 130, 246, 0.3)" : "rgba(255, 255, 255, 0.1)"}
                      stroke={isSelected ? "#3B82F6" : "#6B7280"}
                      strokeWidth={isSelected ? 3 : 2}
                      strokeDasharray={isSelected ? "none" : "5,5"}
                      style={{ pointerEvents: "all", cursor: "move" }}
                    />
                    {/* Points */}
                    {isSelected &&
                      area.points.map((point, i) => (
                        <circle
                          key={i}
                          cx={point.x}
                          cy={point.y}
                          r={6}
                          fill="#3B82F6"
                          stroke="#fff"
                          strokeWidth={2}
                          style={{ cursor: "pointer" }}
                        />
                      ))}
                    {/* Label */}
                    {area.points.length > 0 && (
                      <text
                        x={area.points[0].x + 10}
                        y={area.points[0].y + 20}
                        fill={isSelected ? "#3B82F6" : "#9CA3AF"}
                        fontSize={14 / zoom}
                        fontWeight="bold"
                      >
                        {area.name}
                      </text>
                    )}
                  </g>
                )
              })}

            {/* Current drawing */}
            {isDrawing && currentPoints.length > 0 && (
              <g>
                <path
                  d={getPolygonPath(currentPoints)}
                  fill="rgba(34, 197, 94, 0.3)"
                  stroke="#22C55E"
                  strokeWidth={2}
                  strokeDasharray={activeTool === "polygon" ? "none" : "5,5"}
                />
                {currentPoints.map((point, i) => (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r={5}
                    fill="#22C55E"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Selected Area Properties */}
      {selectedArea && (
        <div className="bg-gray-800 border-t border-gray-700 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={selectedArea.name}
                onChange={(e) => updateSelectedArea({ name: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 w-32"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveAreaZIndex("down")}
                className="p-1.5 hover:bg-gray-700 rounded text-gray-400"
                title="Mover para tras"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-500 w-8 text-center">Z:{selectedArea.zIndex}</span>
              <button
                onClick={() => moveAreaZIndex("up")}
                className="p-1.5 hover:bg-gray-700 rounded text-gray-400"
                title="Mover para frente"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={deleteSelectedArea}
                className="p-1.5 hover:bg-red-600 rounded text-red-400 ml-2"
                title="Excluir area (Delete)"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Ajuste da Imagem</label>
              <select
                value={selectedArea.fit}
                onChange={(e) => updateSelectedArea({ fit: e.target.value as "cover" | "contain" | "fill" })}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
              >
                <option value="cover">Cobrir (recorta)</option>
                <option value="contain">Conter (bordas)</option>
                <option value="fill">Esticar</option>
              </select>
            </div>

            {selectedArea.imageUrl && (
              <div className="flex items-center gap-2">
                <img
                  src={selectedArea.imageUrl}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded border border-gray-600"
                />
                <button
                  onClick={() => updateSelectedArea({ imageUrl: undefined })}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400"
                  title="Remover imagem"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
