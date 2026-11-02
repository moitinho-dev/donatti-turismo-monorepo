"use client"

import { useEffect, useRef, useState } from "react"
import { renderDoc } from "../render"
import { FORMATS, FORMAT_ORDER, type ArtFormat, type StudioDoc } from "../types"
import type { ArtSet } from "../artSet"
import { Spinner } from "../panels/ui"

interface FormatStripProps {
  set: ArtSet
  vars: Record<string, string>
  format: ArtFormat
  onSelect: (format: ArtFormat) => void
  compact?: boolean
}

/** As 4 miniaturas sempre visíveis embaixo da arte; clicar troca o formato */
export function FormatStrip({ set, vars, format, onSelect, compact }: FormatStripProps) {
  const [thumbs, setThumbs] = useState<Partial<Record<ArtFormat, string | null>>>({})
  const rendered = useRef<{ docs: Partial<Record<ArtFormat, StudioDoc>>; vars: Record<string, string> | null }>({ docs: {}, vars: null })

  // Redesenha só o que mudou, um pouco depois da última alteração (não pesa enquanto digita ou arrasta)
  useEffect(() => {
    let alive = true
    const id = window.setTimeout(async () => {
      const varsChanged = rendered.current.vars !== vars
      for (const f of FORMAT_ORDER) {
        const d = set.docs[f]
        if (!varsChanged && rendered.current.docs[f] === d) continue
        let url: string | null
        try {
          url = await renderDoc(d, vars, { mime: "image/jpeg", quality: 0.8, maxWidth: 220 })
        } catch {
          url = null // foto sem liberação de origem: fica sem miniatura
        }
        if (!alive) return
        rendered.current.docs[f] = d
        setThumbs((prev) => ({ ...prev, [f]: url }))
      }
      if (alive) rendered.current.vars = vars
    }, 350)
    return () => {
      alive = false
      window.clearTimeout(id)
    }
  }, [set.docs, vars])

  const h = compact ? 56 : 96

  return (
    <nav
      aria-label="Formatos da arte"
      className={`flex shrink-0 items-end justify-center gap-3 overflow-x-auto border-t border-gray-200 bg-white [scrollbar-width:none] ${compact ? "px-3 py-2" : "px-4 py-3"}`}
    >
      {FORMAT_ORDER.map((f) => {
        const { width, height, label, hint } = FORMATS[f]
        const w = Math.round((h * width) / height)
        const active = f === format
        const fresh = set.generated.includes(f)
        const thumb = thumbs[f]
        return (
          <button
            key={f}
            type="button"
            onClick={() => onSelect(f)}
            aria-pressed={active}
            title={`${label} · ${hint} · ${width}×${height}`}
            className="group flex shrink-0 flex-col items-center gap-1"
          >
            <span
              className={`relative block overflow-hidden rounded-md bg-gray-100 transition-all ${active ? "ring-2 ring-amber-500 ring-offset-2" : "ring-1 ring-gray-200 group-hover:ring-amber-300"}`}
              style={{ width: w, height: h }}
            >
              {thumb ? (
                <img src={thumb} alt={`Arte ${label}`} className="h-full w-full object-cover" />
              ) : thumb === null ? null : (
                <span className="flex h-full items-center justify-center text-gray-400">
                  <Spinner className="h-3 w-3" />
                </span>
              )}
              {fresh && !compact && (
                <span className="absolute inset-x-0 bottom-0 bg-amber-500/95 px-0.5 py-0.5 text-center text-[8px] font-black uppercase leading-[1.1] text-white">
                  gerado agora
                </span>
              )}
              {fresh && compact && <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-amber-500 ring-1 ring-white" aria-label="gerado agora" />}
            </span>
            <span className={`text-[11px] font-semibold ${active ? "text-gray-900" : "text-gray-500"}`}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
