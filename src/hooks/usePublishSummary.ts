"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PublishSummary } from "@/lib/publishState"

/** null se não deu para ler (mantém o que já estava na tela) */
async function fetchSummary(): Promise<PublishSummary | null> {
  try {
    const res = await fetch("/api/publish/summary", { cache: "no-store" })
    return res.ok ? ((await res.json()) as PublishSummary) : null
  } catch {
    return null
  }
}

/** Situação dos canais de todas as promos da lista; null até a primeira leitura */
export function usePublishSummary() {
  const [summary, setSummary] = useState<PublishSummary | null>(null)

  // Só a resposta da leitura mais recente vale: uma antiga que chega depois não sobrescreve a nova
  const seq = useRef(0)
  const alive = useRef(true)

  const refresh = useCallback(async () => {
    const mine = ++seq.current
    const next = await fetchSummary()
    if (next && alive.current && mine === seq.current) setSummary(next)
  }, [])

  useEffect(() => {
    alive.current = true
    void refresh()
    return () => {
      alive.current = false
    }
  }, [refresh])

  return { summary, refresh }
}
