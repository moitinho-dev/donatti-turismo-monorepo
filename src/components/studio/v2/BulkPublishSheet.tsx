"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Send, X } from "lucide-react"
import type { PromoData } from "@/components/promos/dashboard/types"
import { CHANNELS, type Channel } from "@/lib/channels"
import { markShared, publishChannel } from "@/lib/client/publishChannel"
import type { PublishState } from "@/lib/publishState"
import { slugify } from "@/lib/utils"
import type { ArtSet } from "../artSet"
import { Spinner } from "../panels/ui"
import { BulkChannels } from "./BulkChannels"
import { BulkProgress, type ProgressError } from "./BulkProgress"
import { CaptionSection, FeedSection, Heading, WhatsAppSection } from "./BulkSections"
import { googleBlockedBySite, jobsFor, republishPrompts, type BulkJob, type FeedMode, type WaMode } from "./bulkPlan"
import {
  apiJobs,
  bulkSelection,
  doneCount,
  feedGroups,
  groupCaptionDefault,
  progressRows,
  promoCaptions,
  republishMessage,
  sentPromoIds,
  waMessageDefault,
  type JobRun,
} from "./bulkView"
import { ScheduleBox, localInput } from "./ScheduleBox"
import { UPLOAD_ERROR, deviceOf, readRemembered, scheduleError, toggleChannel, writeRemembered, type Device } from "./publishView"
import { useBulkImages, useBulkStatus } from "./useBulkData"

export interface BulkPublishSheetProps {
  /** Na ordem da seleção */
  promos: PromoData[]
  /** Arte de cada promo (a da grade) */
  sets: Record<string, ArtSet | undefined>
  onClose: () => void
  /** Site publicado de verdade (não simulado): campos do site como ficaram no servidor */
  onSitePublished: (promoId: string, fields: Record<string, unknown>) => void
  /** Depois de cada rodada: promos com algum envio que saiu de verdade */
  onSent: (promoIds: Set<string>) => void
}

const label = (c: Channel) => CHANNELS.find((x) => x.id === c)!.label
const formatOf = (c: Channel) => CHANNELS.find((x) => x.id === c)!.format
const isWa = (c: Channel): c is "wa-channel" | "wa-status" => c === "wa-channel" || c === "wa-status"
const DEFAULT_SELECTION: Channel[] = ["site", "google"]
const SITE_FIRST = "Publique no site antes"

/** Publicar todas: canais, como sai no feed e no WhatsApp, legendas e o andamento de cada promo × canal */
export function BulkPublishSheet({ promos, sets, onClose, onSitePublished, onSent }: BulkPublishSheetProps) {
  const idsKey = promos.map((p) => p.id).join(",")
  const ids = useMemo(() => idsKey.split(","), [idsKey])
  const byId = useMemo(() => Object.fromEntries(promos.map((p) => [p.id, p])), [promos])

  const { status, load, reload: loadStatus } = useBulkStatus(promos, ids)

  // Marcados ao abrir: decididos uma vez, com a primeira situação lida; depois valem os cliques
  const [remembered] = useState(readRemembered)
  const [seed, setSeed] = useState<Set<Channel> | null>(null)
  if (load === "ready" && !seed) setSeed(bulkSelection(status, ids, remembered))
  const [picked, setPicked] = useState<Set<Channel> | null>(null)
  const selected = useMemo(() => picked ?? seed ?? new Set(DEFAULT_SELECTION), [picked, seed])

  const [feed, setFeed] = useState<FeedMode>("single")
  const [wa, setWa] = useState<WaMode>("batch")
  const [when, setWhen] = useState<"now" | "schedule">("now")
  const [scheduleAt, setScheduleAt] = useState(() => localInput(new Date(Date.now() + 60 * 60_000)))
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null)
  // O painel só existe no navegador (o Studio carrega sem SSR)
  const [device] = useState<Device>(() => deviceOf(navigator.userAgent, navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1))
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState<{ i: number; n: number } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !running && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, running])

  const jobs = useMemo(() => jobsFor(ids, [...selected], feed, wa), [ids, selected, feed, wa])
  const toPublish = apiJobs(jobs)
  const hasFeed = selected.has("ig-feed") || selected.has("fb-feed")
  const scheduling = when === "schedule" && selected.has("fb-feed")

  // ---------------------------------------------------------------------------
  // Legendas: a de cada promo (salva com a arte ou gerada) ou uma por carrossel, editável
  // ---------------------------------------------------------------------------
  const savedOf = (id: string) => sets[id]?.captions
  const groups = feedGroups(ids)
  const [groupText, setGroupText] = useState<Record<string, string>>({})
  const groupDefault = (g: string[]) => groupCaptionDefault(g.map((id) => byId[id]))
  const groupCaption = (g: string[]) => groupText[g.join(",")] ?? groupDefault(g)

  const [waText, setWaText] = useState<Partial<Record<WaMode, string>>>({})
  const waDefault = (mode: WaMode) => waMessageDefault(mode, promos, savedOf)
  const waMessage = waText[wa] ?? waDefault(wa)

  const { renderOnce, uploadOnce } = useBulkImages(promos, sets)

  // ---------------------------------------------------------------------------
  // Envios: um por vez, na ordem do plano
  // ---------------------------------------------------------------------------
  const [runs, setRuns] = useState<Record<string, JobRun>>({})
  const runsRef = useRef(runs)
  const setRun = (key: string, run: JobRun | null) => {
    const next = { ...runsRef.current }
    if (run) next[key] = run
    else delete next[key]
    runsRef.current = next
    setRuns(next)
  }
  const siteFailed = useRef(new Set<string>())
  const progressRef = useRef<HTMLElement>(null)

  const runJob = async (j: BulkJob) => {
    setRun(j.key, { phase: "busy" })
    const f = formatOf(j.channel)
    const images: string[] = []
    if (f && j.channel !== "site") {
      try {
        for (const id of j.promoIds) images.push(await uploadOnce(id, f))
      } catch (err) {
        setRun(j.key, { phase: "error", error: err instanceof Error ? err.message : UPLOAD_ERROR })
        return
      }
    }
    const feedCaption = j.channel === "ig-feed" || j.channel === "fb-feed"
    const caption = !feedCaption
      ? undefined
      : j.promoIds.length > 1
        ? groupCaption(j.promoIds)
        : promoCaptions(byId[j.promoIds[0]], savedOf(j.promoIds[0]))[j.channel === "ig-feed" ? "instagram" : "facebook"]
    const res = await publishChannel(j.promoIds[0], j.channel, {
      images,
      caption,
      scheduledAt: j.channel === "fb-feed" && scheduling ? new Date(scheduleAt).toISOString() : undefined,
      group: j.promoIds.length > 1 && (j.kind === "carousel" || j.kind === "album") ? { kind: j.kind, promoIds: j.promoIds } : undefined,
    })
    setRun(j.key, res.ok ? { phase: "done", status: res.status ?? "published" } : { phase: "error", error: res.error || "" })
    if (j.channel === "site") {
      const id = j.promoIds[0]
      if (res.ok) siteFailed.current.delete(id)
      else siteFailed.current.add(id)
      if (res.ok && res.status !== "simulated") onSitePublished(id, { SITE_PUBLISHED: true, ...res.promo })
    }
  }

  /** WhatsApp: registra "compartilhado" em cada promo do envio */
  const markJob = async (j: BulkJob) => {
    if (!isWa(j.channel)) return
    setRun(j.key, { phase: "busy" })
    let last: PublishState = "shared"
    for (const id of j.promoIds) {
      const res = await markShared(id, j.channel)
      if (!res.ok) {
        setRun(j.key, { phase: "error", error: res.error || "" })
        return
      }
      last = res.status ?? "shared"
    }
    setRun(j.key, { phase: "done", status: last })
  }

  const finish = () => {
    onSent(sentPromoIds(jobs, runsRef.current))
    void loadStatus(true)
  }

  const publishAll = async () => {
    if (running || load !== "ready" || !toPublish.length) return
    writeRemembered(selected)
    if (scheduling) {
      const err = scheduleError(scheduleAt)
      setScheduleMsg(err)
      if (err) return
    }
    // Uma pergunta por canal com promos já publicadas; "Cancelar" pula só aquele canal
    const skip = new Set<Channel>()
    for (const p of republishPrompts(toPublish, status)) if (!window.confirm(republishMessage(label(p.channel), p.count))) skip.add(p.channel)
    // Pulados guardam o que já aconteceu nesta sessão (um erro antigo continua com "Tentar de novo")
    for (const j of toPublish) {
      if (!skip.has(j.channel)) setRun(j.key, null)
      else if (!runsRef.current[j.key]) setRun(j.key, { phase: "skipped" })
    }
    const queue = toPublish.filter((j) => !skip.has(j.channel))
    if (!queue.length) return
    siteFailed.current = new Set()
    setRunning(true)
    // O andamento fica no fim do painel: leva a pessoa até ele
    progressRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    try {
      for (const [i, j] of queue.entries()) {
        setStep({ i: i + 1, n: queue.length })
        if (googleBlockedBySite(j, siteFailed.current)) setRun(j.key, { phase: "error", error: SITE_FIRST })
        else await runJob(j)
      }
    } finally {
      setRunning(false)
      setStep(null)
      finish()
    }
  }

  const retry = async (j: BulkJob) => {
    if (running) return
    setRunning(true)
    try {
      if (isWa(j.channel)) await markJob(j)
      else if (googleBlockedBySite(j, siteFailed.current)) setRun(j.key, { phase: "error", error: SITE_FIRST })
      else await runJob(j)
    } finally {
      setRunning(false)
      finish()
    }
  }

  const shared = async (j: BulkJob | undefined) => {
    if (!j || running) return
    setRunning(true)
    try {
      await markJob(j)
    } finally {
      setRunning(false)
      finish()
    }
  }

  const toggle = (c: Channel) => {
    const next = toggleChannel(selected, c)
    setPicked(next)
    writeRemembered(next)
    if (!next.has("fb-feed")) setWhen("now")
  }

  // ---------------------------------------------------------------------------
  // WhatsApp: imagens de todas as promos do envio
  // ---------------------------------------------------------------------------
  const waChannelJob = jobs.find((j) => j.channel === "wa-channel")
  const waStatusJob = jobs.find((j) => j.channel === "wa-status")
  const channelIdsKey = waChannelJob?.promoIds.join(",") || ""
  const getSquares = useCallback(() => Promise.all(channelIdsKey.split(",").map((id) => renderOnce(id, "square"))), [channelIdsKey, renderOnce])
  const getStories = useCallback(() => Promise.all(ids.map((id) => renderOnce(id, "story"))), [ids, renderOnce])
  const waBase = wa === "one" && promos[0] ? slugify(String(promos[0].DESTINO || "oferta")) || "oferta" : "ofertas"

  // ---------------------------------------------------------------------------
  // Andamento
  // ---------------------------------------------------------------------------
  const rows = progressRows(ids, selected, jobs, runs)
  const names = Object.fromEntries(promos.map((p) => [p.id, p.DESTINO]))
  const errors: ProgressError[] = []
  for (const row of rows)
    for (const cell of row.cells) {
      const r = cell.run
      if (!cell.job || r?.phase !== "error" || errors.some((e) => e.job.key === cell.job!.key)) continue
      const n = cell.job.promoIds.length
      const title = cell.label ? `${cell.label} · ${n} promoções` : n > 1 ? `${n} promoções` : names[row.promoId]
      errors.push({ job: cell.job, title, error: r.error })
    }
  const done = Object.fromEntries(CHANNELS.map((c) => [c.id, doneCount(status, ids, c.id)])) as Partial<Record<Channel, number>>
  const waOnly = !toPublish.length && (selected.has("wa-channel") || selected.has("wa-status"))

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/40 max-lg:items-end" onMouseDown={(e) => e.target === e.currentTarget && !running && onClose()}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Publicar todas"
        className="flex h-full w-full flex-col bg-white shadow-2xl lg:max-w-[880px] max-lg:h-[calc(100dvh-12px)] max-lg:rounded-t-3xl"
      >
        <div className="flex justify-center pt-2 lg:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-2.5 lg:h-14 lg:py-0">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[15px] font-black">
              <Send className="h-4 w-4 text-amber-500" />
              Publicar todas
            </h2>
            <p className="truncate text-[11.5px] text-gray-500">{promos.length} promoções</p>
          </div>
          <button type="button" onClick={onClose} disabled={running} aria-label="Fechar" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 lg:px-6">
          {load === "loading" && (
            <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-[13px] font-semibold text-gray-600">
              <Spinner className="h-3.5 w-3.5" /> Carregando situação dos canais…
            </p>
          )}
          {load === "error" && (
            <p role="alert" className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-semibold text-red-700">
              Não deu para carregar a situação dos canais.
              <button type="button" onClick={() => void loadStatus()} className="font-bold text-red-800 underline underline-offset-2 hover:text-red-900">
                Tentar de novo
              </button>
            </p>
          )}

          <section aria-labelledby="bulk-canais">
            <Heading id="bulk-canais">Canais</Heading>
            <BulkChannels selected={selected} disabled={running || load === "loading"} feed={feed} wa={wa} done={done} total={ids.length} onToggle={toggle} />
          </section>

          {hasFeed && <FeedSection feed={feed} onFeed={setFeed} disabled={running} groups={groups} instagram={selected.has("ig-feed")} facebook={selected.has("fb-feed")} />}

          <ScheduleBox
            enabled={selected.has("fb-feed")}
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

          {hasFeed && (
            <CaptionSection
              carousel={feed === "carousel"}
              album={!selected.has("ig-feed")}
              groups={groups}
              disabled={running}
              captionOf={groupCaption}
              onChange={(g, text) => setGroupText((t) => ({ ...t, [g.join(",")]: text }))}
              onRegenerate={(g) => setGroupText((t) => ({ ...t, [g.join(",")]: groupDefault(g) }))}
            />
          )}

          {(selected.has("wa-channel") || selected.has("wa-status")) && (
            <WhatsAppSection
              channel={selected.has("wa-channel")}
              status={selected.has("wa-status")}
              mode={wa}
              onMode={setWa}
              message={waMessage}
              onMessage={(text) => setWaText((t) => ({ ...t, [wa]: text }))}
              onRegenerate={() => setWaText((t) => ({ ...t, [wa]: waDefault(wa) }))}
              running={running}
              device={device}
              getSquares={getSquares}
              getStories={getStories}
              filenameBase={waBase}
              onShared={(c) => void shared(c === "wa-channel" ? waChannelJob : waStatusJob)}
            />
          )}

          {selected.size > 0 && (
            <section ref={progressRef} aria-labelledby="bulk-andamento" className="mt-6 scroll-mt-4">
              <Heading id="bulk-andamento">Andamento</Heading>
              <BulkProgress rows={rows} names={names} errors={errors} busy={running} onRetry={(j) => void retry(j)} />
            </section>
          )}
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t border-gray-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-gray-600" role="status">
            {step ? `Enviando ${step.i} de ${step.n}…` : errors.length ? `${errors.length === 1 ? "1 envio" : `${errors.length} envios`} com erro` : ""}
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={running}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-bold text-gray-700 hover:border-gray-300 disabled:opacity-40"
          >
            Concluir
          </button>
          <button
            type="button"
            onClick={() => void publishAll()}
            disabled={running || load !== "ready" || !toPublish.length}
            title={waOnly ? "O WhatsApp é compartilhado pelos botões do canal" : undefined}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            Publicar{toPublish.length ? ` (${toPublish.length})` : ""}
          </button>
        </footer>
      </aside>
    </div>
  )
}
