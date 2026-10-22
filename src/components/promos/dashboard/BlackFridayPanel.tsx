"use client"

import { useEffect, useMemo, useState } from "react"
import { ExternalLink, Zap } from "lucide-react"
import { Countdown } from "@/components/blackfriday/Countdown"
import {
  blackFriday,
  formatCampaignDate,
  getBlackFridayPhase,
  getCountdownTarget,
  isBlackFridayActive,
  type BlackFridayPhase,
} from "@/config/blackFriday"
import type { PromoData } from "./types"
import { getPromoStatus } from "./types"

/** Resumo da campanha no topo da central: fase, contagem e quantas ofertas estão no ar. */
export function BlackFridayPanel({ promos }: { promos: PromoData[] }) {
  const [phase, setPhase] = useState<BlackFridayPhase | null>(null)

  useEffect(() => {
    setPhase(getBlackFridayPhase())
    const id = window.setInterval(() => setPhase(getBlackFridayPhase()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const stats = useMemo(() => {
    const live = promos.filter((p) => getPromoStatus(p) === "no-site")
    return {
      live: live.length,
      withoutPhoto: live.filter((p) => !p.SITE_IMAGE).length,
      destinations: new Set(live.map((p) => p.DESTINO.trim().toLowerCase())).size,
    }
  }, [promos])

  if (!phase || !isBlackFridayActive(phase)) return null
  const target = getCountdownTarget(phase)

  return (
    <section
      aria-label="Campanha Black Friday"
      className="max-w-7xl mx-auto mb-4 sm:mb-6 overflow-hidden rounded-[20px] bg-[#0B0B0F] text-white shadow-lg"
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FED400]">
            <Zap className="h-6 w-6 fill-black text-black" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FED400]">
              {phase === "esquenta" ? "Esquenta Black Friday" : "Black Friday ao vivo"}
            </p>
            <p className="text-base sm:text-lg font-black leading-tight">
              {stats.live} oferta{stats.live === 1 ? "" : "s"} no site · {stats.destinations} destino{stats.destinations === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-white/60 mt-0.5">
              {phase === "esquenta"
                ? `Começa em ${formatCampaignDate(blackFriday.startsAt)}. Toda promo publicada aparece na home com selo Black Friday.`
                : `Vai até ${formatCampaignDate(blackFriday.endsAt)}. Toda promo publicada aparece na home com selo Black Friday.`}
              {stats.withoutPhoto > 0 && ` ${stats.withoutPhoto} sem foto escolhida (usando foto automática do destino).`}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {target && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">{phase === "esquenta" ? "Abre em" : "Fecha em"}</span>
              <Countdown target={target} tone="dark" size="sm" />
            </div>
          )}
          <a
            href="/#ofertas"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#FED400] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#FED400]/90"
          >
            Ver no site
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
