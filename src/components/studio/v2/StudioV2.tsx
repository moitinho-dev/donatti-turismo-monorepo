"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import type Konva from "konva"
import { useAiStatus } from "@/hooks/useAiStatus"
import type { StudioProps } from "../Studio"
import { StudioCanvas } from "../StudioCanvas"
import { ensureFontsLinked, preloadAllFonts } from "../render"
import { FORMATS, FORMAT_ORDER, newId, type ArtFormat, type Layer, type StudioDoc, type TextLayer } from "../types"
import { promoVariables } from "../variables"
import {
  applyFamily,
  applyTemplateDocs,
  buildArtSet,
  equivalentLayers,
  markEdited,
  propagate,
  setPhotoAll,
  type ArtSet,
  type Captions,
} from "../artSet"
import { loadSavedArt } from "../savedArt"
import { fixedTextHits, replaceFixedText } from "../teamTemplates"
import { AddPanel } from "../panels/AddPanel"
import { AiPanel } from "../panels/AiPanel"
import { LayersPanel } from "../panels/LayersPanel"
import { PhotosPanel } from "../panels/PhotosPanel"
import { PropertiesPanel } from "../panels/PropertiesPanel"
import { TemplatesPanel } from "../panels/TemplatesPanel"
import { Spinner } from "../panels/ui"
import { BrandPanel, type BRAND_LOGOS } from "./BrandPanel"
import { FormatStrip } from "./FormatStrip"
import { OfferPanel } from "./OfferPanel"
import { PublishSheet } from "./PublishSheet"
import { SaveTemplateBox } from "./SaveTemplateBox"
import { MobileTabs, PanelHeader, PropagateBar, ToolRail, TopBar, ZoomControls, tabTitle, type Tab } from "./StudioChrome"
import { useArtSaving } from "./useArtSaving"
import { useArtSetHistory } from "./useArtSetHistory"

export type StudioV2Props = Omit<StudioProps, "ig" | "gbp">

type Promo = StudioProps["promo"]
const MOVE_KEYS = ["x", "y", "width", "height", "rotation"]
const COLOR_KEYS = ["fill", "stroke", "gradient"]
const PROPAGATED_KEYS = ["text", "fill", "src"] as const
const LOCK_MSG = "Este elemento é travado no template. Alterar mesmo assim?"

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))

/** "Story, Feed e Quadrado" */
const formatList = (fs: ArtFormat[]) => {
  const names = fs.map((f) => FORMATS[f].label)
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}` : names[0] || ""
}

const reId = (d: StudioDoc): StudioDoc => ({ ...d, layers: d.layers.map((l) => ({ ...l, id: newId() })) })

export function StudioV2({ promo: initialPromo, onClose, onSavePromo }: StudioV2Props) {
  const isDemo = initialPromo.id === "demo-tutorial"
  const defaultFamily = initialPromo.CAMPAIGN === "black-friday" ? "black-november" : "destaque"
  const [promo, setPromo] = useState<Promo>(initialPromo)
  const vars = useMemo(() => promoVariables(promo), [promo])
  const aiStatus = useAiStatus()
  const { set, commit, silent, reset, undo, redo, canUndo, canRedo, rev, dirty, markSaved } = useArtSetHistory()

  const [format, setFormat] = useState<ArtFormat>("story")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab | null>(null)
  const [isWide, setIsWide] = useState(true)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [fitScale, setFitScale] = useState(0.3)
  const [toast, setToast] = useState<{ type: "ok" | "error"; text: string } | null>(null)
  const [libraryVersion, setLibraryVersion] = useState(0)
  const [bar, setBar] = useState<{ format: ArtFormat; layerName: string; patch: Partial<Layer> } | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [canvasKey, setCanvasKey] = useState(0)
  const canvasBoxRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const lockOk = useRef(new Set<string>())

  const notify = useCallback((type: "ok" | "error", text: string) => setToast({ type, text }), [])
  const { setDesignId, saving, savedAt, templatesVersion, getDataUrl, download, saveDesign, saveTemplate } = useArtSaving({
    set,
    vars,
    format,
    promo,
    isDemo,
    loading,
    rev,
    dirty,
    markSaved,
    notify,
  })

  const doc = set?.docs[format] || null
  const selected = doc?.layers.find((l) => l.id === selectedId) || null

  useEffect(() => {
    void ensureFontsLinked()
    const mq = window.matchMedia("(min-width: 1024px)")
    const update = () => setIsWide(mq.matches)
    update()
    // Computador abre com Templates; celular abre sem gaveta cobrindo a arte
    if (mq.matches) setTab("templates")
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(id)
  }, [toast])

  // "Aplicar nos 4 formatos" some 6 s depois da última edição
  useEffect(() => {
    if (!bar) return
    const id = window.setTimeout(() => setBar(null), 6000)
    return () => window.clearTimeout(id)
  }, [bar])

  // ---------------------------------------------------------------------------
  // Carregamento: arte salva da promo, ou os 4 formatos no modelo padrão
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let alive = true
    const seen = (s: ArtSet): ArtSet => ({ ...s, generated: s.generated.filter((f) => f !== "story") })
    const start = async () => {
      // Sem isso o primeiro desenho sai com a fonte padrão e os textos mudam de tamanho depois
      await preloadAllFonts().catch(() => undefined)
      if (!isDemo) {
        try {
          const saved = await loadSavedArt(initialPromo, defaultFamily)
          if (alive && saved) {
            const { designId: id, ...art } = saved
            setDesignId(id)
            reset(seen(art))
            setLoading(false)
            return
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
      reset(buildArtSet(defaultFamily, photo))
      setLoading(false)
    }
    void start()
    return () => {
      alive = false
    }
  }, [initialPromo.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Zoom para caber na tela
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const box = canvasBoxRef.current
    if (!box || !doc) return
    const compute = () => {
      const pad = isWide ? 64 : 24
      // No computador sobra espaço embaixo para o zoom não cobrir a arte
      const padY = isWide ? pad + 56 : pad
      const s = Math.min((box.clientWidth - pad) / doc.width, (box.clientHeight - padY) / doc.height)
      setFitScale(Math.max(0.05, s))
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(box)
    return () => ro.disconnect()
  }, [doc?.width, doc?.height, isWide, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const scale = fitScale * zoom

  // ---------------------------------------------------------------------------
  // Edição do formato aberto
  // ---------------------------------------------------------------------------
  const selectFormat = (f: ArtFormat) => {
    setFormat(f)
    setSelectedId(null)
    // Selo "gerado agora" sai quando alguém olha o formato
    if (set?.generated.includes(f)) silent((s) => ({ ...s, generated: s.generated.filter((g) => g !== f) }))
  }

  const updateDoc = useCallback(
    (fn: (d: StudioDoc) => StudioDoc, coalesceKey?: string) =>
      commit((s) => markEdited({ ...s, docs: { ...s.docs, [format]: fn(s.docs[format]) } }, format), coalesceKey && `${format}:${coalesceKey}`),
    [commit, format],
  )

  /** Trava de template é aviso: pergunta uma vez por elemento (apagar pergunta sempre) */
  const passLock = (layer: Layer, action: "change" | "delete", patch: Partial<Layer> = {}) => {
    if (!layer.templateLock) return true
    if (action === "change") {
      const keys = Object.keys(patch)
      if (!keys.some((k) => MOVE_KEYS.includes(k) || COLOR_KEYS.includes(k))) return true
      if (lockOk.current.has(layer.id)) return true
    }
    if (!window.confirm(LOCK_MSG)) return false
    lockOk.current.add(layer.id)
    return true
  }

  const patchLayer = (id: string, patch: Partial<Layer>, coalesce = true) => {
    const layer = doc?.layers.find((l) => l.id === id)
    if (!layer || !set) return
    if (!passLock(layer, "change", patch)) {
      setCanvasKey((k) => k + 1) // desfaz o arraste que o canvas já mostrou
      return
    }
    updateDoc(
      (d) => ({ ...d, layers: d.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)) }),
      coalesce ? `${id}:${Object.keys(patch).sort().join(",")}` : undefined,
    )
    // Texto, cor ou imagem de um elemento que existe nos outros formatos: oferece levar para lá
    const picked = Object.fromEntries(PROPAGATED_KEYS.filter((k) => k in patch).map((k) => [k, (patch as Record<string, unknown>)[k]])) as Partial<Layer>
    if (!Object.keys(picked).length || !equivalentLayers(set, format, layer.name).length) return
    setBar((prev) =>
      prev && prev.format === format && prev.layerName === layer.name
        ? { ...prev, patch: { ...prev.patch, ...picked } as Partial<Layer> }
        : { format, layerName: layer.name, patch: picked },
    )
  }

  const applyBar = () => {
    if (!bar) return
    commit((s) => {
      let next = propagate(s, bar.format, bar.layerName, bar.patch)
      for (const { format: f } of equivalentLayers(s, bar.format, bar.layerName)) next = markEdited(next, f)
      return next
    })
    setBar(null)
    setToast({ type: "ok", text: "Aplicado nos 4 formatos" })
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

  const addLogo = (logo: (typeof BRAND_LOGOS)[number]) => {
    if (!doc) return
    const w = Math.round(doc.width * (format === "landscape" ? 0.3 : 0.42))
    const h = Math.round(w * logo.ratio)
    // Story: fora da área segura de cima (250 px)
    const y = format === "story" ? 270 : Math.round(Math.min(doc.width, doc.height) * 0.06)
    addLayers([{ id: newId(), name: `Logo ${logo.label}`, type: "image", role: "logo", src: logo.src, x: Math.round((doc.width - w) / 2), y, width: w, height: h, rotation: 0, opacity: 1, fit: "contain", cornerRadius: 0 }])
  }

  const applyColor = (hex: string) => {
    if (selected && selected.type !== "image") patchLayer(selected.id, selected.type !== "text" && selected.gradient ? { fill: hex, gradient: undefined } : { fill: hex }, false)
    else updateDoc((d) => ({ ...d, background: hex }))
  }

  const deleteLayer = (id: string) => {
    const layer = doc?.layers.find((l) => l.id === id)
    if (!layer || !passLock(layer, "delete")) return
    updateDoc((d) => ({ ...d, layers: d.layers.filter((l) => l.id !== id) }))
    if (selectedId === id) setSelectedId(null)
  }

  const duplicateLayer = (id: string) => {
    const l = doc?.layers.find((x) => x.id === id)
    if (!l) return
    const copy = { ...l, id: newId(), x: l.x + 30, y: l.y + 30, locked: false, templateLock: false } as Layer
    updateDoc((d) => {
      const layers = [...d.layers]
      layers.splice(d.layers.findIndex((x) => x.id === id) + 1, 0, copy)
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
  // Ações nos 4 formatos
  // ---------------------------------------------------------------------------
  const confirmReplace = () => !set?.edited.length || window.confirm(`Substituir os ajustes feitos em ${formatList(set.edited)}?`)

  const chooseFamily = (familyId: string) => {
    if (!confirmReplace()) return
    commit((s) => applyFamily(s, familyId))
    setSelectedId(null)
    setBar(null)
  }

  const applyTemplateSet = (docs: Partial<Record<ArtFormat, StudioDoc>>) => {
    if (!set || !confirmReplace()) return
    // Texto fixo igual a um dado desta promo vira variável (o template serve para qualquer oferta)
    const prepared = Object.fromEntries(
      Object.entries(docs).map(([f, d]) => {
        const fresh = reId(d as StudioDoc)
        return [f, replaceFixedText(fresh, fixedTextHits(fresh, vars))]
      }),
    ) as Partial<Record<ArtFormat, StudioDoc>>
    const missing = FORMAT_ORDER.filter((f) => !prepared[f])
    commit((s) => {
      const next = applyTemplateDocs(s, prepared, defaultFamily)
      return { ...next, family: null, generated: next.generated.filter((f) => f !== format) }
    })
    setSelectedId(null)
    setBar(null)
    if (missing.length) setToast({ type: "ok", text: `Este template não tinha ${formatList(missing)}: ${missing.length > 1 ? "vieram" : "veio"} do modelo padrão.` })
  }

  const setPhoto = (url: string) => {
    commit((s) => {
      const next = setPhotoAll(s, url)
      const current = next.docs[format]
      if (current.layers.some((l) => l.type === "image" && l.role === "photo")) return next
      // Arte sem espaço de foto: a foto entra como fundo deste formato
      const withBg: StudioDoc = {
        ...current,
        layers: [
          { id: newId(), name: "Foto do destino", type: "image", role: "photo", src: url, x: 0, y: 0, width: current.width, height: current.height, rotation: 0, opacity: 1, fit: "cover", cornerRadius: 0 },
          ...current.layers,
        ],
      }
      return markEdited({ ...next, docs: { ...next.docs, [format]: withBg } }, format)
    })
  }

  const setCaptions = useCallback((c: Captions) => commit((s) => ({ ...s, captions: c }), "captions"), [commit])

  // ---------------------------------------------------------------------------
  // Dados da oferta e fechar
  // ---------------------------------------------------------------------------
  const onOfferSaved = useCallback((updated: Record<string, unknown>, sent: Promo) => {
    // Só usa a resposta se ninguém digitou de novo enquanto salvava
    setPromo((cur) => (cur === sent ? ({ ...sent, ...updated } as Promo) : cur))
  }, [])

  const close = async () => {
    if (dirty && !isDemo) await saveDesign(true)
    onClose()
  }

  // ---------------------------------------------------------------------------
  // Atalhos de teclado
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Com o Publicar aberto, os atalhos não mexem na arte por baixo
      if (publishOpen || isTyping(e.target)) return
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      if (mod && key === "z") {
        e.preventDefault()
        if (e.shiftKey) {
          if (canRedo) redo()
        } else if (canUndo) undo()
      } else if (mod && key === "y") {
        e.preventDefault()
        if (canRedo) redo()
      } else if (mod && key === "d" && selectedId) {
        e.preventDefault()
        duplicateLayer(selectedId)
      } else if (mod && key === "s") {
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
  const selectLayer = (id: string | null) => {
    setSelectedId(id)
    if (!isWide && id) setTab("editar")
  }

  const properties = doc ? (
    <PropertiesPanel
      doc={doc}
      layer={selected}
      photoUrl={set?.photo ?? null}
      onChange={(p) => selected && patchLayer(selected.id, p)}
      onBackground={(background) => updateDoc((d) => ({ ...d, background }), "background")}
      onDelete={() => selected && deleteLayer(selected.id)}
      onDuplicate={() => selected && duplicateLayer(selected.id)}
      onMove={(dir) => selected && moveLayer(selected.id, dir)}
    />
  ) : null

  const panel = (t: Tab) => {
    if (!doc || !set) return null
    switch (t) {
      case "templates":
        return (
          <div className="space-y-6">
            <TemplatesPanel
              variant="v2"
              format={format}
              vars={vars}
              photoUrl={set.photo}
              activeFamily={set.family}
              onApplyFamily={chooseFamily}
              onApplyTemplateSet={applyTemplateSet}
              refreshKey={templatesVersion}
            />
            {!isDemo && <SaveTemplateBox defaultName={`${promo.DESTINO} - template`} saving={saving} onSave={saveTemplate} />}
          </div>
        )
      case "marca":
        return <BrandPanel colorTarget={selected && selected.type !== "image" ? "layer" : "background"} onAddLogo={addLogo} onColor={applyColor} />
      case "fotos":
        return <PhotosPanel destino={promo.DESTINO} format={format} photoUrl={set.photo} onSetPhoto={setPhoto} onAddImage={addImage} libraryVersion={libraryVersion} />
      case "textos":
        return <AddPanel doc={doc} onAdd={addLayers} only="texts" />
      case "elementos":
        return <AddPanel doc={doc} onAdd={addLayers} only="elements" />
      case "ia":
        return (
          <AiPanel
            enabled={!!aiStatus?.ai}
            promo={promo}
            format={format}
            photoUrl={set.photo}
            selected={selected}
            onSetPhoto={setPhoto}
            onAddImage={addImage}
            onUseText={useText}
            onCaption={(c) => setCaptions({ instagram: c, facebook: c, whatsapp: c })}
            onLibraryChanged={() => setLibraryVersion((v) => v + 1)}
          />
        )
      case "camadas":
        return (
          <LayersPanel
            layers={doc.layers}
            vars={vars}
            selectedId={selectedId}
            onSelect={selectLayer}
            onPatch={(id, p) => patchLayer(id, p, false)}
            onMove={moveLayer}
            onDelete={deleteLayer}
          />
        )
      case "oferta":
        return <OfferPanel promo={promo} onChange={setPromo} onSavePromo={onSavePromo} onSaved={onOfferSaved} readOnly={isDemo} />
      case "editar":
        return properties
    }
  }

  const statusText = isDemo ? "Demonstração" : saving ? "Salvando…" : dirty ? "Alterações não salvas" : savedAt ? "Salvo" : null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#EEF0F3] text-gray-900" data-tour="studio-editor">
      <TopBar
        title={promo.DESTINO}
        subtitle={String(promo.HOTEL || "")}
        format={format}
        status={statusText}
        canUndo={canUndo}
        canRedo={canRedo}
        publishDisabled={!set}
        onBack={() => void close()}
        onUndo={undo}
        onRedo={redo}
        onDownload={(which, mime) => void download(which, mime)}
        onPublish={() => setPublishOpen(true)}
      />

      <div className="relative flex min-h-0 flex-1">
        {isWide && <ToolRail tab={tab} onTab={setTab} />}

        {/* Painel da ferramenta (computador) */}
        {isWide && tab && tab !== "editar" && (
          <aside className="flex w-[320px] shrink-0 flex-col border-r border-gray-200 bg-white">
            <PanelHeader title={tabTitle(tab)} onClose={() => setTab(null)} closeLabel="Recolher painel" />
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2">{panel(tab)}</div>
          </aside>
        )}

        {/* Arte + miniaturas */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <main ref={canvasBoxRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto" onMouseDown={(e) => e.target === e.currentTarget && setSelectedId(null)}>
            {loading || !doc || !set ? (
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <Spinner className="h-6 w-6" />
                <p className="text-[13px]">Preparando os 4 formatos…</p>
              </div>
            ) : (
              <div className="shadow-2xl" style={{ margin: "auto" }}>
                <StudioCanvas
                  key={canvasKey}
                  doc={doc}
                  vars={vars}
                  scale={scale}
                  selectedId={selectedId}
                  onSelect={selectLayer}
                  onChange={(id, patch, commitIt) => patchLayer(id, patch, !commitIt)}
                  stageRef={stageRef}
                />
              </div>
            )}
            {isWide && (
              <ZoomControls
                percent={Math.round(scale * 100)}
                onZoom={(z) => setZoom((cur) => (z === "fit" ? 1 : z === "in" ? Math.min(6, cur * 1.25) : Math.max(0.25, cur / 1.25)))}
              />
            )}
          </main>

          {bar && <PropagateBar onApply={applyBar} onDismiss={() => setBar(null)} />}

          {set && !loading && <FormatStrip set={set} vars={vars} format={format} onSelect={selectFormat} compact={!isWide} />}
        </div>

        {/* Propriedades (computador) */}
        {isWide && (
          <aside className="w-[290px] shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-4">
            <h2 className="mb-4 flex items-center gap-2 text-[15px] font-black">
              <SlidersHorizontal className="h-4 w-4 text-gray-400" />
              {selected ? selected.name : `Arte · ${FORMATS[format].label}`}
            </h2>
            {properties}
          </aside>
        )}

        {/* Gaveta (celular) */}
        {!isWide && tab && (
          <div className="absolute inset-x-0 bottom-0 z-30 flex max-h-[62%] flex-col rounded-t-3xl border-t border-gray-200 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.12)]">
            <PanelHeader title={tabTitle(tab, selected?.name)} onClose={() => setTab(null)} closeLabel="Fechar painel" />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{panel(tab)}</div>
          </div>
        )}
      </div>

      {!isWide && <MobileTabs tab={tab} onTab={setTab} withEdit={!!selected} />}

      {publishOpen && set && (
        <PublishSheet
          set={set}
          promo={promo}
          getDataUrl={getDataUrl}
          setCaptions={setCaptions}
          format={format}
          onDownload={(which, mime) => void download(which, mime)}
          onClose={() => setPublishOpen(false)}
          onDone={() => void close()}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-24 left-1/2 z-[70] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl px-4 py-3 text-[13px] font-semibold text-white shadow-xl ${toast.type === "ok" ? "bg-gray-900" : "bg-red-600"}`}
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}
