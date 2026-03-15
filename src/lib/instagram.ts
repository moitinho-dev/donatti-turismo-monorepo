import prisma from "@/lib/db"

const GRAPH_API_VERSION = "v19.0"
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

const SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_read_engagement",
  "pages_show_list",
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

// --- OAuth ---

export function buildConnectUrl() {
  const appId = process.env.META_APP_ID
  if (!appId) throw new Error("Missing META_APP_ID")

  const redirectUri = `${getBaseUrl()}/api/instagram/callback`
  const url = new URL(`https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth`)
  url.searchParams.set("client_id", appId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("scope", SCOPES)
  url.searchParams.set("response_type", "code")
  return url.toString()
}

export async function exchangeCodeForToken(code: string) {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) throw new Error("Missing META_APP_ID/META_APP_SECRET")

  const redirectUri = `${getBaseUrl()}/api/instagram/callback`
  const url = new URL(`${GRAPH_BASE}/oauth/access_token`)
  url.searchParams.set("client_id", appId)
  url.searchParams.set("client_secret", appSecret)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("code", code)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Token exchange failed ${res.status}: ${text}`)
  }
  return (await res.json()) as { access_token: string; token_type: string }
}

export async function exchangeLongLivedToken(shortLivedToken: string) {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) throw new Error("Missing META_APP_ID/META_APP_SECRET")

  const url = new URL(`${GRAPH_BASE}/oauth/access_token`)
  url.searchParams.set("grant_type", "fb_exchange_token")
  url.searchParams.set("client_id", appId)
  url.searchParams.set("client_secret", appSecret)
  url.searchParams.set("fb_exchange_token", shortLivedToken)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Long-lived token exchange failed ${res.status}: ${text}`)
  }
  return (await res.json()) as {
    access_token: string
    token_type: string
    expires_in: number
  }
}

// --- Instagram Account Discovery ---

export async function getInstagramAccountId(accessToken: string) {
  // Step 1: Get Facebook Pages the user manages
  const pagesRes = await fetch(
    `${GRAPH_BASE}/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`,
  )
  if (!pagesRes.ok) {
    const text = await pagesRes.text().catch(() => "")
    throw new Error(`Failed to fetch pages: ${pagesRes.status}: ${text}`)
  }
  const pagesData = (await pagesRes.json()) as {
    data: Array<{
      id: string
      name: string
      instagram_business_account?: { id: string }
    }>
  }

  // Find first page with an Instagram Business account
  const pageWithIg = pagesData.data.find((p) => p.instagram_business_account?.id)
  if (!pageWithIg || !pageWithIg.instagram_business_account) {
    throw new Error(
      "Nenhuma conta Instagram Business encontrada. Verifique se sua pagina do Facebook esta conectada a uma conta Instagram profissional.",
    )
  }

  return {
    igUserId: pageWithIg.instagram_business_account.id,
    pageName: pageWithIg.name,
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

export async function createMediaContainer(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  caption: string,
  mediaType: "FEED" | "STORIES",
) {
  const url = `${GRAPH_BASE}/${igUserId}/media`

  const params: Record<string, string> = {
    access_token: accessToken,
    image_url: imageUrl,
    caption,
  }
  if (mediaType === "STORIES") {
    params.media_type = "STORIES"
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
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
  const url = `${GRAPH_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Erro ao verificar status: ${res.status}: ${text}`)
  }
  const data = (await res.json()) as { status_code: string }
  return data.status_code
}

export async function publishMedia(
  igUserId: string,
  accessToken: string,
  containerId: string,
) {
  const url = `${GRAPH_BASE}/${igUserId}/media_publish`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
    if (status === "ERROR") throw new Error("Container com erro — imagem pode ser invalida")
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
