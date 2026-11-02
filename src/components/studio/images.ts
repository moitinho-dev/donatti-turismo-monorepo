"use client"

/**
 * Carregamento das imagens do Studio (fotos, logos, SVGs dos templates).
 * Separado do desenho para dar para testar a exportação sem navegador.
 */

/** Exportação estrita: alguma imagem da arte não carregou (ex.: o site da foto não libera CORS) */
export class ImageLoadError extends Error {
  readonly srcs: string[]
  constructor(srcs: string[]) {
    super(`Imagem não carregou: ${srcs.join(", ")}`)
    this.name = "ImageLoadError"
    this.srcs = srcs
  }
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
