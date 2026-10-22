"use client"

import { useEffect, useState } from "react"

export interface AiStatus {
  ai: boolean
  storage: boolean
}

let cached: Promise<AiStatus> | null = null

/** Quais recursos de IA e armazenamento o servidor tem configurados (consulta uma vez por sessão) */
export function useAiStatus() {
  const [status, setStatus] = useState<AiStatus | null>(null)
  useEffect(() => {
    cached ??= fetch("/api/ai/status")
      .then((r) => (r.ok ? r.json() : { ai: false, storage: false }))
      .catch(() => ({ ai: false, storage: false }))
    let alive = true
    void cached.then((s) => alive && setStatus(s))
    return () => {
      alive = false
    }
  }, [])
  return status
}
