"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { slugify } from "@/lib/utils"
import { downloadDataUrl, renderDoc } from "../render"
import { FORMAT_ORDER, type ArtFormat, type StudioDoc } from "../types"
import { VARIABLES } from "../variables"
import type { ArtSet } from "../artSet"
import type { SavedDesignData } from "../savedArt"
import { fixedTextHits, replaceFixedText } from "../teamTemplates"

type Notify = (type: "ok" | "error", text: string) => void

interface Options {
  set: ArtSet | null
  vars: Record<string, string>
  format: ArtFormat
  promo: { id: string; DESTINO: string }
  /** Demonstração: nunca grava */
  isDemo: boolean
  loading: boolean
  rev: number
  dirty: boolean
  markSaved: (rev: number) => void
  notify: Notify
}

/** Miniatura para a lista; foto sem liberação de origem: salva sem miniatura */
const thumbnailOf = async (d: StudioDoc, vars: Record<string, string>) => {
  try {
    return await renderDoc(d, vars, { mime: "image/jpeg", quality: 0.75, maxWidth: 360 })
  } catch {
    return undefined
  }
}

/** Exportar, salvar a arte da promo (os 4 formatos juntos, automático 4 s depois da última mudança) e salvar template */
export function useArtSaving({ set, vars, format, promo, isDemo, loading, rev, dirty, markSaved, notify }: Options) {
  // Ref (e não só estado): dois salvamentos seguidos precisam gravar no mesmo design
  const designId = useRef<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [templatesVersion, setTemplatesVersion] = useState(0)
  const inflight = useRef<Promise<void> | null>(null)

  const getDataUrl = useCallback(
    async (f: ArtFormat, mime: "image/png" | "image/jpeg" = "image/png") => {
      if (!set) throw new Error("Arte ainda carregando")
      return renderDoc(set.docs[f], vars, { mime })
    },
    [set, vars],
  )

  const download = async (which: ArtFormat | "all", mime: "image/png" | "image/jpeg") => {
    const ext = mime === "image/png" ? "png" : "jpg"
    const base = slugify(String(promo.DESTINO || "arte")) || "arte"
    try {
      if (which !== "all") {
        downloadDataUrl(await getDataUrl(which, mime), `${base}-${which}.${ext}`)
        return
      }
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      for (const f of FORMAT_ORDER) zip.file(`${base}-${f}.${ext}`, (await getDataUrl(f, mime)).split(",")[1], { base64: true })
      const url = URL.createObjectURL(await zip.generateAsync({ type: "blob" }))
      downloadDataUrl(url, `${base}-artes.zip`)
      window.setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (err) {
      console.error(err)
      notify("error", "Não deu para gerar a imagem: alguma foto da arte não permite exportação. Troque a foto e tente de novo.")
    }
  }

  const saveDesign = useCallback(
    async (quiet = false) => {
      if (isDemo || !set) return
      // Um salvamento por vez: espera o anterior e grava o estado mais novo
      while (inflight.current) await inflight.current
      let done = () => {}
      inflight.current = new Promise<void>((resolve) => (done = resolve))
      setSaving(true)
      const savingRev = rev
      try {
        const data: SavedDesignData = { formats: set.docs, family: set.family, photo: set.photo, captions: set.captions ?? undefined, edited: set.edited }
        const res = await fetch("/api/designs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: designId.current || undefined,
            name: `${promo.DESTINO} - artes`,
            kind: "design",
            format,
            data,
            promoId: promo.id,
            thumbnail: await thumbnailOf(set.docs[format], vars),
          }),
        })
        const saved = await res.json()
        if (!res.ok) throw new Error(saved.error || "Erro ao salvar")
        designId.current = saved.id
        setSavedAt(new Date())
        markSaved(savingRev)
        if (!quiet) notify("ok", "Artes salvas")
      } catch (err) {
        if (!quiet) notify("error", err instanceof Error ? err.message : "Erro ao salvar")
      } finally {
        inflight.current = null
        done()
        setSaving(false)
      }
    },
    [isDemo, set, rev, vars, promo.DESTINO, promo.id, format, markSaved, notify],
  )

  // Salvamento automático 4 s depois da última mudança, sempre o conjunto inteiro
  useEffect(() => {
    if (!dirty || loading || isDemo || saving) return
    const id = window.setTimeout(() => void saveDesign(true), 4000)
    return () => window.clearTimeout(id)
  }, [dirty, loading, isDemo, saving, saveDesign])

  /** Grava os 4 formatos como template da equipe; texto fixo com dados desta promo pode virar variável */
  const saveTemplate = async (name: string) => {
    if (!set) return
    let formats = set.docs
    const keys = FORMAT_ORDER.flatMap((f) => fixedTextHits(set.docs[f], vars).map((h) => h.key))
    if (keys.length) {
      const labels = [...new Set(keys.map((k) => VARIABLES.find((v) => v.key === k)?.label || k))].join(", ")
      const swap = window.confirm(
        `Alguns textos estão escritos com os dados desta promo (${labels}). Trocar por variáveis, para o template servir em outras promos?\n\nOK troca; Cancelar salva como está.`,
      )
      if (swap) formats = Object.fromEntries(FORMAT_ORDER.map((f) => [f, replaceFixedText(set.docs[f], fixedTextHits(set.docs[f], vars))])) as ArtSet["docs"]
    }
    setSaving(true)
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, kind: "template", format: "set", data: { formats }, thumbnail: await thumbnailOf(formats[format], vars) }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao salvar template")
      setTemplatesVersion((v) => v + 1)
      notify("ok", `Template "${name}" salvo para a equipe`)
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Erro ao salvar template")
    } finally {
      setSaving(false)
    }
  }

  const setDesignId = useCallback((id: string | null) => {
    designId.current = id
  }, [])

  return { setDesignId, saving, savedAt, templatesVersion, getDataUrl, download, saveDesign, saveTemplate }
}
