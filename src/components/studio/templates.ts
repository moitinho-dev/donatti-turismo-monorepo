import {
  BRAND,
  FORMATS,
  newId,
  type ArtFormat,
  type ImageLayer,
  type Layer,
  type ShapeLayer,
  type StudioDoc,
  type TextLayer,
} from "./types"

// ---------------------------------------------------------------------------
// Construtores de camadas
// ---------------------------------------------------------------------------

type TextOpts = Partial<TextLayer> & Pick<TextLayer, "text" | "x" | "y" | "width" | "fontSize">
const text = (o: TextOpts): TextLayer => ({
  id: newId(),
  name: o.name || o.text.replace(/[{}]/g, "").slice(0, 24),
  type: "text",
  height: Math.round(o.fontSize * (o.lineHeight ?? 1.1)),
  rotation: 0,
  opacity: 1,
  fontFamily: "Montserrat",
  fontWeight: "700",
  fill: BRAND.white,
  align: "left",
  lineHeight: 1.1,
  letterSpacing: 0,
  fit: "shrink",
  ...o,
})

type ShapeOpts = Partial<ShapeLayer> & Pick<ShapeLayer, "x" | "y" | "width" | "height">
const rect = (o: ShapeOpts): ShapeLayer => ({ id: newId(), name: "Forma", type: "rect", rotation: 0, opacity: 1, fill: BRAND.orange, ...o })
const ellipse = (o: ShapeOpts): ShapeLayer => ({ id: newId(), name: "Círculo", type: "ellipse", rotation: 0, opacity: 1, fill: BRAND.yellow, ...o })

type ImageOpts = Partial<ImageLayer> & Pick<ImageLayer, "x" | "y" | "width" | "height" | "src">
const image = (o: ImageOpts): ImageLayer => ({ id: newId(), name: "Imagem", type: "image", rotation: 0, opacity: 1, fit: "cover", cornerRadius: 0, ...o })

const photo = (o: Omit<ImageOpts, "src">) => image({ name: "Foto do destino", role: "photo", src: "", ...o })
const logo = (light: boolean, x: number, y: number, width: number) =>
  image({ name: "Logo Donatti", role: "logo", src: light ? BRAND.logoLight : BRAND.logoDark, x, y, width, height: Math.round(width * (439 / 1539)), fit: "contain" })

const doc = (format: ArtFormat, background: string, layers: Layer[]): StudioDoc => ({
  version: 1,
  format,
  width: FORMATS[format].width,
  height: FORMATS[format].height,
  background,
  layers,
})

// ---------------------------------------------------------------------------
// Modelos prontos (cada um gera os 4 formatos)
// ---------------------------------------------------------------------------

export interface TemplateFamily {
  id: string
  name: string
  description: string
  swatch: [string, string]
  build: (format: ArtFormat) => StudioDoc
}

/** Foto em tela cheia com degradê e preço em destaque */
function destaque(format: ArtFormat): StudioDoc {
  const { width: W, height: H } = FORMATS[format]
  const s = Math.min(W, H) / 1080
  const m = Math.round(64 * s)

  if (format === "landscape") {
    const panelW = Math.round(W * 0.52)
    return doc(format, BRAND.black, [
      photo({ x: 0, y: 0, width: W, height: H }),
      rect({ name: "Painel", x: 0, y: 0, width: panelW, height: H, fill: "rgba(11,11,15,0.82)" }),
      logo(true, m, m * 0.8, 210),
      text({ text: "{DESTINO}", x: m, y: 150, width: panelW - m * 1.5, fontSize: 64, fontWeight: "900", uppercase: true }),
      text({ text: "{HOTEL}", x: m, y: 228, width: panelW - m * 1.5, fontSize: 24, fontWeight: "600", fill: "#E5E7EB" }),
      text({ text: "{DATAS} • {NOITES}", x: m, y: 268, width: panelW - m * 1.5, fontSize: 22, fontWeight: "500", fill: "#D1D5DB" }),
      text({ text: "{PARCELAS} de R$", x: m, y: 340, width: 300, fontSize: 26, fontWeight: "700", fill: BRAND.yellow }),
      text({ text: "{VALOR_PARCELA}", x: m, y: 372, width: panelW - m, fontSize: 96, fontWeight: "900", fill: BRAND.yellow }),
      text({ text: "ou R$ {VALOR_TOTAL} por pessoa", x: m, y: 478, width: panelW - m, fontSize: 22, fontWeight: "500", fill: "#E5E7EB" }),
      text({ text: "WhatsApp {WHATSAPP}", x: m, y: H - 70, width: panelW - m, fontSize: 22, fontWeight: "700" }),
    ])
  }

  const tall = H / W > 1.6
  const bottom = H - m
  const priceSize = Math.round((tall ? 150 : 128) * s)
  const destSize = Math.round((tall ? 104 : 88) * s)
  const yWhats = bottom - 40 * s
  const yTotal = yWhats - 70 * s
  const yPrice = yTotal - priceSize * 1.02
  const yParcelas = yPrice - 46 * s
  const yDetails = yParcelas - 70 * s
  const yDates = yDetails - 48 * s
  const yHotel = yDates - 50 * s
  const yDest = yHotel - destSize * 1.08

  return doc(format, BRAND.black, [
    photo({ x: 0, y: 0, width: W, height: H }),
    rect({ name: "Degradê", x: 0, y: Math.round(H * 0.32), width: W, height: Math.round(H * 0.68), fill: "#000000", gradient: { from: "rgba(0,0,0,0)", to: "rgba(0,0,0,0.88)" } }),
    rect({ name: "Degradê topo", x: 0, y: 0, width: W, height: Math.round(H * 0.18), fill: "#000000", gradient: { from: "rgba(0,0,0,0.55)", to: "rgba(0,0,0,0)" } }),
    logo(true, m, m, Math.round(300 * s)),
    rect({ name: "Selo região", x: W - m - 300 * s, y: m + 6 * s, width: 300 * s, height: 64 * s, fill: BRAND.orange, cornerRadius: 32 * s }),
    text({ name: "Região", text: "{REGIAO}", x: W - m - 300 * s, y: m + 22 * s, width: 300 * s, fontSize: 30 * s, fontWeight: "800", align: "center", uppercase: true, letterSpacing: 2 }),
    text({ text: "{DESTINO}", x: m, y: yDest, width: W - 2 * m, fontSize: destSize, fontWeight: "900", uppercase: true, lineHeight: 1 }),
    text({ text: "{HOTEL}", x: m, y: yHotel, width: W - 2 * m, fontSize: 38 * s, fontWeight: "600", fill: "#F3F4F6" }),
    text({ text: "{DATAS} • {NOITES}", x: m, y: yDates, width: W - 2 * m, fontSize: 32 * s, fontWeight: "500", fill: "#E5E7EB" }),
    text({ text: "{AEREO} • {REGIME} • saída {SAIDA}", x: m, y: yDetails, width: W - 2 * m, fontSize: 28 * s, fontWeight: "500", fill: "#D1D5DB" }),
    text({ text: "{PARCELAS} de R$", x: m, y: yParcelas, width: W - 2 * m, fontSize: 36 * s, fontWeight: "700", fill: BRAND.yellow }),
    text({ text: "{VALOR_PARCELA}", x: m, y: yPrice, width: W - 2 * m, fontSize: priceSize, fontWeight: "900", fill: BRAND.yellow, lineHeight: 1 }),
    text({ text: "ou R$ {VALOR_TOTAL} por pessoa", x: m, y: yTotal, width: W - 2 * m, fontSize: 30 * s, fontWeight: "500", fill: "#F3F4F6" }),
    text({ text: "WhatsApp {WHATSAPP}", x: m, y: yWhats, width: W - 2 * m, fontSize: 30 * s, fontWeight: "800" }),
  ])
}

/** Fundo preto, foto em cartão e selo de desconto */
function blackFriday(format: ArtFormat): StudioDoc {
  const { width: W, height: H } = FORMATS[format]
  const s = Math.min(W, H) / 1080
  const m = Math.round(60 * s)

  if (format === "landscape") {
    const photoW = Math.round(W * 0.46)
    const tx = photoW + 50
    const tw = W - tx - 40
    return doc(format, BRAND.black, [
      photo({ x: 0, y: 0, width: photoW, height: H }),
      ellipse({ name: "Selo desconto", x: photoW - 90, y: 40, width: 160, height: 160, fill: BRAND.yellow, showIf: "DESCONTO" }),
      text({ text: "-{DESCONTO}%", x: photoW - 90, y: 95, width: 160, fontSize: 46, fontWeight: "900", fill: BRAND.black, align: "center" }),
      text({ text: "BLACK FRIDAY", x: tx, y: 40, width: tw, fontSize: 64, fontFamily: "Anton", fontWeight: "400", fill: BRAND.yellow, letterSpacing: 2 }),
      text({ text: "{DESTINO}", x: tx, y: 140, width: tw, fontSize: 52, fontWeight: "900", uppercase: true }),
      text({ text: "{HOTEL} • {NOITES}", x: tx, y: 205, width: tw, fontSize: 22, fontWeight: "500", fill: "#D1D5DB" }),
      text({ text: "De R$ {VALOR_DE}", x: tx, y: 270, width: tw, fontSize: 24, fontWeight: "600", fill: "#9CA3AF", textDecoration: "line-through" }),
      text({ text: "{PARCELAS} de R$ {VALOR_PARCELA}", x: tx, y: 305, width: tw, fontSize: 54, fontWeight: "900", fill: BRAND.yellow }),
      text({ text: "ou R$ {VALOR_TOTAL} por pessoa", x: tx, y: 372, width: tw, fontSize: 22, fontWeight: "500", fill: "#E5E7EB" }),
      logo(true, tx, H - 100, 200),
      text({ text: "{WHATSAPP}", x: tx + 220, y: H - 82, width: tw - 220, fontSize: 24, fontWeight: "800", align: "right" }),
    ])
  }

  const tall = H / W > 1.6
  const photoY = Math.round((tall ? 330 : 230) * s)
  const photoH = Math.round(H * (tall ? 0.4 : 0.38))
  const yDest = photoY + photoH + 50 * s
  const destSize = Math.round((tall ? 88 : 76) * s)

  return doc(format, BRAND.black, [
    logo(true, m, m, Math.round(260 * s)),
    text({ text: "BLACK FRIDAY", x: m, y: photoY - (tall ? 200 : 150) * s, width: W - 2 * m, fontSize: (tall ? 150 : 120) * s, fontFamily: "Anton", fontWeight: "400", fill: BRAND.yellow, letterSpacing: 4, lineHeight: 1 }),
    photo({ x: m, y: photoY, width: W - 2 * m, height: photoH, cornerRadius: 36 * s }),
    ellipse({ name: "Selo desconto", x: W - m - 230 * s, y: photoY - 70 * s, width: 230 * s, height: 230 * s, fill: BRAND.yellow, showIf: "DESCONTO" }),
    text({ text: "-{DESCONTO}%", x: W - m - 230 * s, y: photoY + 10 * s, width: 230 * s, fontSize: 66 * s, fontWeight: "900", fill: BRAND.black, align: "center" }),
    text({ text: "{DESTINO}", x: m, y: yDest, width: W - 2 * m, fontSize: destSize, fontWeight: "900", uppercase: true, lineHeight: 1 }),
    text({ text: "{HOTEL} • {NOITES} • {REGIME}", x: m, y: yDest + destSize + 18 * s, width: W - 2 * m, fontSize: 32 * s, fontWeight: "500", fill: "#D1D5DB" }),
    text({ text: "De R$ {VALOR_DE}", x: m, y: yDest + destSize + 90 * s, width: W - 2 * m, fontSize: 36 * s, fontWeight: "600", fill: "#9CA3AF", textDecoration: "line-through" }),
    text({ text: "{PARCELAS} de R$ {VALOR_PARCELA}", x: m, y: yDest + destSize + 140 * s, width: W - 2 * m, fontSize: (tall ? 92 : 80) * s, fontWeight: "900", fill: BRAND.yellow, lineHeight: 1 }),
    text({ text: "ou R$ {VALOR_TOTAL} por pessoa • {AEREO}", x: m, y: yDest + destSize + (tall ? 250 : 230) * s, width: W - 2 * m, fontSize: 30 * s, fontWeight: "500", fill: "#E5E7EB" }),
    rect({ name: "Faixa WhatsApp", x: 0, y: H - 120 * s, width: W, height: 120 * s, fill: BRAND.yellow }),
    text({ text: "Chame no WhatsApp {WHATSAPP}", x: m, y: H - 80 * s, width: W - 2 * m, fontSize: 38 * s, fontWeight: "900", fill: BRAND.black, align: "center" }),
  ])
}

/** Fundo claro, foto no topo e textos em azul da marca */
function clean(format: ArtFormat): StudioDoc {
  const { width: W, height: H } = FORMATS[format]
  const s = Math.min(W, H) / 1080
  const m = Math.round(64 * s)

  if (format === "landscape") {
    const photoW = Math.round(W * 0.5)
    const tx = photoW + 50
    const tw = W - tx - 50
    return doc(format, "#FFFFFF", [
      photo({ x: 0, y: 0, width: photoW, height: H }),
      logo(false, tx, 40, 220),
      text({ text: "{DESTINO}", x: tx, y: 130, width: tw, fontSize: 56, fontWeight: "900", fill: BRAND.navy }),
      text({ text: "{HOTEL}", x: tx, y: 200, width: tw, fontSize: 24, fontWeight: "600", fill: "#4B5563" }),
      text({ text: "{DATAS} • {NOITES}", x: tx, y: 240, width: tw, fontSize: 22, fontWeight: "500", fill: "#6B7280" }),
      text({ text: "{PARCELAS} de R$ {VALOR_PARCELA}", x: tx, y: 320, width: tw, fontSize: 56, fontWeight: "900", fill: BRAND.orange }),
      text({ text: "ou R$ {VALOR_TOTAL} por pessoa", x: tx, y: 390, width: tw, fontSize: 22, fontWeight: "500", fill: "#4B5563" }),
      rect({ name: "Botão", x: tx, y: H - 110, width: tw, height: 70, fill: BRAND.navy, cornerRadius: 35 }),
      text({ text: "WhatsApp {WHATSAPP}", x: tx, y: H - 88, width: tw, fontSize: 26, fontWeight: "800", align: "center" }),
    ])
  }

  const photoH = Math.round(H * (H / W > 1.6 ? 0.56 : 0.5))
  const y0 = photoH + 56 * s
  return doc(format, "#FFFFFF", [
    photo({ x: 0, y: 0, width: W, height: photoH }),
    rect({ name: "Selo região", x: m, y: m, width: 280 * s, height: 60 * s, fill: "#FFFFFF", cornerRadius: 30 * s }),
    text({ name: "Região", text: "{REGIAO}", x: m, y: m + 17 * s, width: 280 * s, fontSize: 28 * s, fontWeight: "800", fill: BRAND.navy, align: "center", uppercase: true, letterSpacing: 2 }),
    text({ text: "{DESTINO}", x: m, y: y0, width: W - 2 * m, fontSize: 84 * s, fontWeight: "900", fill: BRAND.navy, lineHeight: 1 }),
    text({ text: "{HOTEL} • {NOITES}", x: m, y: y0 + 100 * s, width: W - 2 * m, fontSize: 34 * s, fontWeight: "600", fill: "#4B5563" }),
    text({ text: "{DATAS} • {REGIME}", x: m, y: y0 + 150 * s, width: W - 2 * m, fontSize: 30 * s, fontWeight: "500", fill: "#6B7280" }),
    text({ text: "{PARCELAS} de R$", x: m, y: y0 + 225 * s, width: W - 2 * m, fontSize: 34 * s, fontWeight: "700", fill: BRAND.orange }),
    text({ text: "{VALOR_PARCELA}", x: m, y: y0 + 262 * s, width: W - 2 * m, fontSize: 120 * s, fontWeight: "900", fill: BRAND.orange, lineHeight: 1 }),
    text({ text: "ou R$ {VALOR_TOTAL} por pessoa • saída {SAIDA}", x: m, y: y0 + 392 * s, width: W - 2 * m, fontSize: 28 * s, fontWeight: "500", fill: "#4B5563" }),
    logo(false, m, H - m - 85 * s, Math.round(300 * s)),
    text({ text: "{WHATSAPP}", x: W / 2, y: H - m - 55 * s, width: W / 2 - m, fontSize: 34 * s, fontWeight: "800", fill: BRAND.navy, align: "right" }),
  ])
}

export const TEMPLATE_FAMILIES: TemplateFamily[] = [
  { id: "destaque", name: "Destaque", description: "Foto em tela cheia, preço em amarelo", swatch: ["#1f2937", BRAND.yellow], build: destaque },
  { id: "black-friday", name: "Black Friday", description: "Fundo preto, selo de desconto", swatch: [BRAND.black, BRAND.yellow], build: blackFriday },
  { id: "clean", name: "Clean", description: "Fundo claro, azul e laranja da marca", swatch: ["#FFFFFF", BRAND.navy], build: clean },
]

// ---------------------------------------------------------------------------
// Templates antigos (tabela layouts) -> documento do Studio
// ---------------------------------------------------------------------------

interface LegacyElement {
  x: number
  y: number
  fontSize: number
  fontWeight: string
  color: string
  fontFamily: string
  visible: boolean
  template?: string
}
interface LegacyArea {
  id: string
  name: string
  points: { x: number; y: number }[]
  zIndex: number
  imageUrl?: string
  fit: "cover" | "contain" | "fill"
  visible: boolean
}
export interface LegacyLayout {
  id: string
  name: string
  isDefault?: boolean
  format: "story" | "feed"
  url?: string
  elements: Record<string, LegacyElement>
  imageAreas?: LegacyArea[]
}

// Textos que o Studio antigo mostrava para cada elemento fixo
const LEGACY_TEXT: Record<string, { text: string; showIf?: string }> = {
  region: { text: "{REGIAO}" },
  destination: { text: "{DESTINO}" },
  hotel: { text: "{HOTEL}" },
  dates: { text: "{DATAS}" },
  installments: { text: "{PARCELAS} de" },
  currency: { text: "R$" },
  price: { text: "{VALOR_PARCELA}" },
  installmentText: { text: "no cartão e {PARCELAS} no boleto sem juros." },
  flight: { text: "{AEREO}" },
  perPerson: { text: "Valor por pessoa" },
  nights: { text: "{NOITES}" },
  regime: { text: "{REGIME}" },
  departureLabel: { text: "saindo de", showIf: "SAIDA" },
  departure: { text: "{SAIDA}" },
  disclaimer: { text: "Preço por pessoa em apartamento duplo, sujeito a alteração." },
  contactLabel: { text: "Contato e WhatsApp" },
  // Número que os templates atuais imprimem (o site usa outro; ver BRAND.whatsapp)
  contact: { text: "(67) 9 9637-2769" },
}

const cleanFont = (f: string) => (f || "Montserrat").split(",")[0].replace(/['"]/g, "").trim() || "Montserrat"

/**
 * Converte um template da tela Templates reproduzindo o Studio antigo (DonatiStudio):
 * foto do destino no fundo inteiro (z 0), áreas de foto atrás do template (z área+10),
 * imagem do template (z 20), áreas na frente (z área+30) e textos (z 50).
 * As áreas usam o retângulo que envolve os pontos marcados, como antes.
 */
export function legacyLayoutToDoc(layout: LegacyLayout): StudioDoc {
  const format: ArtFormat = layout.format === "feed" ? "feed" : "story"
  const { width: W, height: H } = FORMATS[format]
  const stack: { z: number; layer: Layer }[] = []

  stack.push({ z: 0, layer: photo({ x: 0, y: 0, width: W, height: H }) })

  for (const a of (layout.imageAreas || []).filter((a) => a.visible && a.points?.length)) {
    const xs = a.points.map((p) => p.x)
    const ys = a.points.map((p) => p.y)
    const x = Math.min(...xs)
    const y = Math.min(...ys)
    stack.push({
      z: a.zIndex < 0 ? a.zIndex + 10 : a.zIndex + 30,
      layer: image({
        name: a.name || "Área de foto",
        role: a.imageUrl ? undefined : "photo",
        src: a.imageUrl || "",
        x,
        y,
        width: Math.max(...xs) - x,
        height: Math.max(...ys) - y,
        fit: a.fit === "contain" ? "contain" : a.fit === "fill" ? "fill" : "cover",
      }),
    })
  }

  if (layout.url) {
    stack.push({ z: 20, layer: image({ name: "Template", src: layout.url, x: 0, y: 0, width: W, height: H, fit: "cover", locked: true }) })
  }

  for (const [key, el] of Object.entries(layout.elements || {})) {
    if (!el?.visible) continue
    const known = LEGACY_TEXT[key]
    const content = el.template || known?.text
    if (!content) continue
    stack.push({
      z: 50,
      layer: text({
        name: key,
        text: content,
        showIf: known?.showIf,
        x: el.x,
        y: el.y,
        width: 0, // largura automática, como no Studio antigo
        fit: undefined,
        fontSize: el.fontSize,
        fontWeight: String(el.fontWeight || "700"),
        fill: el.color || "#FFFFFF",
        fontFamily: cleanFont(el.fontFamily),
        // O Studio antigo era HTML: altura de linha "normal" da fonte (~1.22 na Montserrat)
        lineHeight: 1.22,
      }),
    })
  }

  // Ordenação estável: mesma camada z mantém a ordem do template
  const layers = stack.map((item, i) => ({ ...item, i })).sort((a, b) => a.z - b.z || a.i - b.i).map((item) => item.layer)
  return { version: 1, format, width: W, height: H, background: "#000000", layers }
}

/** Troca a foto de todas as camadas marcadas como foto principal */
export function withPhoto(doc: StudioDoc, src: string | null | undefined): StudioDoc {
  if (!src) return doc
  return { ...doc, layers: doc.layers.map((l) => (l.type === "image" && l.role === "photo" ? { ...l, src } : l)) }
}
