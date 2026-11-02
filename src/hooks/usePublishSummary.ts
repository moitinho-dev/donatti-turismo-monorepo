"use client"

import { useCallback, useEffect, useState } from "react"
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

  const refresh = useCallback(async () => {
    const next = await fetchSummary()
    if (next) setSummary(next)
  }, [])

  useEffect(() => {
    let alive = true
    void fetchSummary().then((next) => {
      if (alive && next) setSummary(next)
    })
    return () => {
      alive = false
    }
  }, [])

  return { summary, refresh }
}
