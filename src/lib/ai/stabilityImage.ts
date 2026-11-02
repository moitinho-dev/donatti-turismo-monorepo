import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"
import sharp from "sharp"
import { AiContentFilteredError, AiNotConfiguredError, aiConfig, isAiConfigured } from "./config"

/**
 * Geração e edição de imagens com os modelos da Stability AI no Bedrock.
 * - Gerar: Stable Image Core (ou Ultra / SD3.5 Large) por `aspect_ratio`
 * - Estender: Stable Outpaint (pixels a acrescentar em cada lado)
 * - Remover fundo: Stable Image Remove Background
 * - Editar área descrita em texto: Stable Image Search and Replace (`search_prompt` + `prompt`, sem máscara)
 * Respostas: { images: [base64], finish_reasons: [null | "Filter reason: ..."], seeds: [...] }
 */

export type ArtFormat = "story" | "feed" | "square" | "landscape"

/** Tamanho final das artes em cada formato (usado na extensão de foto) */
export const FORMAT_SIZES: Record<ArtFormat, { width: number; height: number }> = {
  story: { width: 720, height: 1280 }, // 9:16
  feed: { width: 1024, height: 1280 }, // 4:5
  square: { width: 1024, height: 1024 },
  landscape: { width: 1216, height: 640 }, // ~1.91:1
}

/** Proporção suportada pelo Core/Ultra mais próxima de cada formato */
export const ASPECT_RATIOS: Record<ArtFormat, string> = {
  story: "9:16",
  feed: "4:5",
  square: "1:1",
  landscape: "16:9",
}

// Evita que o modelo invente textos, logos e marcas d'água na foto
const DEFAULT_NEGATIVE = "text, letters, watermark, logo, signature, blurry, distorted, low quality"
const MAX_PROMPT = 10_000
// Edições aceitam até ~9,4 MP; 4 MP mantém o envio leve e rápido
const MAX_INPUT_PIXELS = 4_000_000
const MAX_OUTPAINT_SIDE = 2000

const clients = new Map<string, BedrockRuntimeClient>()

function getClient(region: string) {
  if (!isAiConfigured()) throw new AiNotConfiguredError()
  let client = clients.get(region)
  if (!client) {
    // Geração pode passar de 60 s; a AWS recomenda até 5 min
    client = // A função da Vercel tem 60 s: uma tentativa só e no máximo 50 s por chamada
    client = new BedrockRuntimeClient({ region, maxAttempts: 1, requestHandler: { requestTimeout: 50_000 } })
    clients.set(region, client)
  }
  return client
}

/** Lê a resposta da Stability e devolve as imagens; filtro de conteúdo vira AiContentFilteredError */
export function parseStabilityResponse(body: Uint8Array | string): Buffer[] {
  const text = typeof body === "string" ? body : new TextDecoder().decode(body)
  const payload = JSON.parse(text) as { images?: string[]; finish_reasons?: (string | null)[]; message?: string }
  const filtered = (payload.finish_reasons || []).find((r) => typeof r === "string" && /filter/i.test(r))
  if (filtered) throw new AiContentFilteredError(filtered)
  const images = (payload.images || []).filter(Boolean)
  if (!images.length) {
    const reason = (payload.finish_reasons || []).find(Boolean) || payload.message
    throw new Error(reason ? `A IA não gerou imagem: ${reason}` : "A IA não gerou imagem")
  }
  return images.map((b64) => Buffer.from(b64, "base64"))
}

async function invoke(modelId: string, region: string, body: Record<string, unknown>): Promise<Buffer[]> {
  const response = await getClient(region).send(
    new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(body),
    }),
  )
  return parseStabilityResponse(response.body)
}

/** PNG aceito pelos modelos de edição, reduzido se passar do limite de pixels */
async function toModelInput(image: Buffer) {
  const img = sharp(image).rotate()
  const meta = await img.metadata()
  const pixels = (meta.width || 0) * (meta.height || 0)
  const scale = pixels > MAX_INPUT_PIXELS ? Math.sqrt(MAX_INPUT_PIXELS / pixels) : 1
  return img
    .resize(Math.round((meta.width || 1024) * scale))
    .png()
    .toBuffer()
}

export function buildGenerateBody(prompt: string, format: ArtFormat, negative?: string) {
  return {
    prompt: prompt.slice(0, MAX_PROMPT),
    negative_prompt: (negative || DEFAULT_NEGATIVE).slice(0, MAX_PROMPT),
    aspect_ratio: ASPECT_RATIOS[format],
    output_format: "png",
  }
}

/** Cada chamada do Core/Ultra devolve 1 imagem; para N opções, N chamadas em paralelo */
export async function generateImage(prompt: string, format: ArtFormat, opts: { count?: number; negative?: string } = {}) {
  const count = Math.min(Math.max(opts.count ?? 2, 1), 4)
  const body = buildGenerateBody(prompt, format, opts.negative)
  const results = await Promise.allSettled(
    Array.from({ length: count }, () => invoke(aiConfig.imageModel, aiConfig.imageRegion, body)),
  )
  const images = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []))
  if (!images.length) throw (results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason
  return images
}

/**
 * Quantos pixels acrescentar em cada lado para uma imagem w×h chegar à proporção do formato,
 * com a foto inteira no centro (sem cortar). Cada lado fica limitado ao máximo do modelo.
 */
export function outpaintExtents(w: number, h: number, format: ArtFormat) {
  const target = FORMAT_SIZES[format].width / FORMAT_SIZES[format].height
  let left = 0
  let right = 0
  let up = 0
  let down = 0
  if (w / h < target) {
    const extra = Math.round(h * target) - w
    left = Math.min(Math.floor(extra / 2), MAX_OUTPAINT_SIDE)
    right = Math.min(extra - Math.floor(extra / 2), MAX_OUTPAINT_SIDE)
  } else {
    const extra = Math.round(w / target) - h
    up = Math.min(Math.floor(extra / 2), MAX_OUTPAINT_SIDE)
    down = Math.min(extra - Math.floor(extra / 2), MAX_OUTPAINT_SIDE)
  }
  return { left, right, up, down }
}

/**
 * Estende a foto para outro formato (ex.: horizontal -> story) sem cortar:
 * a foto fica inteira no centro e o modelo preenche as bordas que faltam.
 */
export async function extendToFormat(image: Buffer, format: ArtFormat, prompt?: string) {
  const { width, height } = FORMAT_SIZES[format]
  const target = width / height
  const source = sharp(await toModelInput(image))
  const meta = await source.metadata()
  let w = meta.width || width
  let h = meta.height || height
  // Reduz a foto para que a tela final (foto + bordas) caiba no limite de pixels
  const finalPixels = w / h < target ? h * Math.round(h * target) : w * Math.round(w / target)
  const scale = finalPixels > MAX_INPUT_PIXELS ? Math.sqrt(MAX_INPUT_PIXELS / finalPixels) : 1
  w = Math.max(64, Math.round(w * scale))
  h = Math.max(64, Math.round(h * scale))
  const input = await source.resize(w, h).png().toBuffer()

  const extents = outpaintExtents(w, h, format)
  if (!extents.left && !extents.right && !extents.up && !extents.down) return [input]

  const [result] = await invoke(aiConfig.outpaintModel, aiConfig.editRegion, {
    image: input.toString("base64"),
    ...extents,
    prompt: (prompt || "continue the scene naturally, same lighting and colors, photorealistic").slice(0, MAX_PROMPT),
    output_format: "png",
  })
  // Garante a proporção exata do formato (o limite por lado pode deixar um resto)
  return [await sharp(result).resize(width, height, { fit: "cover" }).png().toBuffer()]
}

/** Remove o fundo (PNG com transparência), útil para recortar pessoas, malas, ícones */
export async function removeBackground(image: Buffer) {
  return invoke(aiConfig.removeBackgroundModel, aiConfig.editRegion, {
    image: (await toModelInput(image)).toString("base64"),
    output_format: "png",
  })
}

export function buildSearchReplaceBody(imageB64: string, target: string, prompt?: string) {
  return {
    image: imageB64,
    search_prompt: target.slice(0, MAX_PROMPT),
    // Sem pedido de troca, o modelo apaga o objeto preenchendo com o entorno
    prompt: (prompt?.trim() || "empty background, seamless continuation of the surroundings, nothing in this area").slice(0, MAX_PROMPT),
    negative_prompt: DEFAULT_NEGATIVE,
    output_format: "png",
  }
}

/**
 * Edita uma parte da foto descrita em texto: `target` diz o que mudar ("o céu", "as pessoas na areia")
 * e `prompt` o que colocar no lugar ("céu azul limpo"). Prompt vazio remove o objeto.
 */
export async function editArea(image: Buffer, target: string, prompt?: string) {
  const input = (await toModelInput(image)).toString("base64")
  return invoke(aiConfig.searchReplaceModel, aiConfig.editRegion, buildSearchReplaceBody(input, target, prompt))
}
