import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/studio/savedArt", () => ({ loadSavedArt: vi.fn() }))
vi.mock("@/components/studio/artSet", () => ({ buildArtSet: vi.fn() }))
vi.mock("@/components/studio/render", () => ({ renderDoc: vi.fn() }))

import { loadSavedArt } from "@/components/studio/savedArt"
import { buildArtSet } from "@/components/studio/artSet"
import { renderDoc } from "@/components/studio/render"
import { ImageLoadError } from "@/components/studio/images"
import { IMAGE_ERROR, NETWORK_ERROR, UPLOAD_ERROR } from "@/components/studio/v2/publishView"
import type { PromoData } from "@/components/promos/dashboard/types"
import { GOOGLE_NOT_CONNECTED, PHOTO_BLOCKED, googleNeedsPost, postGoogleAfterSite } from "./postGoogle"

const promo = (extra: Partial<PromoData> = {}): PromoData => ({
  id: "p1",
  DESTINO: "Maceió",
  HOTEL: "Hotel X",
  DATA_FORMATADA: "01/03 até 08/03 de 2099",
  VALOR: "2843.83",
  PARCELAS: 15,
  NUMERO_DE_NOITES: "7",
  SITE_PUBLISHED: true,
  SITE_IMAGE: "https://img.example/foto.jpg",
  ...extra,
})

const SAVED_DOC = { id: "salvo" }
const MODEL_DOC = { id: "modelo" }
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })

let fetchMock: ReturnType<typeof vi.fn>
const STATUS = "/api/google-business/status"
const calls = () => fetchMock.mock.calls.map(([url, init]) => ({ url: String(url), body: init?.body ? JSON.parse(init.body) : null }))
/** Responde a situação do Google como conectado e o resto com `rest` */
const withStatus = (rest: (url: string) => Response | Promise<Response>) => async (url: string) =>
  url.startsWith(STATUS) ? json({ connected: true, ready: true, simulate: false }) : rest(url)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(loadSavedArt).mockResolvedValue({ docs: { landscape: SAVED_DOC } } as never)
  vi.mocked(buildArtSet).mockReturnValue({ docs: { landscape: MODEL_DOC } } as never)
  vi.mocked(renderDoc).mockResolvedValue("data:image/jpeg;base64,AAAA")
  fetchMock = vi.fn(async (url: string) => {
    if (url.startsWith("/api/google-business/status")) return json({ connected: true, ready: true, simulate: false })
    if (url.startsWith("/api/meta/media")) return json({ url: "https://app.donatti.com/api/media/x" })
    if (url.startsWith("/api/publish")) return json({ ok: true, status: "simulated" })
    return json({}, 404)
  })
  vi.stubGlobal("fetch", fetchMock)
})

describe("postGoogleAfterSite", () => {
  it("usa a arte salva no Studio, sobe a imagem e publica no Google", async () => {
    const res = await postGoogleAfterSite(promo())
    expect(res).toEqual({ ok: true })
    expect(loadSavedArt).toHaveBeenCalledWith(expect.objectContaining({ id: "p1" }), "destaque")
    expect(buildArtSet).not.toHaveBeenCalled()
    expect(renderDoc).toHaveBeenCalledWith(SAVED_DOC, expect.objectContaining({ HOTEL: "Hotel X" }), { mime: "image/jpeg", quality: 0.9, strict: true })
    expect(calls()).toEqual([
      { url: STATUS, body: null },
      { url: "/api/meta/media", body: { image: "data:image/jpeg;base64,AAAA" } },
      { url: "/api/publish", body: { promoId: "p1", channel: "google", images: ["https://app.donatti.com/api/media/x"] } },
    ])
  })

  it("sem arte salva usa o modelo padrão (Black November na campanha) com a foto de reserva", async () => {
    vi.mocked(loadSavedArt).mockResolvedValue(null)
    const res = await postGoogleAfterSite(promo({ CAMPAIGN: "black-friday", SITE_IMAGE: null }), { photo: "https://img.example/lista.jpg" })
    expect(res).toEqual({ ok: true })
    expect(loadSavedArt).toHaveBeenCalledWith(expect.anything(), "black-november")
    expect(buildArtSet).toHaveBeenCalledWith("black-november", "https://img.example/lista.jpg")
    expect(renderDoc).toHaveBeenCalledWith(MODEL_DOC, expect.anything(), expect.anything())
  })

  it("erro do servidor volta com a mensagem dele", async () => {
    fetchMock.mockImplementation(
      withStatus((url) =>
        url.startsWith("/api/meta/media") ? json({ url: "https://app.donatti.com/api/media/x" }) : json({ error: "Publique no site antes" }, 409),
      ),
    )
    expect(await postGoogleAfterSite(promo())).toEqual({ ok: false, error: "Publique no site antes" })
  })

  it("erro técnico do servidor vira mensagem simples", async () => {
    fetchMock.mockImplementation(
      withStatus((url) =>
        url.startsWith("/api/meta/media") ? json({ url: "https://app.donatti.com/api/media/x" }) : json({ error: "invalid_grant" }, 500),
      ),
    )
    expect(await postGoogleAfterSite(promo())).toEqual({
      ok: false,
      error: "Não foi possível publicar no Google. Tente de novo em alguns minutos.",
    })
  })

  it("arte que não exporta não envia nem publica", async () => {
    vi.mocked(renderDoc).mockRejectedValue(new Error("tainted canvas"))
    expect(await postGoogleAfterSite(promo())).toEqual({ ok: false, error: IMAGE_ERROR })
    expect(calls().map((c) => c.url)).toEqual([STATUS])
  })

  it("foto que não carrega (sem CORS) não posta arte sem foto", async () => {
    vi.mocked(renderDoc).mockRejectedValue(new ImageLoadError(["https://img.example/foto.jpg"]))
    expect(await postGoogleAfterSite(promo())).toEqual({
      ok: false,
      error: "A foto desta promoção não permite gerar a arte. Troque a foto da promo e tente de novo.",
    })
    expect(PHOTO_BLOCKED).toBe("A foto desta promoção não permite gerar a arte. Troque a foto da promo e tente de novo.")
    expect(calls().map((c) => c.url)).toEqual([STATUS])
  })

  it("Google não conectado: avisa sem desenhar nem enviar a arte", async () => {
    fetchMock.mockImplementation(async () => json({ connected: true, ready: false, simulate: false }))
    expect(await postGoogleAfterSite(promo())).toEqual({
      ok: false,
      error: "Google não está conectado. Peça para um administrador conectar o Google no painel de promoções.",
    })
    expect(GOOGLE_NOT_CONNECTED).toBe("Google não está conectado. Peça para um administrador conectar o Google no painel de promoções.")
    expect(loadSavedArt).not.toHaveBeenCalled()
    expect(renderDoc).not.toHaveBeenCalled()
    expect(calls().map((c) => c.url)).toEqual([STATUS])
  })

  it("na simulação posta mesmo sem o Google conectado", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.startsWith(STATUS)
        ? json({ connected: false, ready: false, simulate: true })
        : url.startsWith("/api/meta/media")
          ? json({ url: "https://app.donatti.com/api/media/x" })
          : json({ ok: true, status: "simulated" }),
    )
    expect(await postGoogleAfterSite(promo())).toEqual({ ok: true })
    expect(calls().map((c) => c.url)).toEqual([STATUS, "/api/meta/media", "/api/publish"])
  })

  it("chamadas ao mesmo tempo para a mesma promo postam uma vez só", async () => {
    let release: () => void = () => undefined
    vi.mocked(loadSavedArt).mockImplementation(
      () => new Promise((resolve) => (release = () => resolve({ docs: { landscape: SAVED_DOC } } as never))),
    )
    const a = postGoogleAfterSite(promo())
    const b = postGoogleAfterSite(promo())
    expect(b).toBe(a)
    await vi.waitFor(() => expect(loadSavedArt).toHaveBeenCalledTimes(1))
    release()
    expect(await a).toEqual({ ok: true })
    expect(await b).toEqual({ ok: true })
    expect(calls().filter((c) => c.url === "/api/publish")).toHaveLength(1)
    // Terminou: a próxima chamada posta de novo
    vi.mocked(loadSavedArt).mockResolvedValue({ docs: { landscape: SAVED_DOC } } as never)
    expect(await postGoogleAfterSite(promo())).toEqual({ ok: true })
    expect(calls().filter((c) => c.url === "/api/publish")).toHaveLength(2)
  })

  it("falha no envio da arte não publica", async () => {
    fetchMock.mockImplementation(withStatus(async () => json({ error: "x" }, 500)))
    expect(await postGoogleAfterSite(promo())).toEqual({ ok: false, error: UPLOAD_ERROR })
    expect(calls().map((c) => c.url)).toEqual([STATUS, "/api/meta/media"])
  })

  it("sem internet devolve a mensagem de conexão", async () => {
    vi.mocked(loadSavedArt).mockRejectedValue(new TypeError("Failed to fetch"))
    expect(await postGoogleAfterSite(promo())).toEqual({ ok: false, error: NETWORK_ERROR })
  })
})

describe("googleNeedsPost", () => {
  const status = (google: unknown) => fetchMock.mockImplementation(async () => json({ site: { state: "published" }, google }))

  it("posta quando não tem post, deu erro ou a oferta mudou", async () => {
    status({ state: "none", stale: false })
    expect(await googleNeedsPost("p1")).toBe(true)
    status({ state: "error", stale: false })
    expect(await googleNeedsPost("p1")).toBe(true)
    status({ state: "published", stale: true })
    expect(await googleNeedsPost("p1")).toBe(true)
  })

  it("não posta de novo quando o Google está em dia", async () => {
    status({ state: "published", stale: false })
    expect(await googleNeedsPost("p1")).toBe(false)
    status({ state: "simulated", stale: false })
    expect(await googleNeedsPost("p1")).toBe(false)
  })

  it("sem conseguir ler a situação, posta (o novo substitui o anterior)", async () => {
    fetchMock.mockImplementation(async () => json({ error: "x" }, 500))
    expect(await googleNeedsPost("p1")).toBe(true)
  })
})
