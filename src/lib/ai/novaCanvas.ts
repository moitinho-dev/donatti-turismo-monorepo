import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"
import sharp from "sharp"
import { AiNotConfiguredError, aiConfig, isAiConfigured } from "./config"

/**
 * Geração e edição de imagens com Amazon Nova Canvas (Bedrock).
 * Formato de requisição: https://docs.aws.amazon.com/nova/latest/userguide/image-gen-req-resp-structure.html
 */

export type ArtFormat = "story" | "feed" | "square" | "landscape"

// Lados múltiplos de 16 e até ~4,2 MP, como o Nova Canvas exige; proporção igual à da arte
export const NOVA_SIZES: Record<ArtFormat, { width: number; height: number }> = {
  story: { width: 720, height: 1280 }, // 9:16
  feed: { width: 1024, height: 1280 }, // 4:5
  square: { width: 1024, height: 1024 },
  landscape: { width: 1216, height: 640 }, // ~1.91:1
}

// Evita que o modelo invente textos, logos e marcas d'água na foto
const DEFAULT_NEGATIVE = "text, letters, watermark, logo, signature, blurry, distorted, low quality"

let client: BedrockRuntimeClient | null = null

function getClient() {
  if (!isAiConfigured()) throw new AiNotConfiguredError()
  client ??= new BedrockRuntimeClient({
    region: aiConfig.novaRegion,
    // Geração pode passar de 60 s; a AWS recomenda até 5 min
    requestHandler: { requestTimeout: 300_000 },
  })
  return client
}

async function invoke(body: Record<string, unknown>): Promise<Buffer[]> {
  const response = await getClient().send(
    new InvokeModelCommand({
      modelId: aiConfig.novaModel,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(body),
    }),
  )
  const payload = JSON.parse(new TextDecoder().decode(response.body)) as { images?: string[]; error?: string }
  if (!payload.images?.length) {
    throw new Error(payload.error ? `Imagem bloqueada pela moderação da AWS: ${payload.error}` : "A IA não gerou imagem")
  }
  return payload.images.map((b64) => Buffer.from(b64, "base64"))
}

/** PNG/JPEG aceito pelo modelo, reduzido se passar do limite de pixels */
async function toModelInput(image: Buffer) {
  const img = sharp(image).rotate()
  const meta = await img.metadata()
  const pixels = (meta.width || 0) * (meta.height || 0)
  const scale = pixels > 4_000_000 ? Math.sqrt(4_000_000 / pixels) : 1
  return img
    .resize(Math.round((meta.width || 1024) * scale))
    .png()
    .toBuffer()
}

export async function generateImage(prompt: string, format: ArtFormat, opts: { count?: number; negative?: string } = {}) {
  return invoke({
    taskType: "TEXT_IMAGE",
    textToImageParams: {
      text: prompt.slice(0, 1024),
      negativeText: (opts.negative || DEFAULT_NEGATIVE).slice(0, 1024),
      style: "PHOTOREALISM",
    },
    imageGenerationConfig: {
      ...NOVA_SIZES[format],
      quality: "premium",
      cfgScale: 6.5,
      numberOfImages: Math.min(Math.max(opts.count ?? 2, 1), 4),
    },
  })
}

/**
 * Estende a foto para outro formato (ex.: horizontal -> story) sem cortar:
 * a foto vai inteira para o centro de uma tela no formato novo e o modelo preenche as bordas.
 */
export async function extendToFormat(image: Buffer, format: ArtFormat, prompt?: string) {
  const { width, height } = NOVA_SIZES[format]
  const source = sharp(await toModelInput(image))
  const meta = await source.metadata()
  const scale = Math.min(width / (meta.width || width), height / (meta.height || height))
  const w = Math.round((meta.width || width) * scale)
  const h = Math.round((meta.height || height) * scale)
  const left = Math.round((width - w) / 2)
  const top = Math.round((height - h) / 2)
  const resized = await source.resize(w, h).png().toBuffer()

  const canvas = await sharp({ create: { width, height, channels: 3, background: "#808080" } })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer()

  // Na extensão (outpainting) a máscara marca o que PRESERVAR: foto original em preto, bordas novas em branco.
  // É o inverso da edição de área (inpainting), como a documentação do Nova Canvas descreve.
  const keep = await sharp({ create: { width: w, height: h, channels: 3, background: "#000000" } }).png().toBuffer()
  const mask = await sharp({ create: { width, height, channels: 3, background: "#ffffff" } })
    .composite([{ input: keep, left, top }])
    .png()
    .toBuffer()

  return invoke({
    taskType: "OUTPAINTING",
    outPaintingParams: {
      image: canvas.toString("base64"),
      maskImage: mask.toString("base64"),
      outPaintingMode: "DEFAULT",
      text: (prompt || "continue the scene naturally, same lighting and colors, photorealistic").slice(0, 1024),
      negativeText: DEFAULT_NEGATIVE,
    },
    imageGenerationConfig: { numberOfImages: 1, quality: "premium", cfgScale: 6.5 },
  })
}

/** Remove o fundo (PNG com transparência), útil para recortar pessoas, malas, ícones */
export async function removeBackground(image: Buffer) {
  return invoke({
    taskType: "BACKGROUND_REMOVAL",
    backgroundRemovalParams: { image: (await toModelInput(image)).toString("base64") },
  })
}

/**
 * Edita uma parte da foto descrita em texto: `target` diz o que mudar ("o céu", "as pessoas na areia")
 * e `prompt` o que colocar no lugar ("céu azul limpo"). Prompt vazio remove o objeto.
 */
export async function editArea(image: Buffer, target: string, prompt?: string) {
  return invoke({
    taskType: "INPAINTING",
    inPaintingParams: {
      image: (await toModelInput(image)).toString("base64"),
      maskPrompt: target.slice(0, 1024),
      ...(prompt ? { text: prompt.slice(0, 1024) } : {}),
      negativeText: DEFAULT_NEGATIVE,
    },
    imageGenerationConfig: { numberOfImages: 1, quality: "premium", cfgScale: 6.5 },
  })
}
