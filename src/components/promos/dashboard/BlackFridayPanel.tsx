"use client"

import { useEffect, useMemo, useState } from "react"
import { ExternalLink, Eye, Loader2, Zap } from "lucide-react"
import { Countdown } from "@/components/blackfriday/Countdown"
import {
  formatCampaignDate,
  getBlackFridayPhase,
  getCountdownTarget,
  type BlackFridayPhase,
  type BlackFridaySettings,
} from "@/config/blackFriday"
import type { PromoData } from "./types"
import { getPromoStatus } from "./types"

const HOUR = 3_600_000

const phaseLabel: Record<BlackFridayPhase, string> = {
  desligada: "Página desligada",
  esquenta: "Esquenta · contagem para abrir",
  "ao-vivo": "Black Friday no ar",
  encerrada: "Campanha encerrada",
}

/** ISO → valor do <input type="datetime-local"> no fuso do navegador */
const toLocalInput = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fromLocalInput = (value: string) => new Date(value).toISOString()

/**
 * Controle da campanha na central de promos: liga a página /black-friday,
 * ajusta início e fim da contagem (antecipar, estender, encerrar) e o desconto do título.
 */
export function BlackFridayPanel({ promos }: { promos: PromoData[] }) {
  const [saved, setSaved] = useState<BlackFridaySettings | null>(null)
  const [draft, setDraft] = useState<{ startsAt: string; endsAt: string; maxDiscount: string } | null>(null)
  const [phase, setPhase] = useState<BlackFridayPhase | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null)

  const load = (settings: BlackFridaySettings) => {
    setSaved(settings)
    setDraft({ startsAt: toLocalInput(settings.startsAt), endsAt: toLocalInput(settings.endsAt), maxDiscount: String(settings.maxDiscount) })
    setPhase(getBlackFridayPhase(settings))
  }

  useEffect(() => {
    fetch("/api/black-friday")
      .then((r) => r.json())
      .then((data) => load(data.settings))
      .catch(() => setMessage({ kind: "error", text: "Não foi possível carregar a Black Friday" }))
  }, [])

  // A fase vira sozinha quando a contagem zera
  useEffect(() => {
    if (!saved) return
    const id = window.setInterval(() => setPhase(getBlackFridayPhase(saved)), 15_000)
    return () => window.clearInterval(id)
  }, [saved])

  const tagged = useMemo(
    () => promos.filter((p) => p.CAMPAIGN === "black-friday" && getPromoStatus(p) === "no-site").length,
    [promos],
  )

  const save = async (next: BlackFridaySettings, okText: string) => {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch("/api/black-friday", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Não foi possível salvar")
      load(data.settings)
      setMessage({ kind: "ok", text: okText })
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível salvar" })
    } finally {
      setBusy(false)
    }
  }

  if (!saved || !draft || !phase) {
    return (
      <section aria-label="Campanha Black Friday" className="max-w-7xl mx-auto mb-4 sm:mb-6 rounded-[20px] bg-[#0B0B0F] p-5 text-white/60 text-sm">
        {message?.text || "Carregando Black Friday…"}
      </section>
    )
  }

  const target = getCountdownTarget(saved, phase)
  const dirty =
    draft.startsAt !== toLocalInput(saved.startsAt) ||
    draft.endsAt !== toLocalInput(saved.endsAt) ||
    draft.maxDiscount !== String(saved.maxDiscount)

  const saveDraft = () => {
    const maxDiscount = Number.parseInt(draft.maxDiscount, 10)
    if (!draft.startsAt || !draft.endsAt || !Number.isFinite(maxDiscount)) {
      setMessage({ kind: "error", text: "Preencha início, fim e desconto" })
      return
    }
    save(
      { ...saved, startsAt: fromLocalInput(draft.startsAt), endsAt: fromLocalInput(draft.endsAt), maxDiscount },
      "Datas salvas. O site atualiza na próxima visita.",
    )
  }

  const startNow = () => {
    const now = Date.now()
    const endsAt = new Date(saved.endsAt).getTime() > now ? saved.endsAt : new Date(now + 7 * 24 * HOUR).toISOString()
    save({ ...saved, enabled: true, startsAt: new Date(now).toISOString(), endsAt }, "Black antecipada: as ofertas já estão no ar.")
  }
  const extend = (hours: number) => {
    const now = Date.now()
    const base = Math.max(new Date(saved.endsAt).getTime(), now)
    save({ ...saved, endsAt: new Date(base + hours * HOUR).toISOString() }, `Black estendida até ${formatCampaignDate(new Date(base + hours * HOUR))}.`)
  }
  const endNow = () => {
    if (!window.confirm("Encerrar a Black Friday agora? A página sai do ar e a home volta ao normal.")) return
    const now = Date.now()
    const startsAt = new Date(saved.startsAt).getTime() < now ? saved.startsAt : new Date(now - HOUR).toISOString()
    save({ ...saved, startsAt, endsAt: new Date(now).toISOString() }, "Black encerrada. A página saiu do ar.")
  }

  const field = "w-full rounded-[10px] border border-white/15 bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-[#FED400]"
  const ghost = "inline-flex items-center justify-center gap-2 rounded-[10px] border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"

  return (
    <section aria-label="Campanha Black Friday" className="max-w-7xl mx-auto mb-4 sm:mb-6 overflow-hidden rounded-[20px] bg-[#0B0B0F] text-white shadow-lg">
      <div className="flex flex-col gap-5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FED400]">
              <Zap className="h-6 w-6 fill-black text-black" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#FED400]">{phaseLabel[phase]}</p>
              <p className="text-base sm:text-lg font-black leading-tight">Página Black Friday</p>
              <p className="text-xs text-white/60 mt-0.5">
                {tagged} oferta{tagged === 1 ? "" : "s"} marcada{tagged === 1 ? "" : "s"} como Black Friday no site.
                {tagged === 0 && " Sem marcadas, a página mostra as promos com preço “de”. Marque no cadastro da promo."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {target && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">{phase === "esquenta" ? "Abre em" : "Fecha em"}</span>
                <Countdown target={target} tone="dark" size="sm" />
              </div>
            )}
            <button
              type="button"
              role="switch"
              aria-checked={saved.enabled}
              disabled={busy}
              onClick={() =>
                save(
                  { ...saved, enabled: !saved.enabled },
                  saved.enabled ? "Página desligada. A home voltou ao normal." : "Página ligada no site.",
                )
              }
              className={`inline-flex items-center gap-3 rounded-[12px] px-4 py-2.5 text-sm font-bold disabled:opacity-60 ${
                saved.enabled ? "bg-[#FED400] text-black" : "bg-white/10 text-white"
              }`}
            >
              <span className={`relative h-5 w-9 rounded-full transition ${saved.enabled ? "bg-black" : "bg-white/30"}`} aria-hidden="true">
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${saved.enabled ? "left-[18px] bg-[#FED400]" : "left-0.5 bg-white"}`}
                />
              </span>
              {saved.enabled ? "Página no ar" : "Ativar página"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_160px_auto] lg:items-end">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/70">
            Início da Black (fim do esquenta)
            <input type="datetime-local" className={field} value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/70">
            Fim da Black
            <input type="datetime-local" className={field} value={draft.endsAt} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/70">
            Título “até X% OFF”
            <input
              type="number"
              min={1}
              max={90}
              className={field}
              value={draft.maxDiscount}
              onChange={(e) => setDraft({ ...draft, maxDiscount: e.target.value })}
            />
          </label>
          <button
            type="button"
            onClick={saveDraft}
            disabled={busy || !dirty}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#FED400] px-4 py-2 text-sm font-bold text-black hover:bg-[#FED400]/90 disabled:opacity-40"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar datas
          </button>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Ajustes rápidos da contagem">
            {phase !== "ao-vivo" && (
              <button type="button" className={ghost} onClick={startNow} disabled={busy}>
                Antecipar: começar agora
              </button>
            )}
            {phase === "ao-vivo" && (
              <>
                <button type="button" className={ghost} onClick={() => extend(24)} disabled={busy}>
                  Estender +24h
                </button>
                <button type="button" className={ghost} onClick={() => extend(24 * 7)} disabled={busy}>
                  Estender +7 dias
                </button>
                <button type="button" className={`${ghost} text-red-300 border-red-300/40`} onClick={endNow} disabled={busy}>
                  Encerrar agora
                </button>
              </>
            )}
            {phase === "encerrada" && (
              <button type="button" className={ghost} onClick={() => extend(24)} disabled={busy}>
                Reabrir por +24h
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/black-friday/preview" target="_blank" rel="noopener noreferrer" className={ghost}>
              <Eye className="h-4 w-4" />
              Pré-visualizar
            </a>
            {(phase === "esquenta" || phase === "ao-vivo") && (
              <a
                href="/black-friday"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-white px-3 py-2 text-sm font-bold text-black hover:bg-white/90"
              >
                Ver no site
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {message && (
          <p role="status" className={`text-sm ${message.kind === "ok" ? "text-[#FED400]" : "text-red-300"}`}>
            {message.text}
          </p>
        )}
      </div>
    </section>
  )
}
