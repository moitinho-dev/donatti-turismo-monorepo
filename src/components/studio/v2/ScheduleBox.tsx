"use client"

import { useState } from "react"
import { CalendarClock, Send } from "lucide-react"

/** "2026-11-02T14:30" no fuso do aparelho, para o campo de data e hora */
export const localInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface Props {
  /** Agendar só com o Facebook feed marcado */
  enabled: boolean
  busy: boolean
  when: "now" | "schedule"
  onWhen: (w: "now" | "schedule") => void
  value: string
  onValue: (v: string) => void
  message: string | null
}

/** "Publicar agora" ou "Agendar" (só o Facebook feed) */
export function ScheduleBox({ enabled, busy, when, onWhen, value, onValue, message }: Props) {
  // Só uma dica para o seletor; a regra de verdade é conferida ao publicar
  const [min] = useState(() => localInput(new Date(Date.now() + 10 * 60_000)))
  return (
      <section aria-labelledby="pub-quando" className="mt-6">
        <h3 id="pub-quando" className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Quando
        </h3>
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1" role="radiogroup" aria-label="Quando publicar">
          {(["now", "schedule"] as const).map((w) => {
            const off = w === "schedule" && !enabled
            return (
              <button
                key={w}
                type="button"
                role="radio"
                aria-checked={when === w}
                disabled={off || busy}
                onClick={() => onWhen(w)}
                title={w === "schedule" && off ? "Marque o Facebook feed para agendar" : undefined}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[12.5px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${when === w ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              >
                {w === "now" ? <Send className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
                {w === "now" ? "Publicar agora" : "Agendar"}
              </button>
            )
          })}
        </div>
        {when === "schedule" && enabled ? (
          <div className="mt-2.5 space-y-1.5">
            <input
              type="datetime-local"
              value={value}
              min={min}
              onChange={(e) => onValue(e.target.value)}
              aria-label="Data e hora do post no Facebook"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            <p className="text-[11.5px] text-gray-500">O agendamento vale só para o Facebook feed. Os outros canais saem agora.</p>
            {message && <p className="text-[12px] font-semibold text-red-600">{message}</p>}
          </div>
        ) : (
          <p className="mt-2 text-[11.5px] text-gray-500">Agendar só funciona no Facebook feed.</p>
        )}
      </section>
  )
}
