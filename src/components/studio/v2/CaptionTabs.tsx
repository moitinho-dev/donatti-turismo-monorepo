"use client"

import { RotateCcw } from "lucide-react"
import type { Captions } from "../artSet"

export type Network = keyof Captions

const TABS: { id: Network; label: string; hint: string }[] = [
  { id: "instagram", label: "Instagram", hint: "Feed do Instagram. Link não clica na legenda: vai \"link na bio\"." },
  { id: "facebook", label: "Facebook", hint: "Feed do Facebook, com o link da oferta." },
  { id: "whatsapp", label: "WhatsApp", hint: "Mensagem do Canal do WhatsApp." },
]

const LIMIT: Record<Network, number | null> = { instagram: 2200, facebook: 2200, whatsapp: null }

interface Props {
  captions: Captions
  tab: Network
  disabled?: boolean
  onTab: (t: Network) => void
  onChange: (network: Network, text: string) => void
  /** Volta a legenda da aba para a gerada com os dados atuais da oferta */
  onRegenerate: (network: Network) => void
}

/** Legenda por rede, pronta e editável (fica salva com a arte) */
export function CaptionTabs({ captions, tab, disabled, onTab, onChange, onRegenerate }: Props) {
  const text = captions[tab]
  const limit = LIMIT[tab]
  const info = TABS.find((t) => t.id === tab)!
  return (
    <div>
      <div role="tablist" aria-label="Legenda" className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => onTab(t.id)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-[12.5px] font-bold transition-colors ${tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] text-gray-500">{info.hint}</p>
      <textarea
        value={text}
        disabled={disabled}
        onChange={(e) => onChange(tab, e.target.value)}
        rows={9}
        aria-label={`Legenda do ${info.label}`}
        maxLength={limit ?? undefined}
        className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-gray-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-50"
      />
      <div className="mt-1 flex items-center justify-between text-[11.5px] text-gray-400">
        <button
          type="button"
          onClick={() => onRegenerate(tab)}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
        >
          <RotateCcw className="h-3 w-3" /> Gerar de novo com os dados da oferta
        </button>
        {limit && (
          <span className={text.length > limit * 0.95 ? "font-semibold text-amber-700" : ""}>
            {text.length}/{limit}
          </span>
        )}
      </div>
    </div>
  )
}
