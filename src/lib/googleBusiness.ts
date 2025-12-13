import prisma from "@/lib/db"

const BUSINESS_MANAGE_SCOPE = "https://www.googleapis.com/auth/business.manage"

type GoogleAccount = {
  name: string
  accountName?: string
  type?: string
}

type GoogleLocation = {
  name: string
  title?: string
  storefrontAddress?: unknown
}

const getBaseUrl = () => {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000"
  const normalized = fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`
  return normalized.replace(/\/$/, "")
}

export const buildConnectUrl = () => {
  const clientId = process.env.GOOGLE_ID_CLIENT
  if (!clientId) throw new Error("Missing GOOGLE_ID_CLIENT")

  const redirectUri = `${getBaseUrl()}/api/google-business/callback`
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("access_type", "offline")
  url.searchParams.set("prompt", "consent")
  url.searchParams.set("include_granted_scopes", "true")
  url.searchParams.set("scope", BUSINESS_MANAGE_SCOPE)
  return url.toString()
}

export const upsertRefreshToken = async (refreshToken: string) => {
  const existing = await prisma.googleBusinessConnection.findFirst()
  if (existing) {
    return prisma.googleBusinessConnection.update({
      where: { id: existing.id },
      data: { refreshToken },
    })
  }
  return prisma.googleBusinessConnection.create({
    data: { refreshToken },
  })
}

export const saveBusinessTarget = async (accountName: string, locationName: string) => {
  const existing = await prisma.googleBusinessConnection.findFirst()
  if (!existing) throw new Error("Google Business not connected")
  return prisma.googleBusinessConnection.update({
    where: { id: existing.id },
    data: { accountName, locationName },
  })
}

export const getBusinessConnection = async () => prisma.googleBusinessConnection.findFirst()

export const exchangeCodeForTokens = async (code: string) => {
  const clientId = process.env.GOOGLE_ID_CLIENT
  const clientSecret = process.env.GOOGLE_ID_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_ID_CLIENT/GOOGLE_ID_CLIENT_SECRET")
  }

  const redirectUri = `${getBaseUrl()}/api/google-business/callback`
  const body = new URLSearchParams()
  body.set("code", code)
  body.set("client_id", clientId)
  body.set("client_secret", clientSecret)
  body.set("redirect_uri", redirectUri)
  body.set("grant_type", "authorization_code")

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Token exchange failed ${res.status}: ${text}`)
  }
  return (await res.json()) as {
    access_token?: string
    expires_in?: number
    refresh_token?: string
    scope?: string
    token_type?: string
    id_token?: string
  }
}

const refreshAccessToken = async (refreshToken: string) => {
  const clientId = process.env.GOOGLE_ID_CLIENT
  const clientSecret = process.env.GOOGLE_ID_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_ID_CLIENT/GOOGLE_ID_CLIENT_SECRET")
  }

  const body = new URLSearchParams()
  body.set("client_id", clientId)
  body.set("client_secret", clientSecret)
  body.set("refresh_token", refreshToken)
  body.set("grant_type", "refresh_token")

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Refresh token failed ${res.status}: ${text}`)
  }
  return (await res.json()) as { access_token?: string; expires_in?: number; token_type?: string; scope?: string }
}

const getAccessToken = async () => {
  const connection = await prisma.googleBusinessConnection.findFirst()
  if (!connection?.refreshToken) throw new Error("Google Business not connected")
  const result = await refreshAccessToken(connection.refreshToken)
  const token = result.access_token
  if (!token) throw new Error("Failed to refresh access token")
  return { token, connection }
}

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init)
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Google API error ${res.status}: ${text}`)
  }
  return (await res.json()) as T
}

export const listAccounts = async () => {
  const { token } = await getAccessToken()
  const data = await fetchJson<{ accounts?: GoogleAccount[] }>(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )
  return data.accounts || []
}

export const listLocations = async (accountName: string) => {
  const { token } = await getAccessToken()
  const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`)
  url.searchParams.set("readMask", "name,title")
  const data = await fetchJson<{ locations?: GoogleLocation[] }>(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data.locations || []
}

const extractIdsForV4 = (accountName: string, locationName: string) => {
  // accountName: "accounts/123"
  // locationName: "accounts/123/locations/456"
  const accountId = accountName.split("/").pop() || accountName
  const locationId = locationName.split("/").pop() || locationName
  return { accountId, locationId }
}

const buildWhatsappUrl = (message: string) =>
  `https://wa.me/5567992167694?text=${encodeURIComponent(message)}`

export const publishPromoPost = async (promoId: string) => {
  const { token, connection } = await getAccessToken()
  if (!connection.accountName || !connection.locationName) {
    throw new Error("Google Business target (account/location) not configured")
  }

  const promo = await prisma.promo.findUnique({ where: { id: promoId } })
  if (!promo) throw new Error("Promo not found")
  if (!promo.sitePublished) throw new Error("Promo is not published on site")
  if (promo.googleBusinessPostName) return { skipped: true, reason: "already_posted" }

  const { accountId, locationId } = extractIdsForV4(connection.accountName, connection.locationName)
  const endpoint = `https://mybusiness.googleapis.com/v4/accounts/${encodeURIComponent(
    accountId,
  )}/locations/${encodeURIComponent(locationId)}/localPosts`

  const departures =
    promo.siteDepartures?.length
      ? promo.siteDepartures.join(", ")
      : promo.sp && promo.cg
        ? "Campo Grande e São Paulo"
        : promo.sp
          ? "São Paulo"
          : promo.cg
            ? "Campo Grande"
            : "Consulte"

  const summary = [
    `Oferta: ${promo.destino}`,
    promo.hotel ? `Hotel: ${promo.hotel}` : null,
    promo.dataFormatada ? `Saída: ${promo.dataFormatada}` : null,
    promo.numeroDeNoites ? `${promo.numeroDeNoites} noites` : null,
    departures ? `Saídas: ${departures}` : null,
  ]
    .filter(Boolean)
    .join(" • ")
    .slice(0, 1500)

  const whatsappUrl = buildWhatsappUrl(
    `Olá! Vi a oferta no Google e quero saber mais sobre ${promo.destino} (${promo.dataFormatada}).`,
  )

  const payload: any = {
    languageCode: "pt-BR",
    summary,
    topicType: "STANDARD",
    callToAction: {
      actionType: "LEARN_MORE",
      url: whatsappUrl,
    },
  }

  if (promo.siteImage && promo.siteImage.startsWith("http")) {
    payload.media = [{ mediaFormat: "PHOTO", sourceUrl: promo.siteImage }]
  }

  const created = await fetchJson<{ name?: string }>(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (created?.name) {
    await prisma.promo.update({
      where: { id: promo.id },
      data: { googleBusinessPostName: created.name },
    })
  }

  return created
}

export const syncPublishedPromos = async (limit = 20) => {
  const promos = await prisma.promo.findMany({
    where: { sitePublished: true, googleBusinessPostName: null },
    orderBy: { updatedAt: "desc" },
    take: limit,
  })

  const results: Array<{ id: string; ok: boolean; error?: string; skipped?: boolean }> = []

  for (const promo of promos) {
    try {
      const res: any = await publishPromoPost(promo.id)
      results.push({ id: promo.id, ok: true, skipped: Boolean(res?.skipped) })
    } catch (err) {
      results.push({ id: promo.id, ok: false, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return results
}
