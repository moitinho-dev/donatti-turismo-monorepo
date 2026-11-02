"use client"

import { Check } from "lucide-react"
import { CHANNELS, type Channel } from "@/lib/channels"
import type { FeedMode, WaMode } from "./bulkPlan"
import { ChannelIcon } from "./ChannelList"

/** Como cada canal sai com várias promos */
function hintOf(c: Channel, feed: FeedMode, wa: WaMode, forced: boolean): string {
  switch (c) {
    case "site":
      return "Uma página por promo"
    case "google":
      return forced ? "Toda oferta no site vai para o Google" : "Um post por promo · Paisagem"
    case "ig-feed":
      return feed === "carousel" ? "Carrossel com as artes · Feed 4:5" : "Um post por promo · Feed 4:5"
    case "fb-feed":
      return feed === "carousel" ? "Álbum com as artes · Quadrado" : "Um post por promo · Quadrado"
    case "ig-story":
    case "fb-story":
      return "Um story por promo, sem legenda"
    case "wa-channel":
      return wa === "batch" ? "Mensagem com a lista e as imagens" : "Imagem da primeira promo e mensagem"
    case "wa-status":
      return "Imagens story de todas, sem texto"
  }
}

interface Props {
  selected: Set<Channel>
  disabled: boolean
  feed: FeedMode
  wa: WaMode
  /** Promos já publicadas e em dia em cada canal */
  done: Partial<Record<Channel, number>>
  total: number
  onToggle: (c: Channel) => void
}

/** Lista de canais do Publicar todas: marcar, como sai e quantas já estão publicadas */
export function BulkChannels({ selected, disabled, feed, wa, done, total, onToggle }: Props) {
  return (
    <ul className="grid gap-2 md:grid-cols-2">
      {CHANNELS.map(({ id, label }) => {
        const checked = selected.has(id)
        const forced = id === "google" && selected.has("site")
        const n = done[id] || 0
        return (
          <li key={id} data-channel={id}>
            <label
              className={`flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 transition-colors [-webkit-tap-highlight-color:transparent] ${checked ? "border-amber-300" : "border-gray-200 hover:border-gray-300"} ${disabled || forced ? "cursor-not-allowed" : "cursor-pointer"}`}
              title={forced ? "Toda oferta no site vai para o Google" : undefined}
            >
              <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled || forced} onChange={() => onToggle(id)} aria-label={label} />
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-amber-300 ${checked ? "border-amber-500 bg-amber-500 text-white" : "border-gray-300 bg-white"} ${disabled || forced ? "opacity-60" : ""}`}
              >
                {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              <ChannelIcon channel={id} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-bold text-gray-900">{label}</span>
                <span className="block truncate text-[11.5px] text-gray-500">{hintOf(id, feed, wa, forced)}</span>
              </span>
              {n > 0 && (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700" title={`${n} de ${total} já publicadas`}>
                  ✓ {n}/{total}
                </span>
              )}
            </label>
          </li>
        )
      })}
    </ul>
  )
}
