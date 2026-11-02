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
  // Cópia síncrona do histórico: toda mudança passa por `apply`, então o ref é sempre o estado mais novo
  const hRef = useRef(h)
  const [rev, setRev] = useState(0)
  const [savedRev, setSavedRev] = useState(0)
  const last = useRef<{ key: string; at: number } | null>(null)

  /** Aplica a mudança; devolve false se nada mudou */
  const apply = useCallback((fn: (prev: History) => History) => {
    const next = fn(hRef.current)
    if (next === hRef.current) return false
    hRef.current = next
    setH(next)
    return true
  }, [])

  const commit = useCallback(
    (fn: (s: ArtSet) => ArtSet, coalesceKey?: string) => {
      const now = Date.now()
      const coalesce = !!coalesceKey && last.current?.key === coalesceKey && now - last.current.at < COALESCE_MS
      const changed = apply((prev) => {
        if (!prev.present) return prev
        const next = fn(prev.present)
        if (next === prev.present) return prev // mudança nenhuma: nem passo no histórico, nem "não salvo"
        return coalesce ? { ...prev, present: next } : { past: [...prev.past.slice(-(LIMIT - 1)), prev.present], present: next, future: [] }
      })
      if (!changed) return
      last.current = coalesceKey ? { key: coalesceKey, at: now } : null
      setRev((r) => r + 1)
    },
    [apply],
  )

  /** Troca o estado sem passo no histórico e sem marcar como alterado (ex.: selo "gerado agora" visto) */
  const silent = useCallback(
    (fn: (s: ArtSet) => ArtSet) => {
      apply((prev) => (prev.present ? { ...prev, present: fn(prev.present) } : prev))
    },
    [apply],
  )

  /** Estado inicial (carregado ou recém-gerado): histórico vazio e nada a salvar */
  const reset = useCallback(
    (set: ArtSet) => {
      last.current = null
      apply(() => ({ past: [], present: set, future: [] }))
      setRev(0)
      setSavedRev(0)
    },
    [apply],
  )

  const undo = useCallback(() => {
    last.current = null
    const changed = apply((prev) =>
      prev.past.length && prev.present
        ? { past: prev.past.slice(0, -1), present: prev.past[prev.past.length - 1], future: [prev.present, ...prev.future] }
        : prev,
    )
    if (changed) setRev((r) => r + 1)
  }, [apply])

  const redo = useCallback(() => {
    last.current = null
    const changed = apply((prev) =>
      prev.future.length && prev.present ? { past: [...prev.past, prev.present], present: prev.future[0], future: prev.future.slice(1) } : prev,
    )
    if (changed) setRev((r) => r + 1)
  }, [apply])

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
