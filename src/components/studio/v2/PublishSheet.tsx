"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Download, Send, X } from "lucide-react"
import { uploadImage, usePublish } from "@/hooks/usePublish"
import { CHANNELS, type Channel } from "@/lib/channels"
import { captionsFor, type CaptionPromo } from "@/lib/promoCaptions"
import { needsConfirm } from "@/lib/publishState"
import { computeSlug, slugify } from "@/lib/utils"
import { FORMATS, type ArtFormat } from "../types"
import type { ArtSet, Captions } from "../artSet"
import { Spinner } from "../panels/ui"
import { CaptionTabs, type Network } from "./CaptionTabs"
import { ChannelList, type Run } from "./ChannelList"
import { PublishPreview } from "./PublishPreview"
import { ScheduleBox, localInput } from "./ScheduleBox"
import { ShareWhatsApp } from "./ShareWhatsApp"
import {
  IMAGE_ERROR,
  UNSAVED,
  UPLOAD_ERROR,
  deviceOf,
  initialSelection,
  publishOrder,
  scheduleError,
  toggleChannel,
  type Device,
} from "./publishView"

type Promo = Record<string, unknown> & { id: string; DESTINO: string }

export interface PublishSheetProps {
  promo: Promo
  set: ArtSet
  getDataUrl: (format: ArtFormat, mime?: "image/png" | "image/jpeg", quality?: number) => Promise<string>
  setCaptions: (c: Captions) => void
  /** "Concluir": fecha o Studio (salva antes) */
  onDone: () => void
  /** Fecha só o painel */
  onClose: () => void
  /** Formato aberto no Studio (para o "Baixar") */
  format: ArtFormat
  onDownload: (which: ArtFormat | "all", mime: "image/png" | "image/jpeg") => void
}

/** Antes de saber a situação dos canais (e na promo não salva) */
const DEFAULT_SELECTION: Channel[] = ["site", "google"]
const label = (c: Channel) => CHANNELS.find((x) => x.id === c)!.label
const formatOf = (c: Channel) => CHANNELS.find((x) => x.id === c)!.format

/** Painel Publicar: canais, legenda por rede, prévia e situação de cada canal */
export function PublishSheet({ promo, set, getDataUrl, setCaptions, onDone, onClose, format, onDownload }: PublishSheetProps) {
  const canPublish = !!promo.id && promo.id !== "demo-tutorial"
  const { status, initialStatus, load, refresh, publish, markShared } = usePublish(canPublish ? promo.id : null)

  // Marcados ao abrir: seguem a primeira situação lida (uma vez); depois disso valem os cliques da pessoa
  const [picked, setPicked] = useState<Set<Channel> | null>(null)
  const seeded = useMemo(() => (initialStatus ? initialSelection(initialStatus) : new Set(DEFAULT_SELECTION)), [initialStatus])
  const selected = picked ?? seeded
  const [focus, setFocus] = useState<Channel>("ig-feed")
  const [tab, setTab] = useState<Network>("instagram")
  const [when, setWhen] = useState<"now" | "schedule">("now")
  const [scheduleAt, setScheduleAt] = useState(() => localInput(new Date(Date.now() + 60 * 60_000)))
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null)
  const [run, setRun] = useState<Partial<Record<Channel, Run>>>({})
  const [running, setRunning] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [device, setDevice] = useState<Device>("desktop")
  const [preview, setPreview] = useState<{ format: ArtFormat; url: string | null; error: boolean } | null>(null)

  useEffect(() => {
    setDevice(deviceOf(navigator.userAgent, navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !running && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, running])

  // ---------------------------------------------------------------------------
  // Legendas: as salvas com a arte, ou geradas com os dados da oferta
  // ---------------------------------------------------------------------------
  const campaign = promo.CAMPAIGN === "black-friday" ? "Black November" : null
  const generated = useMemo(() => {
    const siteSlug = typeof promo.SITE_SLUG === "string" && promo.SITE_SLUG ? promo.SITE_SLUG : null
    const p = { ...promo, SITE_SLUG: computeSlug({ siteSlug, destino: promo.DESTINO, id: promo.id }) } as unknown as CaptionPromo
    return captionsFor(p, campaign)
  }, [promo, campaign])
  const captions = set.captions ?? generated

  const editCaption = (network: Network, text: string) => setCaptions({ ...captions, [network]: text })
  const regenerate = (network: Network) => setCaptions({ ...captions, [network]: generated[network] })

  // ---------------------------------------------------------------------------
  // Artes: geradas em JPEG uma vez por formato e enviadas uma vez por formato
  // (com o painel aberto a arte não muda; fechar e abrir de novo gera tudo outra vez)
  // ---------------------------------------------------------------------------
  const rendered = useRef(new Map<ArtFormat, Promise<string>>())
  const uploaded = useRef(new Map<ArtFormat, Promise<string>>())

  const renderOnce = useCallback(
    (f: ArtFormat) => {
      let p = rendered.current.get(f)
      if (!p) {
        p = getDataUrl(f, "image/jpeg", 0.9)
        rendered.current.set(f, p)
        p.catch(() => rendered.current.delete(f))
      }
      return p
    },
    [getDataUrl],
  )

  const uploadOnce = (f: ArtFormat) => {
    let p = uploaded.current.get(f)
    if (!p) {
      p = renderOnce(f)
        .catch(() => Promise.reject(new Error(IMAGE_ERROR)))
        .then((dataUrl) => uploadImage(dataUrl).catch(() => Promise.reject(new Error(UPLOAD_ERROR))))
      uploaded.current.set(f, p)
      p.catch(() => uploaded.current.delete(f))
    }
    return p
  }

  const focusFormat = formatOf(focus)
  useEffect(() => {
    if (!focusFormat) return
    let alive = true
    renderOnce(focusFormat).then(
      (url) => alive && setPreview({ format: focusFormat, url, error: false }),
      () => alive && setPreview({ format: focusFormat, url: null, error: true }),
    )
    return () => {
      alive = false
    }
  }, [focusFormat, renderOnce])

  // ---------------------------------------------------------------------------
  // Publicar: Site, depois Google, depois os demais, um de cada vez
  // ---------------------------------------------------------------------------
  const scheduling = when === "schedule" && selected.has("fb-feed")
  const toPublish = publishOrder(selected)

  const runChannel = async (c: Channel): Promise<boolean> => {
    setRun((r) => ({ ...r, [c]: { phase: "busy" } }))
    const f = formatOf(c)
    let images: string[] = []
    if (f && c !== "site") {
      try {
        images = [await uploadOnce(f)]
      } catch (err) {
        setRun((r) => ({ ...r, [c]: { phase: "error", error: err instanceof Error ? err.message : UPLOAD_ERROR } }))
        return false
      }
    }
    const caption = c === "ig-feed" ? captions.instagram : c === "fb-feed" ? captions.facebook : undefined
    const scheduledAt = c === "fb-feed" && scheduling ? new Date(scheduleAt).toISOString() : undefined
    const res = await publish(c, { images, caption, scheduledAt })
    setRun((r) => ({ ...r, [c]: res.ok ? { phase: "done" } : { phase: "error", error: res.error } }))
    return res.ok
  }

  const publishAll = async () => {
    if (!canPublish || load !== "ready" || running || !toPublish.length) return
    if (scheduling) {
      const err = scheduleError(scheduleAt)
      setScheduleMsg(err)
      if (err) return
    }
    const confirmed = toPublish.filter((c) => {
      const s = status?.[c]
      return !s || !needsConfirm(s) || window.confirm(`${label(c)} já foi publicado. Publicar de novo?`)
    })
    if (!confirmed.length) return
    setRunning(true)
    setRun((r) => {
      const next = { ...r }
      for (const c of confirmed) delete next[c]
      return next
    })
    let siteFailed = false
    try {
      for (const c of confirmed) {
        if (c === "google" && siteFailed) {
          setRun((r) => ({ ...r, google: { phase: "error", error: "Publique no site antes" } }))
          continue
        }
        const ok = await runChannel(c)
        if (c === "site" && !ok) siteFailed = true
      }
    } finally {
      setRunning(false)
    }
  }

  const retry = async (c: Channel) => {
    if (!canPublish || running) return
    setRunning(true)
    try {
      await runChannel(c)
    } finally {
      setRunning(false)
    }
  }

  const toggle = (c: Channel) => {
    const next = toggleChannel(selected, c)
    setPicked(next)
    if (next.has(c)) setFocus(c)
    if (!next.has("fb-feed")) setWhen("now")
  }

  const focusChannel = (c: Channel) => {
    setFocus(c)
    const net = CHANNELS.find((x) => x.id === c)!.caption
    if (net) setTab(net)
  }

  // ---------------------------------------------------------------------------
  // WhatsApp
  // ---------------------------------------------------------------------------
  const base = slugify(String(promo.DESTINO || "arte")) || "arte"
  const getSquare = useCallback(() => renderOnce("square"), [renderOnce])
  const getStory = useCallback(() => renderOnce("story"), [renderOnce])
  const shareFor = (c: "wa-channel" | "wa-status") => (
    <ShareWhatsApp
      device={device}
      getImage={c === "wa-channel" ? getSquare : getStory}
      message={captions.whatsapp}
      filename={`${base}-${c === "wa-channel" ? "whatsapp-canal" : "whatsapp-status"}.jpg`}
      onShared={() => {
        setRun((r) => ({ ...r, [c]: { phase: "busy" } }))
        void markShared(c).then((res) => setRun((r) => ({ ...r, [c]: res.ok ? { phase: "done" } : { phase: "error", error: res.error } })))
      }}
      onError={(error) => setRun((r) => ({ ...r, [c]: { phase: "error", error } }))}
    />
  )

  // ---------------------------------------------------------------------------
  // Interface
  // ---------------------------------------------------------------------------
  const previewUrl = focusFormat && preview?.format === focusFormat ? preview.url : null
  const previewError = !!(focusFormat && preview?.format === focusFormat && preview.error)
  const focusNet = CHANNELS.find((x) => x.id === focus)!.caption
  const focusCaption = focus === "ig-feed" || focus === "fb-feed" || focus === "wa-channel" ? captions[focusNet!] : null
  const downloadFormat = focusFormat ?? format
  const waOnly = !toPublish.length && (selected.has("wa-channel") || selected.has("wa-status"))

  const previewNode = (compact: boolean) => (
    <PublishPreview
      channel={focus}
      image={previewUrl}
      imageError={previewError}
      photo={set.photo}
      caption={focusCaption}
      title={promo.DESTINO}
      compact={compact}
    />
  )

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/40 max-lg:items-end" onMouseDown={(e) => e.target === e.currentTarget && !running && onClose()}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Publicar"
        className="flex h-full w-full flex-col bg-white shadow-2xl lg:max-w-[880px] max-lg:h-[calc(100dvh-12px)] max-lg:rounded-t-3xl"
      >
        <div className="flex justify-center pt-2 lg:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-2.5 lg:h-14 lg:py-0">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[15px] font-black">
              <Send className="h-4 w-4 text-amber-500" />
              Publicar
            </h2>
            <p className="truncate text-[11.5px] text-gray-500">{[promo.DESTINO, promo.HOTEL].filter(Boolean).join(" · ")}</p>
          </div>
          <button type="button" onClick={onClose} disabled={running} aria-label="Fechar" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 lg:px-5">
            <div className="mb-5 rounded-2xl bg-gray-50 py-4 lg:hidden">{previewNode(true)}</div>

            {!canPublish && (
              <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] font-semibold text-amber-900">
                {UNSAVED}
              </p>
            )}
            {load === "loading" && (
              <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-[13px] font-semibold text-gray-600">
                <Spinner className="h-3.5 w-3.5" /> Carregando situação dos canais…
              </p>
            )}
            {load === "error" && (
              <p role="alert" className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-semibold text-red-700">
                Não deu para carregar a situação dos canais.
                <button type="button" onClick={() => void refresh()} className="font-bold text-red-800 underline underline-offset-2 hover:text-red-900">
                  Tentar de novo
                </button>
              </p>
            )}

            <section aria-labelledby="pub-canais">
              <h3 id="pub-canais" className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Canais
              </h3>
              <ChannelList
                selected={selected}
                disabled={!canPublish || running}
                focus={focus}
                status={status}
                run={run}
                onToggle={toggle}
                onFocus={focusChannel}
                onRetry={(c) => void retry(c)}
                renderShare={shareFor}
              />
            </section>

            <ScheduleBox
              enabled={selected.has("fb-feed") && canPublish}
              busy={running}
              when={when}
              onWhen={setWhen}
              value={scheduleAt}
              onValue={(v) => {
                setScheduleAt(v)
                setScheduleMsg(null)
              }}
              message={scheduleMsg}
            />

            <section aria-labelledby="pub-legenda" className="mt-6">
              <h3 id="pub-legenda" className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Legenda
              </h3>
              <CaptionTabs captions={captions} tab={tab} onTab={setTab} onChange={editCaption} onRegenerate={regenerate} disabled={running} />
            </section>
          </div>

          <aside className="hidden w-[340px] shrink-0 flex-col items-center overflow-y-auto border-l border-gray-200 bg-gray-50 px-5 py-6 lg:flex" aria-label="Prévia">
            <p className="mb-4 self-start text-[11px] font-bold uppercase tracking-wider text-gray-500">Prévia</p>
            {previewNode(false)}
            <p className="mt-4 text-center text-[11.5px] text-gray-400">Clique num canal para ver como fica.</p>
          </aside>
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t border-gray-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="relative">
            <button
              type="button"
              onClick={() => setDownloadOpen((o) => !o)}
              aria-expanded={downloadOpen}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] font-bold text-gray-700 hover:border-gray-300"
            >
              <Download className="h-4 w-4" />
              Baixar
            </button>
            {downloadOpen && (
              <>
                <div className="fixed inset-0 z-10" onMouseDown={() => setDownloadOpen(false)} />
                <div className="absolute bottom-full left-0 z-20 mb-1 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                  {[
                    { which: downloadFormat as ArtFormat | "all", text: `${FORMATS[downloadFormat].label} (JPG)` },
                    { which: "all" as const, text: "Os 4 em .zip" },
                  ].map((o) => (
                    <button
                      key={o.which}
                      type="button"
                      onClick={() => {
                        setDownloadOpen(false)
                        onDownload(o.which, "image/jpeg")
                      }}
                      className="block w-full px-3 py-2 text-left text-[13px] font-semibold text-gray-700 hover:bg-amber-50"
                    >
                      {o.text}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onDone}
              disabled={running}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-bold text-gray-700 hover:border-gray-300 disabled:opacity-40"
            >
              Concluir
            </button>
            <button
              type="button"
              onClick={() => void publishAll()}
              disabled={!canPublish || load !== "ready" || running || !toPublish.length}
              title={waOnly ? "O WhatsApp é compartilhado pelos botões do canal" : undefined}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              Publicar{toPublish.length ? ` (${toPublish.length})` : ""}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  )
}
