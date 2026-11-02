import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import prisma from "./db"
import { storageDriver, uploadImage } from "./storage"

/**
 * Meta pelo Login do Facebook para Empresas (META_LOGIN_CONFIG_ID, token de usuário do sistema).
 * Uma conexão publica na Página do Facebook e no Instagram profissional ligado a ela.
 *
 * Variáveis: META_APP_ID, META_APP_SECRET, META_LOGIN_CONFIG_ID e NEXT_PUBLIC_APP_URL (a URL de retorno
 * {APP_URL}/api/meta/callback precisa estar cadastrada no app).
 */

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v23.0"
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`

export const appBaseUrl = () => {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000"
  return (fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`).replace(/\/$/, "")
}
export const metaRedirectUri = () => `${appBaseUrl()}/api/meta/callback`

export const isMetaConfigured = () => !!(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_LOGIN_CONFIG_ID)

// ---------------------------------------------------------------------------
// OAuth: state assinado (evita que outra pessoa conecte a conta dela no lugar da Donatti)
// ---------------------------------------------------------------------------

const stateSecret = () => process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.META_APP_SECRET || ""

export function signState(userEmail: string) {
  const payload = `${Date.now()}.${randomBytes(8).toString("hex")}.${Buffer.from(userEmail).toString("base64url")}`
  const sig = createHmac("sha256", stateSecret()).update(payload).digest("base64url")
  return `${payload}.${sig}`
}

/** Valida o state (assinatura e validade de 15 min) e devolve o e-mail de quem iniciou */
export function verifyState(state: string | null): string | null {
  if (!state) return null
  const i = state.lastIndexOf(".")
  const payload = state.slice(0, i)
  const sig = Buffer.from(state.slice(i + 1))
  const expected = Buffer.from(createHmac("sha256", stateSecret()).update(payload).digest("base64url"))
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null
  const [ts, , email] = payload.split(".")
  if (Date.now() - Number(ts) > 15 * 60_000) return null
  return Buffer.from(email, "base64url").toString()
}

export function metaAuthUrl(state: string) {
  const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`)
  url.searchParams.set("client_id", process.env.META_APP_ID!)
  url.searchParams.set("config_id", process.env.META_LOGIN_CONFIG_ID!)
  url.searchParams.set("redirect_uri", metaRedirectUri())
  url.searchParams.set("response_type", "code")
  url.searchParams.set("override_default_response_type", "true")
  url.searchParams.set("state", state)
  return url.toString()
}

// ---------------------------------------------------------------------------
// Chamadas à Graph API
// ---------------------------------------------------------------------------

export class MetaError extends Error {
  constructor(
    message: string,
    public code?: number,
  ) {
    super(message)
  }
}

async function graph<T>(path: string, init: { method?: "GET" | "POST" | "DELETE"; params?: Record<string, string | number | boolean | undefined> } = {}): Promise<T> {
  const method = init.method || "GET"
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(init.params || {})) if (v !== undefined) params.set(k, String(v))
  const url = `${GRAPH}${path}${method === "GET" ? `?${params}` : ""}`
  const res = await fetch(url, {
    method,
    ...(method === "GET" ? {} : { headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params }),
    cache: "no-store",
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string; error_user_msg?: string; code?: number } }
  if (!res.ok || data.error) {
    const e = data.error
    throw new MetaError(e?.error_user_msg || e?.message || `Meta respondeu ${res.status}`, e?.code)
  }
  return data
}

export async function exchangeCode(code: string) {
  return graph<{ access_token: string; expires_in?: number }>("/oauth/access_token", {
    params: { client_id: process.env.META_APP_ID, client_secret: process.env.META_APP_SECRET, redirect_uri: metaRedirectUri(), code },
  })
}

export interface MetaPage {
  id: string
  name: string
  access_token: string
  instagram_business_account?: { id: string; username?: string; profile_picture_url?: string }
}

export async function listPages(accessToken: string): Promise<MetaPage[]> {
  const res = await graph<{ data: MetaPage[] }>("/me/accounts", {
    params: { access_token: accessToken, fields: "id,name,access_token,instagram_business_account{id,username,profile_picture_url}", limit: 50 },
  })
  return res.data || []
}

// ---------------------------------------------------------------------------
// Conexão salva (uma para o sistema todo)
// ---------------------------------------------------------------------------

export const getMetaConnection = () => prisma.metaConnection.findFirst({ orderBy: { updatedAt: "desc" } })

export async function saveMetaConnection(accessToken: string, expiresIn: number | undefined, connectedBy: string, page: MetaPage | null) {
  const data = {
    accessToken,
    tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
    connectedBy,
    pageId: page?.id ?? null,
    pageName: page?.name ?? null,
    pageAccessToken: page?.access_token ?? null,
    igUserId: page?.instagram_business_account?.id ?? null,
    igUsername: page?.instagram_business_account?.username ?? null,
  }
  const existing = await getMetaConnection()
  return existing ? prisma.metaConnection.update({ where: { id: existing.id }, data }) : prisma.metaConnection.create({ data })
}

export async function selectPage(pageId: string) {
  const conn = await getMetaConnection()
  if (!conn) throw new MetaError("Meta não conectada")
  const page = (await listPages(conn.accessToken)).find((p) => p.id === pageId)
  if (!page) throw new MetaError("Página não encontrada nesta conexão")
  return saveMetaConnection(conn.accessToken, undefined, conn.connectedBy || "", page)
}

// ---------------------------------------------------------------------------
// Imagens: a Meta baixa por URL pública
// ---------------------------------------------------------------------------

/** Sobe a imagem (data URL ou URL) e devolve uma URL pública que a Meta consegue baixar */
export async function publicImageUrl(image: string): Promise<string> {
  if (/^https:\/\//.test(image)) return image
  const match = /^data:(image\/(?:jpeg|png));base64,(.+)$/.exec(image)
  if (!match) throw new MetaError("Imagem inválida")
  const buffer = Buffer.from(match[2], "base64")
  const driver = storageDriver()
  if (driver === "s3" || driver === "supabase") return uploadImage(buffer, match[1], "social", { inline: false })
  // Sem S3/Supabase: guarda no banco e serve por /api/media/[id]
  const media = await prisma.publishedMedia.create({ data: { contentType: match[1], data: buffer } })
  // Limpa o que a Meta já baixou há mais de uma semana
  void prisma.publishedMedia.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 7 * 86_400_000) } } }).catch(() => undefined)
  return `${appBaseUrl()}/api/media/${media.id}`
}

// ---------------------------------------------------------------------------
// Facebook (Página)
// ---------------------------------------------------------------------------

export interface PublishOptions {
  images: string[]
  caption?: string
  /** Data futura (10 min a 30 dias): agenda no Facebook */
  scheduledAt?: Date | null
}

const unix = (d: Date) => Math.floor(d.getTime() / 1000)

export async function publishFacebookPost(pageId: string, pageToken: string, { images, caption, scheduledAt }: PublishOptions) {
  const schedule = scheduledAt ? { published: false, scheduled_publish_time: unix(scheduledAt) } : {}
  if (images.length === 1) {
    const res = await graph<{ id: string; post_id?: string }>(`/${pageId}/photos`, {
      method: "POST",
      params: { access_token: pageToken, url: images[0], caption, ...schedule },
    })
    return { id: res.post_id || res.id }
  }
  // Álbum: sobe as fotos sem publicar e cria um post com todas
  const ids: string[] = []
  for (const url of images) {
    const photo = await graph<{ id: string }>(`/${pageId}/photos`, { method: "POST", params: { access_token: pageToken, url, published: false, temporary: !!scheduledAt } })
    ids.push(photo.id)
  }
  const params: Record<string, string | number | boolean | undefined> = { access_token: pageToken, message: caption, ...schedule }
  ids.forEach((id, i) => (params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id })))
  return graph<{ id: string }>(`/${pageId}/feed`, { method: "POST", params })
}

export async function publishFacebookStory(pageId: string, pageToken: string, image: string) {
  const photo = await graph<{ id: string }>(`/${pageId}/photos`, { method: "POST", params: { access_token: pageToken, url: image, published: false } })
  return graph<{ post_id?: string; id?: string }>(`/${pageId}/photo_stories`, { method: "POST", params: { access_token: pageToken, photo_id: photo.id } })
}

// ---------------------------------------------------------------------------
// Instagram (conta profissional ligada à Página)
// ---------------------------------------------------------------------------

async function waitContainer(id: string, token: string) {
  for (let i = 0; i < 20; i++) {
    const s = await graph<{ status_code?: string }>(`/${id}`, { params: { access_token: token, fields: "status_code" } })
    if (s.status_code === "FINISHED") return
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new MetaError("O Instagram não conseguiu processar a imagem")
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new MetaError("O Instagram demorou para processar a imagem. Tente de novo.")
}

async function igPublish(igUserId: string, token: string, creationId: string) {
  await waitContainer(creationId, token)
  return graph<{ id: string }>(`/${igUserId}/media_publish`, { method: "POST", params: { access_token: token, creation_id: creationId } })
}

/** Uma imagem = post; 2 a 10 = carrossel. Legenda vale para o post inteiro. */
export async function publishInstagramPost(igUserId: string, token: string, { images, caption }: PublishOptions) {
  if (images.length === 1) {
    const c = await graph<{ id: string }>(`/${igUserId}/media`, { method: "POST", params: { access_token: token, image_url: images[0], caption } })
    return igPublish(igUserId, token, c.id)
  }
  if (images.length > 10) throw new MetaError("Carrossel do Instagram aceita no máximo 10 imagens")
  const children: string[] = []
  for (const url of images) {
    const c = await graph<{ id: string }>(`/${igUserId}/media`, { method: "POST", params: { access_token: token, image_url: url, is_carousel_item: true } })
    children.push(c.id)
  }
  for (const id of children) await waitContainer(id, token)
  const carousel = await graph<{ id: string }>(`/${igUserId}/media`, {
    method: "POST",
    params: { access_token: token, media_type: "CAROUSEL", children: children.join(","), caption },
  })
  return igPublish(igUserId, token, carousel.id)
}

export async function publishInstagramStory(igUserId: string, token: string, image: string) {
  const c = await graph<{ id: string }>(`/${igUserId}/media`, { method: "POST", params: { access_token: token, image_url: image, media_type: "STORIES" } })
  return igPublish(igUserId, token, c.id)
}
