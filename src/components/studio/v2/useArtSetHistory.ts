"use client"

import { useCallback, useRef, useState } from "react"
import type { ArtSet } from "../artSet"

interface History {
  past: ArtSet[]
  present: ArtSet | null
  future: ArtSet[]
}

const LIMIT = 80
const COALESCE_MS = 900

/**
 * Desfazer/refazer do conjunto de 4 formatos.
 * Mudanças seguidas com a mesma chave (digitação, arraste com setas) viram um passo só.
 * `rev` conta as mudanças; `dirty` = mudou desde o último salvamento.
 */
export function useArtSetHistory() {
  const [h, setH] = useState<History>({ past: [], present: null, future: [] })
  const [rev, setRev] = useState(0)
  const [savedRev, setSavedRev] = useState(0)
  const last = useRef<{ key: string; at: number } | null>(null)

  const commit = useCallback((fn: (s: ArtSet) => ArtSet, coalesceKey?: string) => {
    const now = Date.now()
    const coalesce = !!coalesceKey && last.current?.key === coalesceKey && now - last.current.at < COALESCE_MS
    last.current = coalesceKey ? { key: coalesceKey, at: now } : null
    setH((prev) => {
      if (!prev.present) return prev
      const next = fn(prev.present)
      if (next === prev.present) return prev
      return coalesce
        ? { ...prev, present: next }
        : { past: [...prev.past.slice(-(LIMIT - 1)), prev.present], present: next, future: [] }
    })
    setRev((r) => r + 1)
  }, [])

  /** Troca o estado sem passo no histórico e sem marcar como alterado (ex.: selo "gerado agora" visto) */
  const silent = useCallback((fn: (s: ArtSet) => ArtSet) => {
    setH((prev) => (prev.present ? { ...prev, present: fn(prev.present) } : prev))
  }, [])

  /** Estado inicial (carregado ou recém-gerado): histórico vazio e nada a salvar */
  const reset = useCallback((set: ArtSet) => {
    last.current = null
    setH({ past: [], present: set, future: [] })
    setRev(0)
    setSavedRev(0)
  }, [])

  const undo = useCallback(() => {
    last.current = null
    setH((prev) =>
      prev.past.length && prev.present
        ? { past: prev.past.slice(0, -1), present: prev.past[prev.past.length - 1], future: [prev.present, ...prev.future] }
        : prev,
    )
    setRev((r) => r + 1)
  }, [])

  const redo = useCallback(() => {
    last.current = null
    setH((prev) =>
      prev.future.length && prev.present ? { past: [...prev.past, prev.present], present: prev.future[0], future: prev.future.slice(1) } : prev,
    )
    setRev((r) => r + 1)
  }, [])

  /** Salvamento terminou: o que estava em `r` está gravado */
  const markSaved = useCallback((r: number) => setSavedRev((s) => Math.max(s, r)), [])

  return {
    set: h.present,
    commit,
    silent,
    reset,
    undo,
    redo,
    canUndo: h.past.length > 0,
    canRedo: h.future.length > 0,
    rev,
    dirty: rev !== savedRev,
    markSaved,
  }
}
