"use client"

/**
 * Gerador em lote: várias promos → artes de todos os canais de uma vez.
 * A arte de cada promo é a salva no Studio (formato por formato); o modelo escolhido só entra
 * onde a promo ainda não tem arte. Desenha com o mesmo renderDoc da exportação do Studio.
 *
 * Canais:
 * - Instagram feed (4:5) e Facebook (1:1): uma arte por promo, cada uma com legenda
 * - Stories (Instagram e Status do WhatsApp, 9:16): lote sem legenda
 * - Canal do WhatsApp: uma mensagem com a lista de ofertas + o lote, ou uma imagem + a mensagem
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Copy, Download, Loader2, Pencil, Send, Share2, Sparkles, X } from "lucide-react"
import { TEMPLATE_FAMILIES, withPhoto } from "@/components/studio/templates"
import { promoVariables, type PromoLike } from "@/components/studio/variables"
import { renderDoc } from "@/components/studio/render"
import { loadSavedArt, type SavedArt } from "@/components/studio/savedArt"
import { FORMATS, type ArtFormat } from "@/components/studio/types"
import { captionFor, carouselCaption, whatsappChannelMessage } from "@/lib/promoCaptions"
import type { useMeta } from "@/hooks/useMeta"
import { getPromoStatus, slugify, type PromoData } from "./dashboard/types"

type ChannelId = "ig-feed" | "stories" | "facebook" | "wa-channel"

const CHANNELS: { id: ChannelId; label: string; hint: string; format: ArtFormat; folder: string }[] = [
  { id: "ig-feed", label: "Instagram feed", hint: "4:5 · uma arte + legenda por oferta", format: "feed", folder: "instagram-feed" },
  { id: "stories", label: "Stories", hint: "9:16 · Instagram e Status do WhatsApp, sem legenda", format: "story", folder: "stories" },
  { id: "facebook", label: "Facebook", hint: "1:1 · arte + legenda com link", format: "square", folder: "facebook" },
  { id: "wa-channel", label: "Canal do WhatsApp", hint: "1:1 · mensagem com a lista + imagens", format: "square", folder: "whatsapp-canal" },
]

type Scope = "campanha" | "no-site" | "todas"

interface Art {
  promoId: string
  format: ArtFormat
  dataUrl: string
  filename: string
  /** "studio" = arte salva da promo; "modelo" = gerada pelo modelo escolhido */
  source: "studio" | "modelo"
}

interface BatchGeneratorProps {
  promos: PromoData[]
  /** Fotos carregadas pelo painel para promos sem SITE_IMAGE */
  promoImages?: Record<string, string>
  campaign?: { name: string; maxDiscount?: number } | null
  /** Conexão com a Meta: com ela os canais ganham "Publicar" (Instagram e Facebook) */
  meta?: ReturnType<typeof useMeta> | null
  /** Abre a promo no Studio (o lote fica guardado e volta quando o Studio fecha) */
  onEditInStudio?: (promo: PromoData) => void
  /** Muda quando uma promo volta do Studio: o lote redesenha só as artes dela */
  refresh?: { promoId: string; n: number } | null
  onClose: () => void
}

const dataUrlToFile = async (dataUrl: string, filename: string) => {
  const blob = await (await fetch(dataUrl)).blob()
  return new File([blob], filename, { type: blob.type })
}

export function BatchGenerator({ promos, promoImages = {}, campaign = null, meta = null, onEditInStudio, refresh = null, onClose }: BatchGeneratorProps) {
  const [scope, setScope] = useState<Scope>(campaign ? "campanha" : "no-site")
  const candidates = useMemo(
    () =>
      promos.filter((p) =>
        scope === "todas" ? getPromoStatus(p) !== "vencida" : scope === "no-site" ? getPromoStatus(p) === "no-site" : p.CAMPAIGN === "black-friday" && getPromoStatus(p) !== "vencida",
      ),
    [promos, scope],
  )
  const [picked, setPicked] = useState<Set<string>>(() => new Set())
  const selected = candidates.filter((p) => picked.has(p.id))

  const [familyId, setFamilyId] = useState(campaign ? "black-november" : TEMPLATE_FAMILIES[0].id)
  const [channels, setChannels] = useState<Set<ChannelId>>(() => new Set<ChannelId>(["ig-feed", "stories", "wa-channel"]))
  const [waMode, setWaMode] = useState<"lote" | "uma">("lote")

  const [arts, setArts] = useState<Art[]>([])
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [failures, setFailures] = useState<string[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const cancelRef = useRef(false)

  // Publicação direta (Meta): estado por chave ("ig-feed:all", "facebook:arquivo.jpg"...)
  const metaReady = !!meta?.status?.connected
  const igReady = metaReady && !!meta?.status?.hasInstagram
  const [pub, setPub] = useState<Record<string, { state: "sending" | "done" | "error"; text?: string }>>({})
  const [fbSchedule, setFbSchedule] = useState("")
  const runPublish = async (key: string, jobs: (() => Promise<unknown>)[]) => {
    setPub((prev) => ({ ...prev, [key]: { state: "sending", text: jobs.length > 1 ? `0/${jobs.length}` : undefined } }))
    let done = 0
    try {
      for (const job of jobs) {
        await job()
        done++
        if (jobs.length > 1) setPub((prev) => ({ ...prev, [key]: { state: "sending", text: `${done}/${jobs.length}` } }))
      }
      setPub((prev) => ({ ...prev, [key]: { state: "done", text: fbSchedule && key.startsWith("facebook") ? "Agendado" : "Publicado" } }))
    } catch (err) {
      setPub((prev) => ({ ...prev, [key]: { state: "error", text: `${done ? `${done} ok · ` : ""}${err instanceof Error ? err.message : "Erro"}` } }))
    }
  }
  const scheduledAt = () => (fbSchedule ? new Date(fbSchedule).toISOString() : undefined)

  const formats = useMemo(() => Array.from(new Set(CHANNELS.filter((c) => channels.has(c.id)).map((c) => c.format))), [channels])
  const family = TEMPLATE_FAMILIES.find((f) => f.id === familyId) || TEMPLATE_FAMILIES[0]
  const captionOpts = { campaign: campaign?.name }
  const waMessage = useMemo(() => whatsappChannelMessage(selected, { campaign: campaign?.name, maxDiscount: campaign?.maxDiscount }), [selected, campaign])

  const toggle = <T,>(set: Set<T>, value: T) => {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  const [useStudio, setUseStudio] = useState(true)

  /** Arte da promo num formato: a do Studio, se houver, senão o modelo escolhido */
  const renderOne = async (p: PromoData, f: ArtFormat, saved: SavedArt | null, index: number): Promise<Art> => {
    const fromStudio = useStudio ? saved?.docs[f] : undefined
    const doc = fromStudio || withPhoto(family.build(f), p.SITE_IMAGE || promoImages[p.id] || null)
    const dataUrl = await renderDoc(doc, promoVariables(p as unknown as PromoLike), { mime: "image/jpeg", quality: 0.9 })
    return { promoId: p.id, format: f, dataUrl, source: fromStudio ? "studio" : "modelo", filename: `${String(index + 1).padStart(2, "0")}-${slugify(p.DESTINO) || "oferta"}-${f}.jpg` }
  }
  const savedFor = async (p: PromoData) => (useStudio ? loadSavedArt(p).catch(() => null) : null)

  const generate = async () => {
    cancelRef.current = false
    setArts([])
    setFailures([])
    const jobs = selected.flatMap((p, pi) => formats.map((f) => ({ p, pi, f })))
    setProgress({ done: 0, total: jobs.length })
    const saved = new Map(await Promise.all(selected.map(async (p) => [p.id, await savedFor(p)] as const)))
    const out: Art[] = []
    const failed: string[] = []
    for (const [i, { p, pi, f }] of jobs.entries()) {
      if (cancelRef.current) break
      try {
        out.push(await renderOne(p, f, saved.get(p.id) || null, pi))
        setArts([...out])
      } catch (err) {
        console.error("Lote: falhou", p.DESTINO, f, err)
        failed.push(`${p.DESTINO} (${FORMATS[f].label})`)
      }
      setProgress({ done: i + 1, total: jobs.length })
    }
    setFailures(failed)
    setProgress(null)
  }

  // Promo editada no Studio: redesenha só as artes dela, no mesmo lugar
  useEffect(() => {
    if (!refresh) return
    const p = selected.find((x) => x.id === refresh.promoId)
    if (!p || !arts.some((a) => a.promoId === p.id)) return
    let alive = true
    void (async () => {
      const saved = await savedFor(p)
      const pi = selected.indexOf(p)
      const fresh = await Promise.all(formats.map((f) => renderOne(p, f, saved, pi).catch(() => null)))
      if (!alive) return
      setArts((prev) => prev.map((a) => (a.promoId === p.id ? fresh.find((x) => x?.format === a.format) || a : a)))
    })()
    return () => {
      alive = false
    }
  }, [refresh?.n]) // eslint-disable-line react-hooks/exhaustive-deps

  const artsFor = (format: ArtFormat) => arts.filter((a) => a.format === format)
  const promoOf = (id: string) => selected.find((p) => p.id === id)!

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    window.setTimeout(() => setCopied(null), 1800)
  }

  // Celular: abre o compartilhar do sistema (WhatsApp, Instagram) com as imagens e o texto
  const canShareFiles = typeof navigator !== "undefined" && "canShare" in navigator
  const share = async (list: Art[], text?: string) => {
    const files = await Promise.all(list.map((a) => dataUrlToFile(a.dataUrl, a.filename)))
    const data: ShareData = { files, ...(text ? { text } : {}) }
    if (navigator.canShare?.(data)) await navigator.share(data).catch(() => undefined)
    else if (text) await copy("share-fallback", text)
  }

  const downloadZip = async () => {
    const JSZip = (await import("jszip")).default
    const zip = new JSZip()
    for (const c of CHANNELS.filter((ch) => channels.has(ch.id))) {
      const folder = zip.folder(c.folder)!
      const list = c.id === "wa-channel" && waMode === "uma" ? artsFor(c.format).slice(0, 1) : artsFor(c.format)
      list.forEach((a) => folder.file(a.filename, a.dataUrl.split(",")[1], { base64: true }))
      if (c.id === "ig-feed" || c.id === "facebook") {
        const network = c.id === "ig-feed" ? "instagram" : "facebook"
        folder.file(
          "legendas.txt",
          list.map((a) => `--- ${a.filename} ---\n${captionFor(promoOf(a.promoId), { ...captionOpts, network })}`).join("\n\n"),
        )
      }
      if (c.id === "wa-channel") folder.file("mensagem.txt", waMessage)
    }
    const blob = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${slugify(campaign?.name || "ofertas")}-lote-${new Date().toISOString().slice(0, 10)}.zip`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const busy = progress !== null
  const chip = "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors"
  const btn = "inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50"

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-center bg-black/60 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="batch-title">
      <div className="flex w-full max-w-6xl flex-col overflow-hidden bg-white sm:rounded-[24px]">
        <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id="batch-title" className="text-lg font-black text-gray-900">
              Gerar em lote
            </h2>
            <p className="text-[13px] text-gray-500">Escolha as ofertas, o modelo e os canais. As artes saem prontas para postar.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[380px_1fr] lg:overflow-hidden">
          {/* 1 · ofertas, modelo e canais */}
          <aside className="flex flex-col gap-6 border-gray-200 p-5 pb-0 lg:overflow-y-auto lg:border-r">
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-black uppercase tracking-wider text-gray-400">1 · Ofertas</h3>
                <button
                  type="button"
                  className="text-[13px] font-bold text-amber-600 hover:underline"
                  onClick={() => setPicked(selected.length === candidates.length ? new Set() : new Set(candidates.map((p) => p.id)))}
                >
                  {selected.length === candidates.length && candidates.length > 0 ? "Limpar" : "Selecionar todas"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(campaign ? (["campanha", "no-site", "todas"] as Scope[]) : (["no-site", "todas"] as Scope[])).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={scope === s}
                    onClick={() => setScope(s)}
                    className={`${chip} ${scope === s ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                  >
                    {s === "campanha" ? campaign?.name : s === "no-site" ? "No site" : "Todas ativas"}
                  </button>
                ))}
              </div>
              <ul className="flex max-h-[320px] flex-col gap-1 overflow-y-auto rounded-[14px] border border-gray-200 p-1">
                {candidates.length === 0 && <li className="p-4 text-center text-[13px] text-gray-500">Nenhuma oferta nesse filtro.</li>}
                {candidates.map((p) => {
                  const on = picked.has(p.id)
                  return (
                    <li key={p.id}>
                      <label className={`flex cursor-pointer items-center gap-3 rounded-[10px] p-2 ${on ? "bg-amber-50" : "hover:bg-gray-50"}`}>
                        <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={on} onChange={() => setPicked(toggle(picked, p.id))} />
                        <img src={p.SITE_IMAGE || promoImages[p.id] || "/images/hero-beach.jpg"} alt="" className="h-10 w-10 rounded-[8px] object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-bold text-gray-900">{p.DESTINO}</span>
                          <span className="block truncate text-[12px] text-gray-500">
                            {p.HOTEL} · {p.DATA_FORMATADA}
                          </span>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-[12px] font-black uppercase tracking-wider text-gray-400">2 · Arte</h3>
              <label className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-gray-200 p-3">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-amber-500" checked={useStudio} onChange={() => setUseStudio(!useStudio)} />
                <span>
                  <span className="block text-[14px] font-bold text-gray-900">Usar a arte feita no Studio</span>
                  <span className="block text-[12px] text-gray-500">Cada promo sai com a arte salva dela. O modelo abaixo só entra onde ainda não tem arte.</span>
                </span>
              </label>
              <span className="text-[12px] font-semibold text-gray-500">{useStudio ? "Modelo para quem ainda não tem arte" : "Modelo para todas"}</span>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATE_FAMILIES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={familyId === f.id}
                    onClick={() => setFamilyId(f.id)}
                    className={`flex flex-col items-start gap-2 rounded-[14px] border p-2.5 text-left ${familyId === f.id ? "border-amber-500 ring-2 ring-amber-500/20" : "border-gray-200 hover:border-gray-400"}`}
                  >
                    <span className="flex h-6 w-full overflow-hidden rounded-[6px]">
                      <span className="flex-1" style={{ background: f.swatch[0] }} />
                      <span className="w-1/3" style={{ background: f.swatch[1] }} />
                    </span>
                    <span className="text-[13px] font-bold leading-tight text-gray-900">{f.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-[12px] font-black uppercase tracking-wider text-gray-400">3 · Canais</h3>
              {CHANNELS.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-gray-200 p-3 hover:border-gray-400">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-amber-500" checked={channels.has(c.id)} onChange={() => setChannels(toggle(channels, c.id))} />
                  <span>
                    <span className="block text-[14px] font-bold text-gray-900">{c.label}</span>
                    <span className="block text-[12px] text-gray-500">{c.hint}</span>
                    {c.id === "wa-channel" && channels.has(c.id) && (
                      <span className="mt-2 flex gap-2">
                        {(["lote", "uma"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            aria-pressed={waMode === m}
                            onClick={(e) => {
                              e.preventDefault()
                              setWaMode(m)
                            }}
                            className={`${chip} ${waMode === m ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-200 text-gray-600"}`}
                          >
                            {m === "lote" ? "Mensagem + lote" : "1 imagem + mensagem"}
                          </button>
                        ))}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </section>

            <div className="sticky bottom-0 -mx-5 mt-auto border-t border-gray-200 bg-white/95 px-5 py-4 shadow-[0_-8px_16px_rgba(255,255,255,0.9)] backdrop-blur">
              {busy ? (
                <button type="button" className={`${btn} w-full bg-gray-100 text-gray-700`} onClick={() => (cancelRef.current = true)}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando {progress.done}/{progress.total} · cancelar
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!selected.length || !formats.length}
                  onClick={() => void generate()}
                  className={`${btn} w-full bg-amber-500 text-gray-900 hover:bg-amber-400`}
                >
                  <Sparkles className="h-4 w-4" />
                  Gerar {selected.length * formats.length || ""} arte{selected.length * formats.length === 1 ? "" : "s"}
                </button>
              )}
            </div>
          </aside>

          {/* 2 · resultado por canal */}
          <section className="flex min-h-0 flex-col gap-6 bg-gray-50 p-5 lg:overflow-y-auto">
            {arts.length === 0 && !busy && (
              <div className="m-auto max-w-sm text-center text-[14px] text-gray-500">
                Selecione as ofertas e clique em <b>Gerar</b>. As artes aparecem aqui separadas por canal, com legenda e botões para baixar ou compartilhar.
              </div>
            )}

            {failures.length > 0 && (
              <div className="rounded-[14px] border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
                Não deu para gerar: {failures.join(", ")}. Normalmente é a foto bloqueando a exportação; troque a foto da promo e gere de novo.
              </div>
            )}

            {arts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => void downloadZip()} disabled={busy} className={`${btn} bg-gray-900 text-white hover:bg-gray-800`}>
                  <Download className="h-4 w-4" />
                  Baixar tudo (.zip por canal)
                </button>
                <span className="text-[13px] text-gray-500">{arts.length} arte(s) prontas</span>
              </div>
            )}

            {CHANNELS.filter((c) => channels.has(c.id)).map((c) => {
              const list = c.id === "wa-channel" && waMode === "uma" ? artsFor(c.format).slice(0, 1) : artsFor(c.format)
              if (!list.length) return null
              const tall = c.format === "story"
              return (
                <div key={c.id} className="flex flex-col gap-3 rounded-[20px] border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-[15px] font-black text-gray-900">{c.label}</h3>
                      <p className="text-[12px] text-gray-500">{c.hint}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.id === "wa-channel" && (
                        <button type="button" onClick={() => void copy("wa", waMessage)} className={`${btn} border border-gray-200 text-gray-800 hover:bg-gray-50`}>
                          {copied === "wa" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          Copiar mensagem
                        </button>
                      )}
                      {canShareFiles && (c.id === "stories" || c.id === "wa-channel") && (
                        <button
                          type="button"
                          onClick={() => void share(list, c.id === "wa-channel" ? waMessage : undefined)}
                          className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}
                        >
                          <Share2 className="h-4 w-4" />
                          Compartilhar {list.length > 1 ? `as ${list.length}` : ""}
                        </button>
                      )}
                    </div>
                  </div>

                  {meta && c.id !== "wa-channel" && (
                    <PublishBar
                      channel={c.id}
                      count={list.length}
                      igReady={igReady}
                      fbReady={metaReady}
                      connected={metaReady}
                      pub={pub}
                      fbSchedule={fbSchedule}
                      onSchedule={setFbSchedule}
                      onPublish={(target) => {
                        if (!meta) return
                        const cap = (a: Art, network: "instagram" | "facebook") => captionFor(promoOf(a.promoId), { ...captionOpts, network })
                        const key = `${c.id}:${target}`
                        if (target === "ig-each") void runPublish(key, list.map((a) => () => meta.publish({ network: "instagram", kind: "post", images: [a.dataUrl], caption: cap(a, "instagram"), promoId: a.promoId })))
                        if (target === "ig-carousel")
                          void runPublish(key, [
                            () => meta.publish({ network: "instagram", kind: "post", images: list.slice(0, 10).map((a) => a.dataUrl), caption: carouselCaption(list.slice(0, 10).map((a) => promoOf(a.promoId)), captionOpts) }),
                          ])
                        if (target === "ig-stories") void runPublish(key, list.map((a) => () => meta.publish({ network: "instagram", kind: "story", images: [a.dataUrl] })))
                        if (target === "fb-stories") void runPublish(key, list.map((a) => () => meta.publish({ network: "facebook", kind: "story", images: [a.dataUrl] })))
                        if (target === "fb-each")
                          void runPublish(key, list.map((a) => () => meta.publish({ network: "facebook", kind: "post", images: [a.dataUrl], caption: cap(a, "facebook"), scheduledAt: scheduledAt() })))
                        if (target === "fb-album")
                          void runPublish(key, [
                            () =>
                              meta.publish({
                                network: "facebook",
                                kind: "post",
                                images: list.slice(0, 10).map((a) => a.dataUrl),
                                caption: whatsappChannelMessage(list.slice(0, 10).map((a) => promoOf(a.promoId)), { campaign: campaign?.name, maxDiscount: campaign?.maxDiscount }).replace(/\*/g, ""),
                                scheduledAt: scheduledAt(),
                              }),
                          ])
                      }}
                    />
                  )}

                  {c.id === "wa-channel" && (
                    <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-[12px] bg-gray-50 p-3 font-sans text-[13px] text-gray-700">{waMessage}</pre>
                  )}

                  <div className={`grid gap-3 ${tall ? "grid-cols-2 sm:grid-cols-4 xl:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"}`}>
                    {list.map((a) => {
                      const p = promoOf(a.promoId)
                      const withCaption = c.id === "ig-feed" || c.id === "facebook"
                      const caption = withCaption ? captionFor(p, { ...captionOpts, network: c.id === "ig-feed" ? "instagram" : "facebook" }) : ""
                      const key = `${c.id}-${a.filename}`
                      return (
                        <figure key={key} className="flex flex-col gap-2">
                          <div className="relative">
                            <img src={a.dataUrl} alt={`${p.DESTINO} · ${FORMATS[a.format].label}`} className="w-full rounded-[10px] border border-gray-200" />
                            <span
                              className={`absolute left-1.5 top-1.5 rounded-[6px] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${a.source === "studio" ? "bg-emerald-600 text-white" : "bg-white/90 text-gray-700"}`}
                            >
                              {a.source === "studio" ? "Studio" : "Modelo"}
                            </span>
                          </div>
                          <figcaption className="flex flex-wrap gap-1.5">
                            {onEditInStudio && (
                              <button
                                type="button"
                                onClick={() => onEditInStudio(p)}
                                className="inline-flex items-center gap-1 rounded-[8px] bg-amber-100 px-2 py-1 text-[12px] font-bold text-amber-800 hover:bg-amber-200"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Studio
                              </button>
                            )}
                            <a href={a.dataUrl} download={a.filename} className="inline-flex items-center gap-1 rounded-[8px] bg-gray-100 px-2 py-1 text-[12px] font-bold text-gray-700 hover:bg-gray-200">
                              <Download className="h-3.5 w-3.5" />
                              Baixar
                            </a>
                            {withCaption && (
                              <button
                                type="button"
                                onClick={() => void copy(key, caption)}
                                className="inline-flex items-center gap-1 rounded-[8px] bg-gray-100 px-2 py-1 text-[12px] font-bold text-gray-700 hover:bg-gray-200"
                              >
                                {copied === key ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                Legenda
                              </button>
                            )}
                            {canShareFiles && withCaption && (
                              <button
                                type="button"
                                onClick={() => void share([a], caption)}
                                className="inline-flex items-center gap-1 rounded-[8px] bg-gray-100 px-2 py-1 text-[12px] font-bold text-gray-700 hover:bg-gray-200"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                                Postar
                              </button>
                            )}
                          </figcaption>
                        </figure>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </section>
        </div>
      </div>
    </div>
  )
}

type PublishTarget = "ig-each" | "ig-carousel" | "ig-stories" | "fb-stories" | "fb-each" | "fb-album"

/** Botões de publicar direto por canal, com o andamento de cada envio */
function PublishBar({
  channel,
  count,
  igReady,
  fbReady,
  connected,
  pub,
  fbSchedule,
  onSchedule,
  onPublish,
}: {
  channel: ChannelId
  count: number
  igReady: boolean
  fbReady: boolean
  connected: boolean
  pub: Record<string, { state: "sending" | "done" | "error"; text?: string }>
  fbSchedule: string
  onSchedule: (v: string) => void
  onPublish: (target: PublishTarget) => void
}) {
  if (!connected) {
    return <p className="rounded-[12px] bg-gray-50 p-3 text-[13px] text-gray-500">Conecte o Facebook no painel para publicar daqui sem baixar as artes.</p>
  }
  const actions: { target: PublishTarget; label: string; ready: boolean }[] =
    channel === "ig-feed"
      ? [
          { target: "ig-each", label: `Instagram: ${count > 1 ? `${count} posts` : "1 post"}`, ready: igReady },
          ...(count > 1 ? [{ target: "ig-carousel" as const, label: `Instagram: carrossel${count > 10 ? " (10 primeiras)" : ""}`, ready: igReady }] : []),
        ]
      : channel === "stories"
        ? [
            { target: "ig-stories", label: `Stories no Instagram (${count})`, ready: igReady },
            { target: "fb-stories", label: `Stories no Facebook (${count})`, ready: fbReady },
          ]
        : [
            { target: "fb-each", label: `Facebook: ${count > 1 ? `${count} posts` : "1 post"}`, ready: fbReady },
            ...(count > 1 ? [{ target: "fb-album" as const, label: `Facebook: álbum${count > 10 ? " (10 primeiras)" : ""}`, ready: fbReady }] : []),
          ]
  return (
    <div className="flex flex-col gap-2 rounded-[12px] bg-blue-50/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((a) => {
          const st = pub[`${channel}:${a.target}`]
          return (
            <button
              key={a.target}
              type="button"
              disabled={!a.ready || st?.state === "sending"}
              onClick={() => onPublish(a.target)}
              title={a.ready ? undefined : "A Página conectada não tem Instagram profissional ligado"}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#1877F2] px-3 py-2 text-[13px] font-bold text-white hover:bg-[#166FE5] disabled:opacity-50"
            >
              {st?.state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : st?.state === "done" ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {a.label}
              {st?.text && <span className="font-semibold opacity-90">· {st.text}</span>}
            </button>
          )
        })}
        {channel === "facebook" && (
          <label className="ml-auto inline-flex items-center gap-2 text-[12px] font-semibold text-gray-600">
            Agendar
            <input
              type="datetime-local"
              value={fbSchedule}
              onChange={(e) => onSchedule(e.target.value)}
              className="rounded-[8px] border border-gray-200 bg-white px-2 py-1 text-[12px]"
            />
          </label>
        )}
      </div>
      {Object.entries(pub)
        .filter(([k, v]) => k.startsWith(`${channel}:`) && v.state === "error")
        .map(([k, v]) => (
          <p key={k} className="text-[12px] font-semibold text-red-600">
            {v.text}
          </p>
        ))}
    </div>
  )
}
