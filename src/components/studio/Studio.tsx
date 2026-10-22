"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Maximize,
  Minus,
  Plus,
  Redo2,
  Send,
  SlidersHorizontal,
  Sparkles,
  Undo2,
  X,
} from "lucide-react"
import type Konva from "konva"
import { useAiStatus } from "@/hooks/useAiStatus"
import type { useGoogleBusiness } from "@/hooks/useGoogleBusiness"
import type { useInstagram } from "@/hooks/useInstagram"
import { slugify } from "@/lib/utils"
import { StudioCanvas } from "./StudioCanvas"
import { downloadDataUrl, ensureFontsLinked, preloadAllFonts, renderDoc } from "./render"
import { TEMPLATE_FAMILIES, legacyLayoutToDoc, withPhoto, type LegacyLayout } from "./templates"
import { FORMATS, FORMAT_ORDER, newId, type ArtFormat, type Layer, type StudioDoc, type TextLayer } from "./types"
import { promoVariables } from "./variables"
import { AddPanel } from "./panels/AddPanel"
import { AiPanel } from "./panels/AiPanel"
import { LayersPanel } from "./panels/LayersPanel"
import { PhotosPanel } from "./panels/PhotosPanel"
import { PropertiesPanel } from "./panels/PropertiesPanel"
import { PublishPanel } from "./panels/PublishPanel"
import { TemplatesPanel } from "./panels/TemplatesPanel"
import { Spinner } from "./panels/ui"

export interface StudioProps {
  promo: Record<string, unknown> & { id: string; DESTINO: string }
  isAdmin: boolean
  onClose: () => void
  onSavePromo: (promo: Record<string, unknown>) => Promise<Record<string, unknown>>
  ig: ReturnType<typeof useInstagram>
  gbp: ReturnType<typeof useGoogleBusiness>
}

type Tab = "modelos" | "fotos" | "ia" | "adicionar" | "camadas" | "publicar" | "editar"

interface Snapshot {
  docs: Partial<Record<ArtFormat, StudioDoc>>
  family: string | null
}

interface SavedDesignData {
  formats: Partial<Record<ArtFormat, StudioDoc>>
  family: string | null
  photo: string | null
}

const TABS: { id: Exclude<Tab, "editar">; label: string; Icon: typeof LayoutTemplate }[] = [
  { id: "modelos", label: "Modelos", Icon: LayoutTemplate },
  { id: "fotos", label: "Fotos", Icon: ImageIcon },
  { id: "ia", label: "IA", Icon: Sparkles },
  { id: "adicionar", label: "Adicionar", Icon: Plus },
  { id: "camadas", label: "Camadas", Icon: Layers },
  { id: "publicar", label: "Publicar", Icon: Send },
]

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))

/** Templates da tela "Templates" (tabela layouts) usados hoje, por formato */
export type LegacyDefaults = Partial<Record<ArtFormat, LegacyLayout>>

/** "legacy" = template padrão da equipe (story/feed); nos formatos que ele não tem, usa o modelo Destaque */
const buildFamily = (familyId: string | null, format: ArtFormat, photo: string | null, legacy: LegacyDefaults = {}) => {
  if (familyId === "legacy" && legacy[format]) return withPhoto(legacyLayoutToDoc(legacy[format]!), photo)
  return withPhoto((TEMPLATE_FAMILIES.find((f) => f.id === familyId) || TEMPLATE_FAMILIES[0]).build(format), photo)
}

export function Studio({ promo: initialPromo, isAdmin, onClose, onSavePromo, ig, gbp }: StudioProps) {
  const isDemo = initialPromo.id === "demo-tutorial"
  const [promo, setPromo] = useState(initialPromo)
  const vars = useMemo(() => promoVariables(promo), [promo])
  const aiStatus = useAiStatus()

  const [format, setFormat] = useState<ArtFormat>("story")
  const [history, setHistory] = useState<{ past: Snapshot[]; present: Snapshot; future: Snapshot[] }>({
    past: [],
    present: { docs: {}, family: null },
    future: [],
  })
  const lastCommit = useRef<{ key: string; at: number } | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>((initialPromo.SITE_IMAGE as string) || null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab | null>("modelos")
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [fitScale, setFitScale] = useState(0.3)
  const [designId, setDesignId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [dirty, setDirty] = useState(false)
  const [caption, setCaption] = useState("")
  const [toast, setToast] = useState<{ type: "ok" | "error"; text: string } | null>(null)
  const [libraryVersion, setLibraryVersion] = useState(0)
  const [templatesVersion, setTemplatesVersion] = useState(0)
  const [isWide, setIsWide] = useState(true)
  const [legacyDefaults, setLegacyDefaults] = useState<LegacyDefaults>({})
  const canvasBoxRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)

  const snapshot = history.present
  const doc = snapshot.docs[format] || null
  const selected = doc?.layers.find((l) => l.id === selectedId) || null

  useEffect(() => {
    void ensureFontsLinked()
    const mq = window.matchMedia("(min-width: 1024px)")
    const update = () => setIsWide(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(id)
  }, [toast])

  // ---------------------------------------------------------------------------
  // Histórico
  // ---------------------------------------------------------------------------

  /** Grava um novo estado. Mudanças seguidas na mesma propriedade (digitação) viram um passo só. */
  const commit = useCallback((next: Snapshot, coalesceKey?: string) => {
    const now = Date.now()
    const coalesce = coalesceKey && lastCommit.current?.key === coalesceKey && now - lastCommit.current.at < 900
    lastCommit.current = coalesceKey ? { key: coalesceKey, at: now } : null
    setHistory((h) => (coalesce ? { ...h, present: next } : { past: [...h.past.slice(-79), h.present], present: next, future: [] }))
    setDirty(true)
  }, [])

  const undo = useCallback(() => {
    setHistory((h) => (h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h))
    lastCommit.current = null
    setDirty(true)
  }, [])

  const redo = useCallback(() => {
    setHistory((h) => (h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h))
    lastCommit.current = null
    setDirty(true)
  }, [])

  const updateDoc = useCallback(
    (fn: (d: StudioDoc) => StudioDoc, coalesceKey?: string) => {
      setHistory((h) => {
        const current = h.present.docs[format]
        if (!current) return h
        const next = { ...h.present, docs: { ...h.present.docs, [format]: fn(current) } }
        const now = Date.now()
        const coalesce = coalesceKey && lastCommit.current?.key === coalesceKey && now - lastCommit.current.at < 900
        lastCommit.current = coalesceKey ? { key: coalesceKey, at: now } : null
        return coalesce ? { ...h, present: next } : { past: [...h.past.slice(-79), h.present], present: next, future: [] }
      })
      setDirty(true)
    },
    [format],
  )

  const patchLayer = useCallback(
    (id: string, patch: Partial<Layer>, coalesce = true) =>
      updateDoc(
        (d) => ({ ...d, layers: d.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)) }),
        coalesce ? `${id}:${Object.keys(patch).sort().join(",")}` : undefined,
      ),
    [updateDoc],
  )

  // ---------------------------------------------------------------------------
  // Carregamento inicial: artes salvas da promo, ou modelo padrão com a foto do destino
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let alive = true
    const start = async () => {
      // Sem isso o primeiro desenho sai com a fonte padrão e os textos mudam de tamanho depois
      await preloadAllFonts().catch(() => undefined)

      // Template padrão da equipe (o mesmo do Studio antigo); a API já devolve o padrão primeiro
      const legacy: LegacyDefaults = {}
      try {
        const layouts: (LegacyLayout & { isDefault?: boolean })[] = await fetch("/api/layouts").then((r) => (r.ok ? r.json() : []))
        for (const f of ["story", "feed"] as const) {
          const ofFormat = layouts.filter((l) => l.format === f)
          legacy[f] = ofFormat.find((l) => l.isDefault) || ofFormat[0]
        }
      } catch {
        // sem templates antigos: segue com os modelos novos
      }
      if (alive) setLegacyDefaults(legacy)
      if (!isDemo) {
        try {
          const list = await fetch(`/api/designs?kind=design&promoId=${encodeURIComponent(initialPromo.id)}`).then((r) => (r.ok ? r.json() : []))
          if (list[0]?.id) {
            const saved = await fetch(`/api/designs/${list[0].id}`).then((r) => (r.ok ? r.json() : null))
            const data = saved?.data as SavedDesignData | undefined
            if (alive && data?.formats) {
              setDesignId(saved.id)
              // Arte salva sem foto: usa a foto atual da promo nos espaços de foto vazios
              const savedPhoto = data.photo || (initialPromo.SITE_IMAGE as string) || null
              const docs = data.photo
                ? data.formats
                : Object.fromEntries(
                    Object.entries(data.formats).map(([f, d]) => [
                      f,
                      d && { ...d, layers: d.layers.map((l) => (l.type === "image" && l.role === "photo" && !l.src && savedPhoto ? { ...l, src: savedPhoto } : l)) },
                    ]),
                  )
              setPhotoUrl(savedPhoto)
              setHistory({ past: [], present: { docs, family: data.family }, future: [] })
              const first = FORMAT_ORDER.find((f) => data.formats[f]) || "story"
              setFormat(first)
              setLoading(false)
              return
            }
          }
        } catch {
          // segue com o modelo padrão
        }
      }

      let photo = (initialPromo.SITE_IMAGE as string) || null
      if (!photo) {
        try {
          const data = await fetch(`/api/image-search?query=${encodeURIComponent(initialPromo.DESTINO)}&limit=1&orientation=portrait`).then((r) => r.json())
          photo = data.results?.[0]?.urls?.regular || null
        } catch {
          photo = null
        }
      }
      if (!alive) return
      const family = legacy.story ? "legacy" : initialPromo.CAMPAIGN === "black-friday" ? "black-friday" : "destaque"
      setPhotoUrl(photo)
      setHistory({ past: [], present: { docs: { story: buildFamily(family, "story", photo, legacy) }, family }, future: [] })
      setDirty(false)
      setLoading(false)
    }
    void start()
    return () => {
      alive = false
    }
  }, [initialPromo.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Formato ainda não aberto: monta no mesmo modelo
  useEffect(() => {
    if (loading || snapshot.docs[format]) return
    setHistory((h) => ({ ...h, present: { ...h.present, docs: { ...h.present.docs, [format]: buildFamily(h.present.family, format, photoUrl, legacyDefaults) } } }))
  }, [format, loading, snapshot.docs, photoUrl, legacyDefaults])

  // ---------------------------------------------------------------------------
  // Zoom para caber na tela
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const box = canvasBoxRef.current
    if (!box || !doc) return
    const compute = () => {
      const pad = isWide ? 64 : 24
      const s = Math.min((box.clientWidth - pad) / doc.width, (box.clientHeight - pad) / doc.height)
      setFitScale(Math.max(0.05, s))
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(box)
    return () => ro.disconnect()
  }, [doc?.width, doc?.height, isWide, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const scale = fitScale * zoom

  // ---------------------------------------------------------------------------
  // Ações
  // ---------------------------------------------------------------------------
  const applyFamily = (familyId: string) => {
    commit({ family: familyId, docs: { [format]: buildFamily(familyId, format, photoUrl, legacyDefaults) } })
    setSelectedId(null)
  }

  const applyDoc = (d: StudioDoc) => {
    // Templates da equipe e antigos têm formato próprio
    const target = d.format
    commit({ family: null, docs: { ...snapshot.docs, [target]: { ...d, layers: d.layers.map((l) => ({ ...l, id: newId() })) } } })
    setFormat(target)
    setSelectedId(null)
  }

  const setPhoto = (url: string) => {
    setPhotoUrl(url)
    const docs = Object.fromEntries(Object.entries(snapshot.docs).map(([f, d]) => [f, withPhoto(d as StudioDoc, url)]))
    // Arte sem camada de foto: a foto entra como fundo
    const current = docs[format] as StudioDoc | undefined
    if (current && !current.layers.some((l) => l.type === "image" && l.role === "photo")) {
      docs[format] = {
        ...current,
        layers: [
          { id: newId(), name: "Foto do destino", type: "image", role: "photo", src: url, x: 0, y: 0, width: current.width, height: current.height, rotation: 0, opacity: 1, fit: "cover", cornerRadius: 0 },
          ...current.layers,
        ],
      }
    }
    commit({ ...snapshot, docs })
  }

  const addLayers = (layers: Layer[]) => {
    updateDoc((d) => ({ ...d, layers: [...d.layers, ...layers] }))
    setSelectedId(layers[layers.length - 1]?.id || null)
    if (!isWide) setTab("editar")
  }

  const addImage = (url: string) => {
    if (!doc) return
    const w = doc.width * 0.5
    addLayers([{ id: newId(), name: "Imagem", type: "image", src: url, x: (doc.width - w) / 2, y: (doc.height - w) / 2, width: w, height: w, rotation: 0, opacity: 1, fit: "contain", cornerRadius: 0 }])
  }

  const deleteLayer = (id: string) => {
    updateDoc((d) => ({ ...d, layers: d.layers.filter((l) => l.id !== id) }))
    if (selectedId === id) setSelectedId(null)
  }

  const duplicateLayer = (id: string) => {
    const l = doc?.layers.find((x) => x.id === id)
    if (!l) return
    const copy = { ...l, id: newId(), x: l.x + 30, y: l.y + 30, locked: false } as Layer
    updateDoc((d) => {
      const i = d.layers.findIndex((x) => x.id === id)
      const layers = [...d.layers]
      layers.splice(i + 1, 0, copy)
      return { ...d, layers }
    })
    setSelectedId(copy.id)
  }

  const moveLayer = (id: string, dir: "up" | "down") =>
    updateDoc((d) => {
      const i = d.layers.findIndex((l) => l.id === id)
      const j = dir === "up" ? i + 1 : i - 1
      if (i < 0 || j < 0 || j >= d.layers.length) return d
      const layers = [...d.layers]
      ;[layers[i], layers[j]] = [layers[j], layers[i]]
      return { ...d, layers }
    })

  const useText = (text: string) => {
    if (selected?.type === "text") patchLayer(selected.id, { text }, false)
    else if (doc) {
      const s = Math.min(doc.width, doc.height) / 1080
      const layer: TextLayer = {
        id: newId(), name: text.slice(0, 24), type: "text", text,
        x: doc.width * 0.08, y: doc.height * 0.4, width: doc.width * 0.84, height: 90 * s, rotation: 0, opacity: 1,
        fontFamily: "Montserrat", fontSize: 80 * s, fontWeight: "900", fill: "#FFFFFF", align: "center", lineHeight: 1.05, letterSpacing: 0, shadow: true,
      }
      addLayers([layer])
    }
  }

  // ---------------------------------------------------------------------------
  // Exportar e salvar
  // ---------------------------------------------------------------------------
  const docFor = useCallback(
    (f: ArtFormat) => snapshot.docs[f] || buildFamily(snapshot.family, f, photoUrl, legacyDefaults),
    [snapshot, photoUrl, legacyDefaults],
  )

  const exportError = (err: unknown) => {
    console.error(err)
    setToast({
      type: "error",
      text: "Não deu para gerar a imagem: alguma foto da arte não permite exportação (origem bloqueada). Troque a foto e tente de novo.",
    })
  }

  const getDataUrl = useCallback(async (f: ArtFormat, mime: "image/png" | "image/jpeg" = "image/png") => renderDoc(docFor(f), vars, { mime }), [docFor, vars])

  const onDownload = async (which: ArtFormat | "all", mime: "image/png" | "image/jpeg") => {
    const ext = mime === "image/png" ? "png" : "jpg"
    const base = slugify(String(promo.DESTINO || "arte")) || "arte"
    try {
      if (which !== "all") {
        downloadDataUrl(await getDataUrl(which, mime), `${base}-${which}.${ext}`)
        return
      }
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      for (const f of FORMAT_ORDER) {
        const dataUrl = await getDataUrl(f, mime)
        zip.file(`${base}-${f}.${ext}`, dataUrl.split(",")[1], { base64: true })
      }
      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      downloadDataUrl(url, `${base}-artes.zip`)
      window.setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (err) {
      exportError(err)
    }
  }

  const saveDesign = useCallback(
    async (silent = false) => {
      if (isDemo || !doc) return
      setSaving(true)
      try {
        let thumbnail: string | undefined
        try {
          thumbnail = await renderDoc(doc, vars, { mime: "image/jpeg", quality: 0.75, maxWidth: 360 })
        } catch {
          thumbnail = undefined // foto sem CORS: salva sem miniatura
        }
        const data: SavedDesignData = { formats: snapshot.docs, family: snapshot.family, photo: photoUrl }
        const res = await fetch("/api/designs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: designId || undefined,
            name: `${promo.DESTINO} - artes`,
            kind: "design",
            format,
            data,
            promoId: promo.id,
            thumbnail,
          }),
        })
        const saved = await res.json()
        if (!res.ok) throw new Error(saved.error || "Erro ao salvar")
        setDesignId(saved.id)
        setSavedAt(new Date())
        setDirty(false)
        if (!silent) setToast({ type: "ok", text: "Artes salvas" })
      } catch (err) {
        if (!silent) setToast({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar" })
      } finally {
        setSaving(false)
      }
    },
    [isDemo, doc, vars, snapshot, photoUrl, designId, promo.DESTINO, promo.id, format],
  )

  // Salvamento automático alguns segundos depois da última mudança
  useEffect(() => {
    if (!dirty || loading || isDemo) return
    const id = window.setTimeout(() => void saveDesign(true), 4000)
    return () => window.clearTimeout(id)
  }, [dirty, loading, isDemo, saveDesign, history])

  const saveTemplate = async (name: string) => {
    if (!doc) return
    setSaving(true)
    try {
      let thumbnail: string | undefined
      try {
        thumbnail = await renderDoc(doc, vars, { mime: "image/jpeg", quality: 0.75, maxWidth: 360 })
      } catch {
        thumbnail = undefined
      }
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, kind: "template", format, data: doc, thumbnail }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao salvar template")
      setTemplatesVersion((v) => v + 1)
      setToast({ type: "ok", text: `Template "${name}" salvo para a equipe` })
    } catch (err) {
      setToast({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar template" })
    } finally {
      setSaving(false)
    }
  }

  const onSiteCard = async (publish: boolean) => {
    if (isDemo) return
    try {
      const updated = await onSavePromo({ ...promo, SITE_IMAGE: photoUrl || promo.SITE_IMAGE, SITE_PUBLISHED: publish })
      setPromo(updated as typeof promo)
      setToast({ type: "ok", text: publish ? "Publicado no site com esta foto" : "Foto salva; promo fora do site" })
    } catch (err) {
      setToast({ type: "error", text: err instanceof Error ? err.message : "Erro ao atualizar o site" })
    }
  }

  const close = async () => {
    if (dirty && !isDemo) await saveDesign(true)
    onClose()
  }

  // ---------------------------------------------------------------------------
  // Atalhos de teclado
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault()
        redo()
      } else if (mod && e.key.toLowerCase() === "d" && selectedId) {
        e.preventDefault()
        duplicateLayer(selectedId)
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault()
        void saveDesign()
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault()
        deleteLayer(selectedId)
      } else if (e.key === "Escape") {
        setSelectedId(null)
      } else if (selected && !selected.locked && e.key.startsWith("Arrow")) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0
        patchLayer(selected.id, { x: selected.x + dx, y: selected.y + dy })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  // ---------------------------------------------------------------------------
  // Interface
  // ---------------------------------------------------------------------------
  const panel = (t: Tab) => {
    if (!doc) return null
    switch (t) {
      case "modelos":
        return (
          <TemplatesPanel
            format={format}
            vars={vars}
            photoUrl={photoUrl}
            activeFamily={snapshot.family}
            onApplyFamily={applyFamily}
            hasLegacy={!!(legacyDefaults.story || legacyDefaults.feed)}
            onApplyDoc={applyDoc}
            refreshKey={templatesVersion}
          />
        )
      case "fotos":
        return <PhotosPanel destino={promo.DESTINO} format={format} photoUrl={photoUrl} onSetPhoto={setPhoto} onAddImage={addImage} libraryVersion={libraryVersion} />
      case "ia":
        return (
          <AiPanel
            enabled={!!aiStatus?.ai}
            promo={promo}
            format={format}
            photoUrl={photoUrl}
            selected={selected}
            onSetPhoto={setPhoto}
            onAddImage={addImage}
            onUseText={useText}
            onCaption={setCaption}
            onLibraryChanged={() => setLibraryVersion((v) => v + 1)}
          />
        )
      case "adicionar":
        return <AddPanel doc={doc} onAdd={addLayers} />
      case "camadas":
        return (
          <LayersPanel
            layers={doc.layers}
            vars={vars}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id)
              if (!isWide) setTab("editar")
            }}
            onPatch={(id, p) => patchLayer(id, p, false)}
            onMove={moveLayer}
            onDelete={deleteLayer}
          />
        )
      case "publicar":
        return (
          <PublishPanel
            promo={promo}
            format={format}
            isAdmin={isAdmin}
            photoUrl={photoUrl}
            caption={caption}
            setCaption={setCaption}
            saving={saving}
            savedAt={savedAt}
            onSaveDesign={() => saveDesign()}
            onSaveTemplate={saveTemplate}
            onDownload={onDownload}
            onSiteCard={onSiteCard}
            getDataUrl={(f) => getDataUrl(f, "image/jpeg")}
            ig={ig}
            gbp={gbp}
          />
        )
      case "editar":
        return properties
    }
  }

  const properties = doc ? (
    <PropertiesPanel
      doc={doc}
      layer={selected}
      photoUrl={photoUrl}
      onChange={(p) => selected && patchLayer(selected.id, p)}
      onBackground={(background) => updateDoc((d) => ({ ...d, background }), "background")}
      onDelete={() => selected && deleteLayer(selected.id)}
      onDuplicate={() => selected && duplicateLayer(selected.id)}
      onMove={(dir) => selected && moveLayer(selected.id, dir)}
    />
  ) : null

  const tabTitle = tab === "editar" ? "Editar" : TABS.find((t) => t.id === tab)?.label

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-100 text-gray-900" data-tour="studio-editor">
      {/* Barra superior */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-2 sm:px-4">
        <button type="button" onClick={() => void close()} className="flex items-center gap-1.5 rounded-xl px-2 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100" aria-label="Voltar para a lista">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </button>
        <div className="hidden min-w-0 md:block">
          <p className="truncate text-[14px] font-black">{promo.DESTINO}</p>
          <p className="truncate text-[11px] text-gray-500">{String(promo.HOTEL || "")}</p>
        </div>

        <nav data-tour="studio-formats" className="mx-auto flex items-center gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 [scrollbar-width:none]" aria-label="Formato da arte">
          {FORMAT_ORDER.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFormat(f)
                setSelectedId(null)
              }}
              aria-pressed={format === f}
              title={`${FORMATS[f].hint} · ${FORMATS[f].width}×${FORMATS[f].height}`}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition-all sm:px-3 ${format === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              {FORMATS[f].label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <IconButton title="Desfazer (Ctrl+Z)" onClick={undo} disabled={!history.past.length}>
            <Undo2 className="h-4 w-4" />
          </IconButton>
          <IconButton title="Refazer (Ctrl+Shift+Z)" onClick={redo} disabled={!history.future.length}>
            <Redo2 className="h-4 w-4" />
          </IconButton>
          <span className="hidden items-center text-[11px] text-gray-400 lg:flex lg:w-24 lg:justify-end">
            {isDemo ? "Demonstração" : saving ? "Salvando…" : dirty ? "Alterações não salvas" : savedAt ? (
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Salvo</span>
            ) : null}
          </span>
          <button
            type="button"
            onClick={() => void onDownload(format, "image/png")}
            className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-[13px] font-bold text-white hover:bg-amber-400"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Baixar</span>
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Abas (desktop) */}
        {isWide && (
          <nav className="flex w-[76px] shrink-0 flex-col items-center gap-1 border-r border-gray-200 bg-white py-3" aria-label="Ferramentas">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(tab === id ? null : id)}
                aria-pressed={tab === id}
                data-tour={{ modelos: "studio-templates", fotos: "studio-gallery", ia: "studio-ai", publicar: "studio-site-card" }[id as string]}
                className={`flex w-16 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-all ${tab === id ? "bg-amber-50 text-amber-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
              >
                <Icon className={`h-5 w-5 ${id === "ia" ? "text-violet-500" : ""}`} />
                {label}
              </button>
            ))}
          </nav>
        )}

        {/* Painel lateral (desktop) */}
        {isWide && tab && tab !== "editar" && (
          <aside className="w-[320px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4">
            <h2 className="mb-4 text-[15px] font-black">{tabTitle}</h2>
            {panel(tab)}
          </aside>
        )}

        {/* Área da arte */}
        <main ref={canvasBoxRef} className="relative flex min-w-0 flex-1 items-center justify-center overflow-auto" onMouseDown={(e) => e.target === e.currentTarget && setSelectedId(null)}>
          {loading || !doc ? (
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <Spinner className="h-6 w-6" />
              <p className="text-[13px]">Preparando as artes…</p>
            </div>
          ) : (
            <div className="shadow-2xl" style={{ margin: "auto" }}>
              <StudioCanvas
                doc={doc}
                vars={vars}
                scale={scale}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id)
                  if (!isWide && id) setTab("editar")
                }}
                onChange={(id, patch, commitIt) => patchLayer(id, patch, !commitIt)}
                stageRef={stageRef}
              />
            </div>
          )}

          {/* Zoom */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <IconButton title="Diminuir zoom" onClick={() => setZoom((z) => Math.max(0.25, z / 1.25))}>
              <Minus className="h-4 w-4" />
            </IconButton>
            <span className="w-11 text-center text-[11px] font-semibold text-gray-600">{Math.round(scale * 100)}%</span>
            <IconButton title="Aumentar zoom" onClick={() => setZoom((z) => Math.min(6, z * 1.25))}>
              <Plus className="h-4 w-4" />
            </IconButton>
            <IconButton title="Caber na tela" onClick={() => setZoom(1)}>
              <Maximize className="h-4 w-4" />
            </IconButton>
          </div>
        </main>

        {/* Propriedades (desktop) */}
        {isWide && (
          <aside className="w-[290px] shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-4">
            <h2 className="mb-4 flex items-center gap-2 text-[15px] font-black">
              <SlidersHorizontal className="h-4 w-4 text-gray-400" />
              {selected ? selected.name : "Arte"}
            </h2>
            {properties}
          </aside>
        )}

        {/* Gaveta (celular) */}
        {!isWide && tab && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex max-h-[58%] flex-col rounded-t-3xl border-t border-gray-200 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <h2 className="text-[15px] font-black">{tab === "editar" && selected ? selected.name : tabTitle}</h2>
              <button type="button" onClick={() => setTab(null)} aria-label="Fechar painel" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{panel(tab)}</div>
          </div>
        )}
      </div>

      {/* Abas (celular) */}
      {!isWide && (
        <nav className="flex shrink-0 justify-around border-t border-gray-200 bg-white px-1 pb-[env(safe-area-inset-bottom)]" aria-label="Ferramentas">
          {[...TABS, ...(selected ? [{ id: "editar" as const, label: "Editar", Icon: SlidersHorizontal }] : [])].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(tab === id ? null : id)}
              aria-pressed={tab === id}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${tab === id ? "text-amber-600" : "text-gray-500"}`}
            >
              <Icon className={`h-5 w-5 ${id === "ia" && tab !== id ? "text-violet-500" : ""}`} />
              {label}
            </button>
          ))}
        </nav>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-20 left-1/2 z-[70] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl px-4 py-3 text-[13px] font-semibold text-white shadow-xl ${toast.type === "ok" ? "bg-gray-900" : "bg-red-600"}`}
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}

function IconButton({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
    >
      {children}
    </button>
  )
}
