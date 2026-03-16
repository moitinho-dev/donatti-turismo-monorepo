import prisma from "@/lib/db"

// Instagram API with Instagram Login (NOT Facebook Login)
// Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/

const GRAPH_API_VERSION = "v21.0"
const GRAPH_BASE = `https://graph.instagram.com/${GRAPH_API_VERSION}`

// Scopes for Instagram Login (business content publishing)
const SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
  "instagram_business_manage_comments",
].join(",")

const getBaseUrl = () => {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000"
  const normalized = fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`
  return normalized.replace(/\/$/, "")
}

// --- OAuth (Instagram Login flow) ---

export function buildConnectUrl() {
  const appId = process.env.META_APP_ID
  if (!appId) throw new Error("Missing META_APP_ID")

  const redirectUri = `${getBaseUrl()}/api/instagram/callback`

  // Instagram Login uses api.instagram.com for OAuth
  const url = new URL("https://api.instagram.com/oauth/authorize")
  url.searchParams.set("client_id", appId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("scope", SCOPES)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("enable_fb_login", "0")
  url.searchParams.set("force_authentication", "1")
  return url.toString()
}

export async function exchangeCodeForToken(code: string) {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) throw new Error("Missing META_APP_ID/META_APP_SECRET")

  const redirectUri = `${getBaseUrl()}/api/instagram/callback`

  // Instagram Login token exchange uses graph.instagram.com
  const res = await fetch(`${GRAPH_BASE}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Token exchange failed ${res.status}: ${text}`)
  }

  return (await res.json()) as {
    access_token: string
    user_id: number
    permissions: string[]
  }
}

export async function exchangeLongLivedToken(shortLivedToken: string) {
  const appSecret = process.env.META_APP_SECRET
  if (!appSecret) throw new Error("Missing META_APP_SECRET")

  const url = new URL(`${GRAPH_BASE}/access_token`)
  url.searchParams.set("grant_type", "ig_exchange_token")
  url.searchParams.set("client_secret", appSecret)
  url.searchParams.set("access_token", shortLivedToken)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Long-lived token exchange failed ${res.status}: ${text}`)
  }

  return (await res.json()) as {
    access_token: string
    token_type: string
    expires_in: number // 60 days in seconds
  }
}

export async function refreshLongLivedToken(token: string) {
  const url = new URL(`${GRAPH_BASE}/refresh_access_token`)
  url.searchParams.set("grant_type", "ig_refresh_token")
  url.searchParams.set("access_token", token)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Token refresh failed ${res.status}: ${text}`)
  }

  return (await res.json()) as {
    access_token: string
    token_type: string
    expires_in: number
  }
}

// --- Instagram Account Info ---

export async function getInstagramUserInfo(accessToken: string, userId: string) {
  const res = await fetch(
    `${GRAPH_BASE}/${userId}?fields=user_id,username,name,profile_picture_url&access_token=${accessToken}`,
  )
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Failed to fetch user info: ${res.status}: ${text}`)
  }

  return (await res.json()) as {
    user_id: string
    username: string
    name?: string
    profile_picture_url?: string
  }
}

// --- DB Connection ---

export async function upsertConnection(data: {
  accessToken: string
  igUserId: string
  pageName: string | null
  tokenExpiresAt: Date | null
}) {
  const existing = await prisma.instagramConnection.findFirst()
  if (existing) {
    return prisma.instagramConnection.update({
      where: { id: existing.id },
      data,
    })
  }
  return prisma.instagramConnection.create({ data })
}

export async function getConnection() {
  return prisma.instagramConnection.findFirst()
}

// --- Content Publishing ---
// Uses graph.instagram.com for Instagram Login apps

export async function createMediaContainer(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  caption: string,
  mediaType: "FEED" | "STORIES",
) {
  const url = `${GRAPH_BASE}/${igUserId}/media`

  const params = new URLSearchParams({
    access_token: accessToken,
    image_url: imageUrl,
  })

  if (mediaType === "STORIES") {
    params.set("media_type", "STORIES")
  } else {
    // Feed posts support captions
    params.set("caption", caption)
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Erro ao criar container: ${res.status}: ${text}`)
  }
  return (await res.json()) as { id: string }
}

export async function checkContainerStatus(
  accessToken: string,
  containerId: string,
): Promise<string> {
  const url = `${GRAPH_BASE}/${containerId}?fields=status_code,status&access_token=${accessToken}`
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Erro ao verificar status: ${res.status}: ${text}`)
  }
  const data = (await res.json()) as { status_code?: string; status?: string }
  return data.status_code || data.status || "IN_PROGRESS"
}

export async function publishMedia(
  igUserId: string,
  accessToken: string,
  containerId: string,
) {
  const url = `${GRAPH_BASE}/${igUserId}/media_publish`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Erro ao publicar: ${res.status}: ${text}`)
  }
  return (await res.json()) as { id: string }
}

async function waitForContainer(accessToken: string, containerId: string, maxWaitMs = 30000) {
  const interval = 2000
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const status = await checkContainerStatus(accessToken, containerId)
    if (status === "FINISHED") return
    if (status === "ERROR") throw new Error("Container com erro — imagem pode ser invalida ou URL inacessivel")
    await new Promise((r) => setTimeout(r, interval))
  }
  throw new Error("Timeout aguardando processamento da imagem pelo Instagram")
}

export async function publishToInstagram(
  imageUrl: string,
  caption: string,
  mediaType: "FEED" | "STORIES",
  promoId?: string,
) {
  const connection = await getConnection()
  if (!connection?.accessToken || !connection?.igUserId) {
    throw new Error("Instagram nao conectado")
  }

  // Check token expiry
  if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
    throw new Error("Token do Instagram expirado. Reconecte a conta.")
  }

  const { accessToken, igUserId } = connection

  // Step 1: Create container
  const container = await createMediaContainer(igUserId, accessToken, imageUrl, caption, mediaType)

  // Step 2: Wait for processing
  await waitForContainer(accessToken, container.id)

  // Step 3: Publish
  const published = await publishMedia(igUserId, accessToken, container.id)

  // Step 4: Track on promo if provided
  if (promoId && published.id) {
    await prisma.promo.update({
      where: { id: promoId },
      data: { instagramPostId: published.id },
    }).catch(() => {
      // Non-critical — don't fail the publish
    })
  }

  return published
}
