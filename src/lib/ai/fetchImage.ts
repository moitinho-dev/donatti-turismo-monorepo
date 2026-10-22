import { promises as fs } from "fs"
import path from "path"
import { parseDataUrl } from "@/lib/storage"

const MAX_BYTES = 15 * 1024 * 1024

/** Hosts de onde o servidor aceita baixar imagens (evita uso da rota para acessar endereços internos) */
function isAllowedHost(host: string) {
  const s3Public = process.env.AWS_S3_PUBLIC_URL ? new URL(process.env.AWS_S3_PUBLIC_URL).host : null
  return (
    host === "images.unsplash.com" ||
    host === "plus.unsplash.com" ||
    host.endsWith(".supabase.co") ||
    host.endsWith(".amazonaws.com") ||
    host.endsWith(".public.blob.vercel-storage.com") ||
    (s3Public !== null && host === s3Public)
  )
}

/** Carrega uma imagem vinda do Studio: data URL, arquivo local de /uploads (dev) ou URL de host permitido */
export async function loadImage(source: string): Promise<Buffer> {
  if (source.startsWith("data:")) return parseDataUrl(source).buffer

  if (source.startsWith("/uploads/")) {
    const file = path.join(process.cwd(), "public", path.normalize(source).replace(/^(\.\.[/\\])+/, ""))
    if (!file.startsWith(path.join(process.cwd(), "public", "uploads"))) throw new Error("Caminho inválido")
    return fs.readFile(file)
  }

  const url = new URL(source)
  if (url.protocol !== "https:" || !isAllowedHost(url.host)) throw new Error("Origem de imagem não permitida")
  const res = await fetch(url, { redirect: "error" })
  if (!res.ok) throw new Error(`Não foi possível baixar a imagem (${res.status})`)
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length > MAX_BYTES) throw new Error("Imagem grande demais")
  return buffer
}
