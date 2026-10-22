import { randomBytes } from "crypto"
import { promises as fs } from "fs"
import path from "path"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { createClient } from "@supabase/supabase-js"

/**
 * Armazenamento de imagens (uploads, artes exportadas, imagens geradas por IA).
 *
 * Ordem de escolha:
 * 1. S3, se AWS_S3_BUCKET estiver definido (URL pública via AWS_S3_PUBLIC_URL ou URL padrão do bucket)
 * 2. Supabase Storage, bucket "promo-images" (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 * 3. Disco local em public/uploads — só fora de produção, para desenvolvimento
 * 4. Sem nenhum dos anteriores: a imagem vai inline (data URL) no banco, como os
 *    templates sempre foram salvos. Funciona com as variáveis atuais de produção,
 *    mas pesa no banco; configure S3 ou Supabase quando puder.
 */

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}

export const ALLOWED_IMAGE_TYPES = Object.keys(EXT)
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_INLINE_BYTES = 3 * 1024 * 1024

let s3: S3Client | null = null

export function storageDriver(): "s3" | "supabase" | "local" | null {
  if (process.env.AWS_S3_BUCKET) return "s3"
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return "supabase"
  if (process.env.NODE_ENV !== "production") return "local"
  return null
}

/** Grava a imagem e devolve a URL pública. `folder` organiza por uso: "studio", "ai", "layouts"... */
export async function uploadImage(buffer: Buffer, contentType: string, folder: string, opts: { inline?: boolean } = {}): Promise<string> {
  const ext = EXT[contentType]
  if (!ext) throw new Error(`Tipo de imagem não suportado: ${contentType}`)
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error("Imagem maior que 10MB")

  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "")
  const key = `${safeFolder}/${new Date().toISOString().slice(0, 7)}/${Date.now()}-${randomBytes(5).toString("hex")}.${ext}`

  switch (storageDriver()) {
    case "s3": {
      const bucket = process.env.AWS_S3_BUCKET!
      const region = process.env.AWS_S3_REGION || process.env.AWS_REGION || "us-east-1"
      s3 ??= new S3Client({ region })
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      )
      const base = process.env.AWS_S3_PUBLIC_URL || `https://${bucket}.s3.${region}.amazonaws.com`
      return `${base.replace(/\/$/, "")}/${key}`
    }
    case "supabase": {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { error } = await supabase.storage.from("promo-images").upload(key, buffer, { contentType, upsert: false })
      if (error) throw new Error(`Upload falhou: ${error.message}`)
      return supabase.storage.from("promo-images").getPublicUrl(key).data.publicUrl
    }
    case "local": {
      const file = path.join(process.cwd(), "public", "uploads", key)
      await fs.mkdir(path.dirname(file), { recursive: true })
      await fs.writeFile(file, buffer)
      return `/uploads/${key}`
    }
    default:
      if (opts.inline === false) throw new Error("Nenhum armazenamento configurado (defina AWS_S3_BUCKET ou as chaves do Supabase)")
      if (buffer.length > MAX_INLINE_BYTES) throw new Error("Imagem maior que 3MB. Configure S3 ou Supabase para enviar imagens maiores.")
      return `data:${contentType};base64,${buffer.toString("base64")}`
  }
}

/** Converte "data:image/png;base64,..." em buffer + tipo */
export function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
  if (!match) throw new Error("Imagem inválida")
  return { contentType: match[1], buffer: Buffer.from(match[2], "base64") }
}

/** Detecta o tipo pelos primeiros bytes (não confia na extensão enviada) */
export function sniffImageType(buffer: Buffer): string | null {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png"
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg"
  if (buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return "image/webp"
  return null
}
