"use client"

import Konva from "konva"
import { resolveText } from "./variables"
import { FONTS, GOOGLE_FONTS_URL, type ImageLayer, type Layer, type ShapeLayer, type StudioDoc, type TextLayer } from "./types"

// ---------------------------------------------------------------------------
// Fontes e imagens
// ---------------------------------------------------------------------------

let fontsLinked: Promise<void> | null = null
/** Injeta a folha de fontes do Google uma vez e resolve quando ela carregou */
export function ensureFontsLinked(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve()
  fontsLinked ??= new Promise((resolve) => {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = GOOGLE_FONTS_URL
    link.onload = () => resolve()
    link.onerror = () => resolve() // sem fontes do Google, desenha com as do sistema
    document.head.appendChild(link)
  })
  return fontsLinked
}

/** Carrega todas as fontes do Studio (usado ao abrir o editor) */
export async function preloadAllFonts() {
  await ensureFontsLinked()
  await Promise.all(
    FONTS.flatMap((f) => f.weights.map((w) => document.fonts.load(`${w} 40px "${f.family}"`).catch(() => undefined))),
  )
}

/** Garante que as fontes usadas no documento carregaram antes de desenhar */
export async function loadDocFonts(doc: StudioDoc) {
  await ensureFontsLinked()
  const wanted = new Set(
    doc.layers.filter((l): l is TextLayer => l.type === "text").map((l) => `${l.fontStyle === "italic" ? "italic " : ""}${l.fontWeight} 40px "${l.fontFamily}"`),
  )
  await Promise.all(Array.from(wanted).map((f) => document.fonts.load(f).catch(() => undefined)))
}

const imageCache = new Map<string, Promise<HTMLImageElement | null>>()

const looksSvg = (src: string) => src.startsWith("data:image/svg+xml") || /\.svg(\?|#|$)/i.test(src)

/**
 * SVG sem width/height (só viewBox) não tem tamanho próprio como imagem e o canvas não sabe desenhar.
 * Aqui o tamanho vem do viewBox, como o navegador fazia no Studio antigo.
 */
function svgWithSize(svgText: string): string {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml")
  const root = doc.documentElement
  if (root.nodeName.toLowerCase() !== "svg") return svgText
  const vb = (root.getAttribute("viewBox") || "").split(/[\s,]+/).map(Number)
  if (!root.getAttribute("width") && vb.length === 4 && vb[2] > 0) root.setAttribute("width", String(vb[2]))
  if (!root.getAttribute("height") && vb.length === 4 && vb[3] > 0) root.setAttribute("height", String(vb[3]))
  return new XMLSerializer().serializeToString(root)
}

function imageFromUrl(src: string, crossOrigin: boolean): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image()
    // Necessário para exportar o canvas (a origem precisa liberar CORS)
    if (crossOrigin) img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function svgImage(svgText: string) {
  const url = URL.createObjectURL(new Blob([svgWithSize(svgText)], { type: "image/svg+xml" }))
  return imageFromUrl(url, false)
}

async function loadImageUncached(src: string): Promise<HTMLImageElement | null> {
  try {
    if (src.startsWith("data:image/svg+xml")) {
      const comma = src.indexOf(",")
      const meta = src.slice(0, comma)
      const body = src.slice(comma + 1)
      return svgImage(meta.includes(";base64") ? new TextDecoder().decode(Uint8Array.from(atob(body), (c) => c.charCodeAt(0))) : decodeURIComponent(body))
    }
    if (src.startsWith("data:")) return imageFromUrl(src, false)

    // Mesmo site (templates em /api/layouts/image, /assets, /uploads): descobre se é SVG pelo tipo do arquivo
    if (src.startsWith("/")) {
      const res = await fetch(src)
      if (!res.ok) return null
      if ((res.headers.get("content-type") || "").includes("svg") || looksSvg(src)) return svgImage(await res.text())
      return imageFromUrl(URL.createObjectURL(await res.blob()), false)
    }

    if (looksSvg(src)) {
      const res = await fetch(src)
      return res.ok ? svgImage(await res.text()) : null
    }
    return imageFromUrl(src, true)
  } catch {
    return null
  }
}

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null)
  let p = imageCache.get(src)
  if (!p) {
    p = loadImageUncached(src).then((img) => {
      if (!img) imageCache.delete(src)
      return img
    })
    imageCache.set(src, p)
  }
  return p
}

// ---------------------------------------------------------------------------
// Atributos de cada camada (usados pelo editor e pela exportação)
// ---------------------------------------------------------------------------

export function isLayerVisible(layer: Layer, vars: Record<string, string>) {
  if (layer.hidden) return false
  if (layer.showIf && !vars[layer.showIf]) return false
  if (layer.type === "text" && resolveText(layer.text, vars).empty) return false
  return true
}

let measureCtx: CanvasRenderingContext2D | null = null
function measureLine(text: string, layer: TextLayer, fontSize: number) {
  measureCtx ??= document.createElement("canvas").getContext("2d")
  if (!measureCtx) return 0
  measureCtx.font = `${layer.fontStyle === "italic" ? "italic " : ""}${layer.fontWeight} ${fontSize}px "${layer.fontFamily}"`
  return measureCtx.measureText(text).width + layer.letterSpacing * Math.max(0, text.length - 1)
}

/** Tamanho de fonte para o texto caber em uma linha na largura da camada (nunca menor que 45% do original) */
export function fittedFontSize(layer: TextLayer, text: string) {
  if (layer.fit !== "shrink" || layer.width <= 0 || typeof document === "undefined") return layer.fontSize
  const longest = text.split("\n").reduce((max, line) => Math.max(max, measureLine(line, layer, layer.fontSize)), 0)
  if (longest <= layer.width) return layer.fontSize
  return Math.max(layer.fontSize * 0.45, Math.floor(layer.fontSize * (layer.width / longest) * 0.98))
}

export function textAttrs(layer: TextLayer, vars: Record<string, string>) {
  const raw = resolveText(layer.text, vars).text
  const resolved = layer.uppercase ? raw.toLocaleUpperCase("pt-BR") : raw
  return {
    x: layer.x,
    y: layer.y,
    rotation: layer.rotation,
    opacity: layer.opacity,
    text: resolved,
    ...(layer.width > 0 ? { width: layer.width } : {}),
    ...(layer.fit === "shrink" ? { wrap: "none" as const, ellipsis: false } : {}),
    fontFamily: layer.fontFamily,
    fontSize: fittedFontSize(layer, resolved),
    fontStyle: `${layer.fontStyle === "italic" ? "italic " : ""}${layer.fontWeight}`,
    fill: layer.fill,
    align: layer.align,
    lineHeight: layer.lineHeight,
    letterSpacing: layer.letterSpacing,
    textDecoration: layer.textDecoration || "",
    ...(layer.stroke && layer.strokeWidth ? { stroke: layer.stroke, strokeWidth: layer.strokeWidth, fillAfterStrokeEnabled: true } : {}),
    ...(layer.shadow ? { shadowColor: "#000000", shadowBlur: 14, shadowOpacity: 0.45, shadowOffsetX: 0, shadowOffsetY: 3 } : {}),
  }
}

export function rectAttrs(layer: ShapeLayer) {
  return {
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    rotation: layer.rotation,
    opacity: layer.opacity,
    cornerRadius: layer.cornerRadius || 0,
    ...(layer.stroke && layer.strokeWidth ? { stroke: layer.stroke, strokeWidth: layer.strokeWidth } : {}),
    ...(layer.gradient
      ? {
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: layer.height },
          fillLinearGradientColorStops: [0, layer.gradient.from, 1, layer.gradient.to],
        }
      : { fill: layer.fill }),
  }
}

/** Ellipse no Konva é posicionada pelo centro; o documento guarda a caixa */
export function ellipseAttrs(layer: ShapeLayer) {
  return {
    x: layer.x + layer.width / 2,
    y: layer.y + layer.height / 2,
    radiusX: layer.width / 2,
    radiusY: layer.height / 2,
    rotation: layer.rotation,
    opacity: layer.opacity,
    fill: layer.fill,
    ...(layer.stroke && layer.strokeWidth ? { stroke: layer.stroke, strokeWidth: layer.strokeWidth } : {}),
  }
}

/** Recorte para "cover" ou posição/tamanho para "contain" */
export function imageAttrs(layer: ImageLayer, img: HTMLImageElement | null) {
  const base = {
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    rotation: layer.rotation,
    opacity: layer.opacity,
    cornerRadius: layer.cornerRadius || 0,
  }
  if (!img) return { ...base, image: undefined, crop: undefined }
  if (layer.fit === "fill") return { ...base, image: img, crop: undefined }
  const iw = img.naturalWidth || layer.width
  const ih = img.naturalHeight || layer.height
  if (layer.fit === "contain") {
    const scale = Math.min(layer.width / iw, layer.height / ih)
    const w = iw * scale
    const h = ih * scale
    return { ...base, image: img, x: layer.x + (layer.width - w) / 2, y: layer.y + (layer.height - h) / 2, width: w, height: h, crop: undefined }
  }
  const scale = Math.max(layer.width / iw, layer.height / ih)
  const cw = layer.width / scale
  const ch = layer.height / scale
  return { ...base, image: img, crop: { x: (iw - cw) / 2, y: (ih - ch) / 2, width: cw, height: ch } }
}

/** Contorno poligonal (templates antigos) */
export function clipFuncFor(points: { x: number; y: number }[]) {
  return (ctx: Konva.Context) => {
    ctx.beginPath()
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.closePath()
  }
}

// ---------------------------------------------------------------------------
// Exportação: desenha o documento fora da tela e devolve a imagem
// ---------------------------------------------------------------------------

export async function renderDoc(
  doc: StudioDoc,
  vars: Record<string, string>,
  opts: { mime?: "image/png" | "image/jpeg"; quality?: number; maxWidth?: number } = {},
): Promise<string> {
  await loadDocFonts(doc)
  const images = new Map<string, HTMLImageElement | null>()
  await Promise.all(
    doc.layers
      .filter((l): l is ImageLayer => l.type === "image" && !!l.src)
      .map(async (l) => images.set(l.src, await loadImage(l.src))),
  )

  const container = document.createElement("div")
  container.style.cssText = "position:fixed;left:-99999px;top:0;pointer-events:none"
  document.body.appendChild(container)
  const stage = new Konva.Stage({ container, width: doc.width, height: doc.height })
  const layer = new Konva.Layer()
  stage.add(layer)
  layer.add(new Konva.Rect({ x: 0, y: 0, width: doc.width, height: doc.height, fill: doc.background }))

  for (const l of doc.layers) {
    if (!isLayerVisible(l, vars)) continue
    if (l.type === "text") layer.add(new Konva.Text(textAttrs(l, vars)))
    else if (l.type === "rect") layer.add(new Konva.Rect(rectAttrs(l)))
    else if (l.type === "ellipse") layer.add(new Konva.Ellipse(ellipseAttrs(l)))
    else if (l.type === "image") {
      const img = images.get(l.src) || null
      if (!img) continue
      const node = new Konva.Image({ ...imageAttrs(l, img), image: img })
      if (l.clipPoints?.length) {
        const group = new Konva.Group({ clipFunc: clipFuncFor(l.clipPoints) })
        group.add(node)
        layer.add(group)
      } else {
        layer.add(node)
      }
    }
  }

  layer.draw()
  const pixelRatio = opts.maxWidth && opts.maxWidth < doc.width ? opts.maxWidth / doc.width : 1
  try {
    return stage.toDataURL({ mimeType: opts.mime || "image/png", quality: opts.quality ?? 0.92, pixelRatio })
  } finally {
    stage.destroy()
    container.remove()
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
