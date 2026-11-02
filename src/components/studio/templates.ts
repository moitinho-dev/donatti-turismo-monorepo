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

// Peças da campanha Black November (manual da campanha): foto do destino em evidência,
// faixas de esquenta, etiqueta do destino, preço de varejo e faixa amarela de chamada
const BN = {
  black: "#0A0A0C",
  yellow: "#FED400",
  logo: "/images/black-november/logo-black-november.svg",
  logoRatio: 531 / 1112,
  donattiInk: "/images/black-november/donatti-preto.svg",
  donattiRatio: 230 / 756,
  icon: (name: "aereo" | "cafe" | "hotel") => `/images/black-november/icons/icon-${name}.png`,
}

/** Faixa amarela inclinada com contorno preto e texto repetido (rotação em torno do canto esquerdo) */
function bnTape(W: number, cy: number, h: number, rotation: number, label: string): Layer[] {
  const x = -120
  const width = W + 240
  const y = cy - h / 2
  return [
    rect({ name: `Faixa ${label}`, x, y, width, height: h, rotation, fill: BN.yellow, stroke: BN.black, strokeWidth: Math.max(4, h * 0.09) }),
    text({
      name: `Texto faixa ${label}`,
      text: Array.from({ length: 6 }, () => label).join("   •   "),
      x: x + 30,
      y: y + h * 0.24,
      width: width * 3,
      rotation,
      fontSize: Math.round(h * 0.46),
      fontWeight: "900",
      fill: BN.black,
      uppercase: true,
      letterSpacing: 1,
      fit: undefined,
    }),
  ]
}

/** Preço de varejo: "15x" e "R$" empilhados, reais grandes alinhados à direita e centavos em cima */
function bnPrice(x: number, y: number, size: number): Layer[] {
  const side = Math.round(size * 0.3)
  // largura calibrada para 3 dígitos (a fonte encolhe nos de 4)
  const intW = Math.round(size * 1.62)
  const intX = x + side * 2.05
  return [
    text({ name: "A partir de", text: "A PARTIR DE", x, y, width: size * 3, fontSize: Math.round(size * 0.13), fontWeight: "900", letterSpacing: 4 }),
    text({ name: "Parcelas", text: "{PARCELAS}", x: x - 2, y: y + size * 0.26, width: side * 2.4, fontSize: side, fontWeight: "900", uppercase: true }),
    text({ name: "R$", text: "R$", x: x + side * 0.4, y: y + size * 0.72, width: side * 2, fontSize: side, fontWeight: "900", fill: BN.yellow }),
    text({ name: "Parcela", text: "{VALOR_PARCELA_INT}", x: intX, y: y + size * 0.2, width: intW, fontSize: size, fontWeight: "900", fill: BN.yellow, align: "right", lineHeight: 1, letterSpacing: -4 }),
    text({ name: "Centavos", text: "{VALOR_PARCELA_CENTS}", x: intX + intW + 4, y: y + size * 0.27, width: size * 0.9, fontSize: Math.round(size * 0.36), fontWeight: "900", fill: BN.yellow, fit: undefined }),
    text({ name: "Por pessoa", text: "POR PESSOA  •  OU R$ {VALOR_TOTAL_INT}", x, y: y + size * 1.24, width: size * 3.6, fontSize: Math.round(size * 0.13), fontWeight: "900", letterSpacing: 2 }),
  ]
}

/** Duração, datas e o que está incluso, com ícones */
function bnInfo(x: number, y: number, s: number): Layer[] {
  const icon = Math.round(50 * s)
  const step = Math.round(104 * s)
  const item = (i: number, name: "aereo" | "cafe" | "hotel", label: string, showIf?: string): Layer[] => [
    image({ name: `Ícone ${label}`, src: BN.icon(name), x: x + i * step, y: y + 88 * s, width: icon, height: icon, fit: "contain", showIf }),
    text({ name: label, text: label, x: x + i * step - 20 * s, y: y + 148 * s, width: icon + 40 * s, fontSize: Math.round(17 * s), fontWeight: "600", fontFamily: "Inter", align: "center", showIf }),
  ]
  return [
    text({ name: "Noites", text: "{NOITES}", x, y, width: 380 * s, fontSize: Math.round(30 * s), fontWeight: "900", uppercase: true }),
    text({ name: "Saída", text: "Saída {SAIDA}", x, y: y + 42 * s, width: 380 * s, fontSize: Math.round(19 * s), fontWeight: "600", fontFamily: "Inter", fill: "#C9C9CF" }),
    ...item(0, "aereo", "Aéreo", "AEREO"),
    ...item(1, "cafe", "{REGIME}", "REGIME"),
    ...item(2, "hotel", "Hotel"),
  ]
}

/** Etiqueta do destino + hotel + período */
function bnOffer(x: number, y: number, w: number, s: number, hotelSize: number): Layer[] {
  const pillH = Math.round(50 * s)
  return [
    rect({ name: "Etiqueta destino", x, y, width: 470 * s, height: pillH, fill: BN.yellow, cornerRadius: pillH / 2 }),
    text({ name: "Destino", text: "{DESTINO}", x: x + 20 * s, y: y + pillH * 0.26, width: 430 * s, fontSize: Math.round(25 * s), fontWeight: "900", fill: BN.black, align: "center", uppercase: true, letterSpacing: 2 }),
    text({ name: "Hotel", text: "{HOTEL}", x: x - 2, y: y + pillH + 16 * s, width: w, fontSize: hotelSize, fontWeight: "900", uppercase: true, letterSpacing: -1, lineHeight: 1 }),
    text({ name: "Período", text: "{DATAS}", x, y: y + pillH + hotelSize + 32 * s, width: w, fontSize: Math.round(22 * s), fontWeight: "800", fill: BN.yellow, uppercase: true, letterSpacing: 2 }),
  ]
}

/** Faixa amarela de chamada no pé, com o logo Donatti em preto */
function bnBand(W: number, H: number, top: number, s: number, m: number): Layer[] {
  const logoW = Math.round(190 * s)
  return [
    rect({ name: "Faixa chamada", x: -40, y: top, width: W + 80, height: H - top + 120, rotation: -1.3, fill: BN.yellow }),
    text({ name: "Chamada", text: "GARANTA O SEU NO WHATSAPP", x: m, y: top + 34 * s, width: W - 2 * m - logoW - 30 * s, fontSize: Math.round(30 * s), fontWeight: "900", fill: BN.black }),
    image({ name: "Logo Donatti", src: BN.donattiInk, x: W - m - logoW, y: top + 18 * s, width: logoW, height: Math.round(logoW * BN.donattiRatio), fit: "contain" }),
    text({ name: "Aviso", text: "*Tarifa por pessoa, sujeita a disponibilidade e alteração sem aviso prévio.", x: m, y: top + 86 * s, width: W - 2 * m - logoW, fontSize: Math.round(14 * s), fontWeight: "500", fontFamily: "Inter", fill: BN.black }),
  ]
}

const bnShade = (W: number, from: number, to: number) =>
  rect({ name: "Degradê", x: 0, y: from, width: W, height: to - from + 2, fill: BN.black, gradient: { from: "rgba(10,10,12,0)", to: BN.black } })
const bnTopShade = (W: number, h: number) => rect({ name: "Degradê topo", x: 0, y: 0, width: W, height: h, fill: "#000000", gradient: { from: "rgba(0,0,0,0.45)", to: "rgba(0,0,0,0)" } })
const bnLogo = (x: number, y: number, w: number) => image({ name: "Logo Black November", src: BN.logo, x, y, width: w, height: Math.round(w * BN.logoRatio), fit: "contain" })

/** Black November: foto do destino em evidência e preço de varejo (story respeita 250 px livres em cima e embaixo) */
function blackNovember(format: ArtFormat): StudioDoc {
  const { width: W, height: H } = FORMATS[format]
  const tapes = (y1: number, y2: number, h: number) => [...bnTape(W, y1, h, -3, "Esquenta Black November"), ...bnTape(W, y2, h, 2.5, "Só na Donatti")]

  if (format === "landscape") {
    const px = 540
    return doc(format, BN.black, [
      photo({ x: px, y: 0, width: W - px, height: H }),
      ...tapes(40, 92, 46),
      bnLogo(36, 128, 300),
      ...bnOffer(40, 290, 470, 0.8, 38),
      ...bnPrice(40, 404, 92),
      ...bnBand(W, H, 560, 0.75, 40).slice(0, 3),
    ])
  }

  if (format === "story") {
    const s = 1
    const PH = 1290
    return doc(format, BN.black, [
      photo({ x: 0, y: 0, width: W, height: PH }),
      bnTopShade(W, 420),
      bnShade(W, 1000, PH),
      ...tapes(300, 366, 66),
      bnLogo(58, 450, 480),
      ...bnOffer(64, 1050, W - 128, s, 72),
      ...bnPrice(64, 1310, 150),
      rect({ name: "Fio", x: 640, y: 1314, width: 3, height: 180, fill: BN.yellow }),
      ...bnInfo(676, 1312, s),
      ...bnBand(W, H, 1540, s, 64),
    ])
  }

  if (format === "square") {
    const s = 0.86
    const PH = 650
    return doc(format, BN.black, [
      photo({ x: 0, y: 0, width: W, height: PH }),
      bnTopShade(W, 220),
      bnShade(W, 440, PH),
      ...tapes(42, 98, 56),
      bnLogo(50, 140, 330),
      ...bnOffer(56, 500, W - 112, s, 54),
      ...bnPrice(56, 690, 118),
      rect({ name: "Fio", x: 640, y: 694, width: 3, height: 150, fill: BN.yellow }),
      ...bnInfo(676, 692, s),
      ...bnBand(W, H, 900, s, 56),
    ])
  }

  // feed 4:5
  const s = 1
  const PH = 990
  return doc(format, BN.black, [
    photo({ x: 0, y: 0, width: W, height: PH }),
    bnTopShade(W, 240),
    bnShade(W, 760, PH),
    ...tapes(46, 110, 66),
    bnLogo(54, 160, 430),
    ...bnOffer(60, 796, W - 120, s, 66),
    ...bnPrice(60, 1004, 150),
    rect({ name: "Fio", x: 640, y: 1008, width: 3, height: 180, fill: BN.yellow }),
    ...bnInfo(676, 1006, s),
    ...bnBand(W, H, 1222, s, 60),
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
  { id: "black-november", name: "Black November", description: "Campanha: faixas de esquenta, foto em evidência, preço de varejo", swatch: ["#0A0A0C", "#FED400"], build: blackNovember },
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
