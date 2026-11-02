"use client"

import type React from "react"
import { Check, Globe, MessageCircle, RotateCcw } from "lucide-react"
import { Facebook, GoogleG, Instagram } from "@/components/ui/brand-icons"
import { CHANNELS, type Channel } from "@/lib/channels"
import type { ChannelState } from "@/lib/publishState"
import { FORMATS, type ArtFormat } from "../types"
import { Spinner } from "../panels/ui"
import { friendlyError, stateLabel } from "./publishView"

/** Andamento do envio nesta sessão do painel */
export type Run = { phase: "busy" } | { phase: "done" } | { phase: "error"; error: string }

const RATIO: Record<ArtFormat, string> = { story: "9:16", feed: "4:5", square: "1:1", landscape: "1,91:1" }

function ChannelIcon({ channel }: { channel: Channel }) {
  const tile = "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
  if (channel === "site")
    return (
      <span className={`${tile} bg-[#1D3153]`}>
        <Globe className="h-[18px] w-[18px]" />
      </span>
    )
  if (channel === "google")
    return (
      <span className={`${tile} border border-gray-200 bg-white`}>
        <GoogleG className="h-[18px] w-[18px]" />
      </span>
    )
  if (channel === "ig-feed" || channel === "ig-story")
    return (
      <span className={`${tile} bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]`}>
        <Instagram className="h-[18px] w-[18px]" />
      </span>
    )
  if (channel === "fb-feed" || channel === "fb-story")
    return (
      <span className={`${tile} bg-[#1877F2]`}>
        <Facebook className="h-[18px] w-[18px]" />
      </span>
    )
  return (
    <span className={`${tile} bg-[#25D366]`}>
      <MessageCircle className="h-[18px] w-[18px]" />
    </span>
  )
}

const hintOf = (channel: Channel, format: ArtFormat | null, forced: boolean) => {
  if (channel === "site") return "Página da oferta, com a foto da promo"
  if (forced) return "Toda oferta no site vai para o Google"
  if (!format) return ""
  const base = `${FORMATS[format].label} ${RATIO[format]}`
  if (channel === "google") return `${base} · perfil da empresa`
  if (channel === "ig-story" || channel === "fb-story") return `${base} · sem legenda`
  if (channel === "wa-channel" || channel === "wa-status") return `${base} · pelo celular`
  return `${base} · com legenda`
}

const toneOf = (s: ChannelState | undefined) => {
  switch (s?.state) {
    case "published":
    case "shared":
      return "text-emerald-700"
    case "scheduled":
      return "text-sky-700"
    case "simulated":
      return "text-violet-700"
    case "error":
      return "text-red-600"
    default:
      return "text-gray-400"
  }
}

interface RowProps {
  channel: Channel
  checked: boolean
  forced: boolean
  disabled: boolean
  focused: boolean
  state: ChannelState | undefined
  run: Run | undefined
  onToggle: () => void
  onFocus: () => void
  onRetry: () => void
  children?: React.ReactNode
}

function ChannelRow({ channel, checked, forced, disabled, focused, state, run, onToggle, onFocus, onRetry, children }: RowProps) {
  const meta = CHANNELS.find((c) => c.id === channel)!
  const busy = run?.phase === "busy"
  // Depois de um envio certo nesta sessão, o erro antigo gravado não aparece mais
  const error =
    run?.phase === "error"
      ? friendlyError(run.error, meta.label)
      : run?.phase !== "done" && state?.state === "error"
        ? friendlyError(state.error, meta.label)
        : null
  return (
    <li
      className={`rounded-2xl border bg-white transition-colors [-webkit-tap-highlight-color:transparent] ${focused ? "border-amber-400 ring-2 ring-amber-100" : "border-gray-200 hover:border-gray-300"}`}
      data-channel={channel}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <label className={`flex shrink-0 items-center [-webkit-tap-highlight-color:transparent] ${disabled || forced ? "cursor-not-allowed" : "cursor-pointer"}`} title={forced ? "Toda oferta no site vai para o Google" : undefined}>
          <input
            type="checkbox"
            className="peer sr-only focus:outline-none"
            checked={checked}
            disabled={disabled || forced}
            onChange={onToggle}
            aria-label={meta.label}
          />
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-amber-300 ${checked ? "border-amber-500 bg-amber-500 text-white" : "border-gray-300 bg-white"} ${disabled || forced ? "opacity-60" : ""}`}
          >
            {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
        </label>
        <button type="button" onClick={onFocus} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Ver prévia: ${meta.label}`}>
          <ChannelIcon channel={channel} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-bold text-gray-900">{meta.label}</span>
            <span className="block truncate text-[11.5px] text-gray-500">{hintOf(channel, meta.format, forced)}</span>
          </span>
        </button>
        <span className="max-w-[46%] shrink-0 text-right text-[12px] font-semibold leading-tight" aria-live="polite" data-status>
          {busy ? (
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <Spinner className="h-3.5 w-3.5" /> Publicando…
            </span>
          ) : error ? (
            <span className="text-red-600">Erro</span>
          ) : run?.phase === "done" && (!state || state.state === "error") ? (
            <span className="text-emerald-700">✓</span>
          ) : (
            <span className={toneOf(state)}>{stateLabel(state, meta.label)}</span>
          )}
        </span>
      </div>
      {!busy && (error || state?.stale) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-gray-100 px-3 py-1.5 text-[12px]">
          {error ? (
            <>
              <span className="min-w-0 flex-1 font-semibold text-red-600">Erro: {error}</span>
              {!disabled && (
                <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-bold text-gray-700 hover:bg-gray-100">
                  <RotateCcw className="h-3 w-3" /> Tentar de novo
                </button>
              )}
            </>
          ) : (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">oferta alterada depois do post</span>
          )}
        </div>
      )}
      {children}
    </li>
  )
}

interface ChannelListProps {
  selected: Set<Channel>
  disabled: boolean
  focus: Channel
  status: Record<Channel, ChannelState> | null
  run: Partial<Record<Channel, Run>>
  onToggle: (c: Channel) => void
  onFocus: (c: Channel) => void
  onRetry: (c: Channel) => void
  /** Botões do WhatsApp para a linha (aparecem com o canal marcado) */
  renderShare: (c: "wa-channel" | "wa-status") => React.ReactNode
}

export function ChannelList({ selected, disabled, focus, status, run, onToggle, onFocus, onRetry, renderShare }: ChannelListProps) {
  return (
    <ul className="space-y-2">
      {CHANNELS.map(({ id }) => (
        <ChannelRow
          key={id}
          channel={id}
          checked={selected.has(id)}
          forced={id === "google" && selected.has("site")}
          disabled={disabled}
          focused={focus === id}
          state={status?.[id]}
          run={run[id]}
          onToggle={() => onToggle(id)}
          onFocus={() => onFocus(id)}
          onRetry={() => onRetry(id)}
        >
          {(id === "wa-channel" || id === "wa-status") && selected.has(id) && !disabled ? renderShare(id) : null}
        </ChannelRow>
      ))}
    </ul>
  )
}
