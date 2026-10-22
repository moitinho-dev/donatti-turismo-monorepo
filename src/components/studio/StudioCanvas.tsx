"use client"

import { useEffect, useRef, useState } from "react"
import type Konva from "konva"
import { Ellipse, Group, Image as KImage, Layer as KLayer, Line, Rect, Stage, Text, Transformer } from "react-konva"
import { clipFuncFor, ellipseAttrs, imageAttrs, isLayerVisible, loadImage, rectAttrs, textAttrs } from "./render"
import type { Layer, StudioDoc, TextLayer } from "./types"

interface StudioCanvasProps {
  doc: StudioDoc
  vars: Record<string, string>
  scale: number
  selectedId: string | null
  onSelect: (id: string | null) => void
  /** commit=false durante arraste (não entra no histórico) */
  onChange: (id: string, patch: Partial<Layer>, commit: boolean) => void
  stageRef?: React.RefObject<Konva.Stage | null>
}

type Guide = { orientation: "V" | "H"; pos: number }
const SNAP = 8

export function StudioCanvas({ doc, vars, scale, selectedId, onSelect, onChange, stageRef: externalRef }: StudioCanvasProps) {
  const internalRef = useRef<Konva.Stage | null>(null)
  const stageRef = externalRef || internalRef
  const trRef = useRef<Konva.Transformer | null>(null)
  const [images, setImages] = useState<Record<string, HTMLImageElement | null>>({})
  const [guides, setGuides] = useState<Guide[]>([])
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null)
  const [fontTick, setFontTick] = useState(0)

  // Carrega imagens das camadas
  useEffect(() => {
    const srcs = Array.from(new Set(doc.layers.flatMap((l) => (l.type === "image" && l.src ? [l.src] : []))))
    let alive = true
    srcs.forEach((src) => {
      if (src in images) return
      void loadImage(src).then((img) => alive && setImages((prev) => ({ ...prev, [src]: img })))
    })
    return () => {
      alive = false
    }
  }, [doc.layers]) // eslint-disable-line react-hooks/exhaustive-deps

  // Redesenha quando as fontes terminam de carregar (senão o texto aparece com a fonte padrão)
  useEffect(() => {
    const onFonts = () => setFontTick((t) => t + 1)
    document.fonts?.addEventListener?.("loadingdone", onFonts)
    return () => document.fonts?.removeEventListener?.("loadingdone", onFonts)
  }, [])

  const selected = doc.layers.find((l) => l.id === selectedId) || null

  // Liga o Transformer à camada selecionada
  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    const node = selected && !selected.locked && !editing ? stage.findOne(`#${selected.id}`) : null
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()
  }, [selected, editing, doc, stageRef, fontTick])

  // Guias de alinhamento: bordas e centro da arte e das outras camadas
  const snapLines = (draggingId: string) => {
    const stage = stageRef.current
    const v = [0, doc.width / 2, doc.width]
    const h = [0, doc.height / 2, doc.height]
    stage?.find(".layer-node").forEach((n) => {
      if (n.id() === draggingId) return
      const r = n.getClientRect({ relativeTo: n.getLayer() || undefined })
      v.push(r.x, r.x + r.width / 2, r.x + r.width)
      h.push(r.y, r.y + r.height / 2, r.y + r.height)
    })
    return { v, h }
  }

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    const { v, h } = snapLines(node.id())
    const box = node.getClientRect({ relativeTo: node.getLayer() || undefined })
    const threshold = SNAP / scale
    const found: Guide[] = []

    const snapAxis = (edges: number[], lines: number[], orientation: "V" | "H") => {
      let best: { diff: number; line: number } | null = null
      for (const edge of edges) {
        for (const line of lines) {
          const diff = line - edge
          if (Math.abs(diff) < threshold && (!best || Math.abs(diff) < Math.abs(best.diff))) best = { diff, line }
        }
      }
      if (best) {
        if (orientation === "V") node.x(node.x() + best.diff)
        else node.y(node.y() + best.diff)
        found.push({ orientation, pos: best.line })
      }
    }
    snapAxis([box.x, box.x + box.width / 2, box.x + box.width], v, "V")
    snapAxis([box.y, box.y + box.height / 2, box.y + box.height], h, "H")
    setGuides(found)
  }

  const commitPosition = (layer: Layer, node: Konva.Node) => {
    setGuides([])
    if (layer.type === "ellipse") onChange(layer.id, { x: node.x() - layer.width / 2, y: node.y() - layer.height / 2 }, true)
    else onChange(layer.id, { x: node.x(), y: node.y() }, true)
  }

  const handleTransformEnd = (layer: Layer, node: Konva.Node) => {
    const sx = node.scaleX()
    const sy = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    const rotation = node.rotation()
    if (layer.type === "text") {
      const t = node as Konva.Text
      const uniform = Math.abs(sx - sy) < 0.01
      const width = Math.max(40, (layer.width > 0 ? layer.width : t.width()) * sx)
      onChange(
        layer.id,
        uniform
          ? { x: node.x(), y: node.y(), rotation, width, fontSize: Math.max(8, Math.round(layer.fontSize * sy)) }
          : { x: node.x(), y: node.y(), rotation, width },
        true,
      )
    } else if (layer.type === "ellipse") {
      const width = Math.max(10, layer.width * sx)
      const height = Math.max(10, layer.height * sy)
      onChange(layer.id, { x: node.x() - width / 2, y: node.y() - height / 2, width, height, rotation }, true)
    } else if (layer.type === "image" && layer.fit === "contain") {
      // A caixa da imagem "contain" é maior que o que aparece; escala a caixa toda
      onChange(layer.id, { width: Math.max(10, layer.width * sx), height: Math.max(10, layer.height * sy), rotation }, true)
    } else {
      onChange(layer.id, { x: node.x(), y: node.y(), width: Math.max(10, layer.width * sx), height: Math.max(10, layer.height * sy), rotation }, true)
    }
  }

  const common = (layer: Layer) => ({
    id: layer.id,
    name: "layer-node",
    draggable: !layer.locked && editing?.id !== layer.id,
    listening: !layer.locked,
    onMouseDown: () => onSelect(layer.id),
    onTap: () => onSelect(layer.id),
    onDragStart: () => onSelect(layer.id),
    onDragMove: handleDragMove,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => commitPosition(layer, e.target),
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(layer, e.target),
  })

  const editingLayer = editing ? (doc.layers.find((l) => l.id === editing.id) as TextLayer | undefined) : undefined

  return (
    <div className="relative" style={{ width: doc.width * scale, height: doc.height * scale }}>
      <Stage
        ref={stageRef}
        width={doc.width * scale}
        height={doc.height * scale}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage() || e.target.name() === "background") onSelect(null)
        }}
        onTouchStart={(e) => {
          if (e.target === e.target.getStage() || e.target.name() === "background") onSelect(null)
        }}
      >
        <KLayer>
          <Rect name="background" x={0} y={0} width={doc.width} height={doc.height} fill={doc.background} />
          {doc.layers.map((layer) => {
            if (!isLayerVisible(layer, vars)) return null
            if (layer.type === "text") {
              return (
                <Text
                  key={`${layer.id}-${fontTick}`}
                  {...common(layer)}
                  {...textAttrs(layer, vars)}
                  opacity={editing?.id === layer.id ? 0 : layer.opacity}
                  onDblClick={() => setEditing({ id: layer.id, value: layer.text })}
                  onDblTap={() => setEditing({ id: layer.id, value: layer.text })}
                />
              )
            }
            if (layer.type === "rect") return <Rect key={layer.id} {...common(layer)} {...rectAttrs(layer)} />
            if (layer.type === "ellipse") return <Ellipse key={layer.id} {...common(layer)} {...ellipseAttrs(layer)} />
            if (layer.type !== "image") return null

            const img = layer.src ? images[layer.src] ?? null : null
            if (!img) {
              // Espaço reservado enquanto carrega ou quando a foto ainda não foi escolhida
              return (
                <Rect
                  key={layer.id}
                  {...common(layer)}
                  x={layer.x}
                  y={layer.y}
                  width={layer.width}
                  height={layer.height}
                  rotation={layer.rotation}
                  cornerRadius={layer.cornerRadius}
                  fill={layer.role === "photo" ? "#CBD5E1" : "rgba(203,213,225,0.4)"}
                  dash={[16, 10]}
                  stroke="#94A3B8"
                  strokeWidth={4}
                />
              )
            }
            const attrs = imageAttrs(layer, img)
            const node = <KImage key={layer.id} {...common(layer)} {...attrs} image={img} />
            return layer.clipPoints?.length ? (
              <Group key={layer.id} clipFunc={clipFuncFor(layer.clipPoints)}>
                {node}
              </Group>
            ) : (
              node
            )
          })}

          {guides.map((g, i) =>
            g.orientation === "V" ? (
              <Line key={i} points={[g.pos, 0, g.pos, doc.height]} stroke="#EC4899" strokeWidth={2 / scale} dash={[8 / scale, 6 / scale]} listening={false} />
            ) : (
              <Line key={i} points={[0, g.pos, doc.width, g.pos]} stroke="#EC4899" strokeWidth={2 / scale} dash={[8 / scale, 6 / scale]} listening={false} />
            ),
          )}

          <Transformer
            ref={trRef}
            rotateEnabled
            rotationSnaps={[0, 90, 180, 270]}
            anchorSize={Math.max(10, 12)}
            anchorCornerRadius={6}
            anchorStroke="#F59E0B"
            borderStroke="#F59E0B"
            borderStrokeWidth={2}
            keepRatio={selected?.type === "image" || selected?.type === "text"}
            enabledAnchors={
              selected?.type === "text"
                ? ["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right"]
                : undefined
            }
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10 ? oldBox : newBox)}
          />
        </KLayer>
      </Stage>

      {/* Edição de texto no lugar (duplo clique) */}
      {editing && editingLayer && (
        <textarea
          autoFocus
          value={editing.value}
          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
          onBlur={() => {
            onChange(editing.id, { text: editing.value }, true)
            setEditing(null)
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) (e.target as HTMLTextAreaElement).blur()
            e.stopPropagation()
          }}
          className="absolute resize-none border-2 border-amber-500 bg-white/95 p-1 outline-none rounded"
          style={{
            left: editingLayer.x * scale,
            top: editingLayer.y * scale,
            width: Math.max(160, (editingLayer.width > 0 ? editingLayer.width : 600) * scale),
            minHeight: editingLayer.fontSize * scale * 1.6,
            fontSize: Math.max(12, editingLayer.fontSize * scale),
            fontFamily: editingLayer.fontFamily,
            fontWeight: Number(editingLayer.fontWeight),
            lineHeight: editingLayer.lineHeight,
            textAlign: editingLayer.align,
            color: "#111827",
            transform: `rotate(${editingLayer.rotation}deg)`,
            transformOrigin: "top left",
          }}
        />
      )}
    </div>
  )
}
