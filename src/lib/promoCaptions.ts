import { SITE_URL, PHONE_DISPLAY } from "@/lib/site"
import { getPriceNumber } from "@/lib/utils"
import { findDestination } from "@/lib/destinations"

/** Campos da promo usados nas legendas (formato da API: DESTINO, HOTEL...) */
export interface CaptionPromo {
  DESTINO: string
  HOTEL?: string | null
  DATA_FORMATADA?: string | null
  VALOR: string
  VALOR_ORIGINAL?: string | null
  PARCELAS?: string | number | null
  NUMERO_DE_NOITES?: string | null
  AEREO?: boolean
  COM_CAFE?: boolean
  MEIA_PENSAO?: boolean
  PENSAO_COMPLETA?: boolean
  ALL_INCLUSIVE?: boolean
  CG?: boolean
  SP?: boolean
  SITE_SLUG?: string | null
}

const brl = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const int = (n: number) => Math.round(n).toLocaleString("pt-BR")
const hashtag = (s: string) =>
  "#" +
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join("")

function parts(p: CaptionPromo) {
  const total = getPriceNumber(p.VALOR)
  const before = p.VALOR_ORIGINAL ? getPriceNumber(p.VALOR_ORIGINAL) : 0
  const parcelas = Number.parseInt(String(p.PARCELAS ?? "10"), 10) || 10
  const regime = p.ALL_INCLUSIVE ? "all inclusive" : p.PENSAO_COMPLETA ? "pensão completa" : p.MEIA_PENSAO ? "meia pensão" : p.COM_CAFE ? "café da manhã" : ""
  const inclui = [p.AEREO && "aéreo", "hotel", regime].filter(Boolean).join(" + ")
  const saida = p.CG && p.SP ? "Campo Grande ou São Paulo" : p.SP ? "São Paulo" : "Campo Grande"
  const destino = p.DESTINO.replace(/\s+-\s+.*$/, "")
  return {
    destino,
    total,
    parcelas,
    parcela: total ? brl(total / parcelas) : "",
    off: before > total && total > 0 ? Math.round((1 - total / before) * 100) : 0,
    inclui,
    saida,
    noites: p.NUMERO_DE_NOITES ? `${p.NUMERO_DE_NOITES} noites` : "",
    link: p.SITE_SLUG ? `${SITE_URL}/pacotes/${p.SITE_SLUG}` : SITE_URL,
  }
}

export interface CaptionOptions {
  /** Nome da campanha no topo da legenda (ex.: "Black November") */
  campaign?: string | null
  /** Instagram não deixa link clicável na legenda: manda para o link da bio */
  network?: "instagram" | "facebook"
}

/** Legenda de uma oferta para Instagram e Facebook */
export function captionFor(p: CaptionPromo, opts: CaptionOptions = {}): string {
  const x = parts(p)
  const head = opts.campaign ? `${opts.campaign.toUpperCase()} DONATTI 🖤💛\n\n` : ""
  const lines = [
    `✈️ ${x.destino.toUpperCase()}${x.off ? ` com ${x.off}% OFF` : ""}`,
    [p.HOTEL, x.noites].filter(Boolean).join(" · "),
    [p.DATA_FORMATADA, `saída de ${x.saida}`].filter(Boolean).join(" · "),
    "",
    x.parcela ? `💳 ${x.parcelas}x de R$ ${x.parcela} por pessoa (ou R$ ${int(x.total)})` : "",
    x.inclui ? `Inclui ${x.inclui}` : "",
    "",
    opts.network === "instagram"
      ? `👉 Garanta no WhatsApp ${PHONE_DISPLAY} ou pelo link na bio.`
      : `👉 Garanta no WhatsApp ${PHONE_DISPLAY}: ${x.link}`,
    "Tarifas por lote, sujeitas a disponibilidade.",
  ]
  const destTag = hashtag(findDestination(x.destino)?.name || x.destino)
  const tags = [opts.campaign && hashtag(opts.campaign), "#DonattiTurismo", destTag, "#PacoteDeViagem", "#SaindoDeCampoGrande"].filter(Boolean)
  return `${head}${lines.filter((l, i, a) => l !== "" || (a[i - 1] !== "" && i > 0)).join("\n").trim()}\n\n${tags.join(" ")}`
}

/** Mensagem única do Canal do WhatsApp com a lista de ofertas e o link de cada uma */
export function whatsappChannelMessage(promos: CaptionPromo[], opts: { campaign?: string | null; maxDiscount?: number } = {}): string {
  const title = opts.campaign
    ? `*${opts.campaign.toUpperCase()} DONATTI* 🖤💛${opts.maxDiscount ? `\nAté ${opts.maxDiscount}% OFF em pacotes com aéreo + hotel` : ""}`
    : "*OFERTAS DONATTI TURISMO* ✈️"
  const items = promos.map((p) => {
    const x = parts(p)
    return [
      `✈️ *${x.destino}*${x.off ? ` (-${x.off}%)` : ""}`,
      [p.HOTEL, x.noites, p.DATA_FORMATADA].filter(Boolean).join(" · "),
      x.parcela ? `💳 ${x.parcelas}x de R$ ${x.parcela} por pessoa` : "",
      `🔗 ${x.link}`,
    ]
      .filter(Boolean)
      .join("\n")
  })
  return [title, ...items, `Fale com a especialista: ${PHONE_DISPLAY}\nTarifas por lote, sujeitas a disponibilidade.`].join("\n\n")
}
