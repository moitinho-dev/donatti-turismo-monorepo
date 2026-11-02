"use client"

import { useEffect, useRef } from "react"
import { Check, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react"

export interface QueueItem {
  id: string
  label: string
  thumb: string | null
  published: boolean
}

interface QueueStripProps {
  items: QueueItem[]
  index: number
  onGo: (index: number) => void
  /** Trocando de promo (salvando a atual): botões travados */
  busy?: boolean
  compact?: boolean
}

/** Fila de promos embaixo da arte: miniaturas na ordem, a atual destacada, "Anterior" / "Próxima" */
export function QueueStrip({ items, index, onGo, busy, compact }: QueueStripProps) {
  const listRef = useRef<HTMLDivElement | null>(null)

  // A promo aberta sempre à vista na tira
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[aria-current="true"]')
    el?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [index])

  const h = compact ? 56 : 90
  const w = Math.round(h * 0.8)
  const hasPrev = index > 0
  const hasNext = index < items.length - 1

  return (
    <nav aria-label="Fila de promoções" className={`flex shrink-0 items-center gap-2 ${compact ? "px-2 pb-2 pt-1" : "px-4 pb-3 pt-2"}`}>
      <StepButton dir="prev" disabled={!hasPrev || busy} compact={compact} onClick={() => onGo(index - 1)} />

      <div ref={listRef} className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
        {/* mx-auto centraliza quando sobra espaço e deixa rolar quando não */}
        <div className={`mx-auto flex w-max items-end px-1 pt-1 ${compact ? "gap-2" : "gap-3"}`}>
        {items.map((item, i) => {
          const active = i === index
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => !active && onGo(i)}
              disabled={busy && !active}
              aria-current={active ? "true" : undefined}
              title={`${i + 1}. ${item.label}${item.published ? " · publicada" : ""}`}
              className="group flex shrink-0 flex-col items-center gap-1 disabled:cursor-wait"
              style={{ width: compact ? w + 16 : w + 24 }}
            >
              <span
                className={`relative block overflow-hidden rounded-md bg-gray-100 transition-all ${active ? "ring-2 ring-amber-500 ring-offset-2" : "ring-1 ring-gray-200 group-hover:ring-amber-300"}`}
                style={{ width: w, height: h }}
              >
                {item.thumb ? (
                  <img src={item.thumb} alt={`Arte de ${item.label}`} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-gray-300">
                    <ImageIcon className="h-4 w-4" />
                  </span>
                )}
                {item.published && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-white ring-2 ring-white" aria-label="Publicada">
                    <Check className="h-2.5 w-2.5" strokeWidth={4} />
                  </span>
                )}
              </span>
              <span className={`w-full truncate text-center font-semibold ${compact ? "text-[10px]" : "text-[11px]"} ${active ? "text-gray-900" : "text-gray-500"}`}>{item.label}</span>
            </button>
          )
        })}
        </div>
      </div>

      <StepButton dir="next" disabled={!hasNext || busy} compact={compact} onClick={() => onGo(index + 1)} />
    </nav>
  )
}

function StepButton({ dir, disabled, compact, onClick }: { dir: "prev" | "next"; disabled?: boolean; compact?: boolean; onClick: () => void }) {
  const label = dir === "prev" ? "Anterior" : "Próxima"
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center gap-1 rounded-xl border border-gray-200 bg-white text-[13px] font-bold text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white ${compact ? "p-2" : "px-3 py-2"} ${dir === "next" && !compact ? "flex-row-reverse" : ""}`}
    >
      <Icon className="h-4 w-4" />
      {!compact && <span>{label}</span>}
    </button>
  )
}

export type StripView = "fila" | "formatos"

/** Alternância da tira de baixo quando o Studio abre com várias promos */
export function StripToggle({ view, onView }: { view: StripView; onView: (v: StripView) => void }) {
  const options: { id: StripView; label: string }[] = [
    { id: "formatos", label: "Formatos" },
    { id: "fila", label: "Fila" },
  ]
  return (
    <div role="group" aria-label="Mostrar embaixo" className="inline-flex rounded-lg bg-gray-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onView(o.id)}
          aria-pressed={view === o.id}
          className={`rounded-md px-3 py-1 text-[12px] font-bold transition-colors ${view === o.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
