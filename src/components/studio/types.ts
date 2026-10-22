/** Documento do Studio: o que fica salvo em designs.data */

export type ArtFormat = "story" | "feed" | "square" | "landscape"

export const FORMATS: Record<ArtFormat, { label: string; hint: string; width: number; height: number }> = {
  story: { label: "Story", hint: "Instagram/WhatsApp 9:16", width: 1080, height: 1920 },
  feed: { label: "Feed", hint: "Instagram 4:5", width: 1080, height: 1350 },
  square: { label: "Quadrado", hint: "Feed e anúncios 1:1", width: 1080, height: 1080 },
  landscape: { label: "Paisagem", hint: "Facebook, Google, site 1.91:1", width: 1200, height: 628 },
}

export const FORMAT_ORDER: ArtFormat[] = ["story", "feed", "square", "landscape"]

interface LayerBase {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  locked?: boolean
  hidden?: boolean
  /** Some quando a variável não tem valor na promo (ex.: selo de desconto sem preço "de") */
  showIf?: string
}

export interface TextLayer extends LayerBase {
  type: "text"
  /** Pode conter variáveis: {DESTINO}, {VALOR_PARCELA}... */
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: string
  fontStyle?: "normal" | "italic"
  fill: string
  align: "left" | "center" | "right"
  lineHeight: number
  letterSpacing: number
  uppercase?: boolean
  stroke?: string
  strokeWidth?: number
  shadow?: boolean
  textDecoration?: "" | "line-through" | "underline"
  /** "shrink": diminui a fonte para caber em uma linha (nomes de destino longos) */
  fit?: "shrink"
}

export interface ImageLayer extends LayerBase {
  type: "image"
  src: string
  fit: "cover" | "contain" | "fill"
  cornerRadius: number
  /** "photo" = foto principal da promo (trocada ao escolher outra foto); "logo" = logo da marca */
  role?: "photo" | "logo"
  /** Recorte poligonal em coordenadas da arte (templates antigos) */
  clipPoints?: { x: number; y: number }[]
}

export interface ShapeLayer extends LayerBase {
  type: "rect" | "ellipse"
  fill: string
  stroke?: string
  strokeWidth?: number
  cornerRadius?: number
  /** Degradê vertical (de cima para baixo); se definido, substitui fill */
  gradient?: { from: string; to: string }
}

export type Layer = TextLayer | ImageLayer | ShapeLayer

export interface StudioDoc {
  version: 1
  format: ArtFormat
  width: number
  height: number
  background: string
  layers: Layer[]
}

export const newId = () => Math.random().toString(36).slice(2, 10)

export function emptyDoc(format: ArtFormat): StudioDoc {
  const { width, height } = FORMATS[format]
  return { version: 1, format, width, height, background: "#ffffff", layers: [] }
}

export const BRAND = {
  orange: "#F59E0B",
  orangeDeep: "#FF8C00",
  yellow: "#FED400",
  navy: "#1D3153",
  teal: "#337D9D",
  black: "#0B0B0F",
  white: "#FFFFFF",
  logoLight: "/assets/brand/donatti-logo-branco.png",
  logoDark: "/assets/brand/donatti-logo.png",
  whatsapp: "(67) 99216-7694",
}

export const BRAND_COLORS = [BRAND.orange, BRAND.orangeDeep, BRAND.yellow, BRAND.navy, BRAND.teal, BRAND.black, "#FFFFFF", "#16A34A", "#DC2626"]

export const FONTS = [
  { family: "Montserrat", weights: ["400", "600", "700", "800", "900"] },
  { family: "Poppins", weights: ["400", "600", "700", "800", "900"] },
  { family: "Inter", weights: ["400", "600", "700", "800", "900"] },
  { family: "Bebas Neue", weights: ["400"] },
  { family: "Anton", weights: ["400"] },
  { family: "Oswald", weights: ["400", "600", "700"] },
  { family: "Playfair Display", weights: ["400", "700", "900"] },
  { family: "Dancing Script", weights: ["400", "700"] },
  { family: "Lora", weights: ["400", "700"] },
]

export const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?" +
  FONTS.map((f) => `family=${f.family.replace(/ /g, "+")}:wght@${f.weights.join(";")}`).join("&") +
  "&display=swap"
