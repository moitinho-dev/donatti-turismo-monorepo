"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePublishSummary } from "@/hooks/usePublishSummary"
import type { PublishSummary } from "@/lib/publishState"
import type { PromoData } from "@/components/promos/dashboard/types"
import type { StudioProps } from "../Studio"
import { applyFamily, type ArtSet } from "../artSet"
import { preloadAllFonts, renderDoc } from "../render"
import { openArt, saveArtSet } from "../savedArt"
import type { ArtFormat } from "../types"
import { promoVariables } from "../variables"
import { BulkPublishSheet } from "./BulkPublishSheet"
import { MultiGrid, type GridItem } from "./MultiGrid"
import { defaultFamilyOf, editedPromos, hasUnpublished, newlyPublished, nextThumbJob, publishedPromoIds, thumbKey, type ThumbCache } from "./multiState"
import { StudioV2 } from "./StudioV2"

export interface StudioMultiProps {
  /** Na ordem da seleção */
  promos: PromoData[]
  isAdmin?: boolean
  onClose: () => void
  onSavePromo: StudioProps["onSavePromo"]
}

type Promo = StudioProps["promo"]
const asPromo = (p: PromoData) => p as unknown as Promo
const omit = <T,>(rec: Record<string, T>, id: string) => Object.fromEntries(Object.entries(rec).filter(([k]) => k !== id)) as Record<string, T>

/** Artes abertas ao mesmo tempo (cada uma lê a arte salva ou monta o modelo) */
const LOAD_AT_ONCE = 3

/** Studio com várias promos: grade com uma arte por promo, template para todas e o editor de cada uma com a fila */
export function StudioMulti({ promos: initial, isAdmin = false, onClose, onSavePromo }: StudioMultiProps) {
  const [list, setList] = useState<PromoData[]>(initial)
  const [format, setFormat] = useState<ArtFormat>("story")
  const [open, setOpen] = useState<number | null>(null)
  const [sets, setSets] = useState<Record<string, ArtSet>>({})
  /** Promos cuja arte salva não deu para ler (fora do "aplicar em todas" até tentar de novo) */
  const [failed, setFailed] = useState<Record<string, true>>({})
  const designIds = useRef<Record<string, string | null>>({})
  const [applying, setApplying] = useState<{ i: number; n: number } | null>(null)
  const [applyErrors, setApplyErrors] = useState<{ destino: string; error: string }[]>([])
  const [fontsReady, setFontsReady] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  /** Promos com algum envio que saiu pelo Publicar todas (republicar não muda o resumo, então não daria para saber por ele) */
  const [sent, setSent] = useState<Set<string>>(() => new Set())
  const ids = useMemo(() => list.map((p) => p.id), [list])

  // ---------------------------------------------------------------------------
  // Situação dos canais: a primeira leitura é a base; o que passou a publicado depois foi publicado nesta sessão
  // ---------------------------------------------------------------------------
  const { summary, refresh } = usePublishSummary()
  const [baseline, setBaseline] = useState<PublishSummary | null>(null)
  if (summary && !baseline) setBaseline(summary)
  const published = useMemo(() => publishedPromoIds(summary), [summary])
  const publishedThisSession = useMemo(() => {
    const out = summary ? newlyPublished(baseline, summary) : new Set<string>()
    for (const id of sent) out.add(id)
    return out
  }, [baseline, summary, sent])

  // ---------------------------------------------------------------------------
  // Artes: a salva de cada promo ou o modelo padrão (o mesmo que o Studio abriria)
  // ---------------------------------------------------------------------------
  // Só a leitura mais recente de cada promo vale (uma releitura lenta não desfaz o template aplicado depois)
  const artSeq = useRef<Record<string, number>>({})
  const bump = (id: string) => (artSeq.current[id] = (artSeq.current[id] || 0) + 1)

  const loadArt = useCallback(async (p: PromoData) => {
    const mine = bump(p.id)
    // Enquanto lê: sem arte (cartão em esqueleto e "Aplicar" travado), para nada gravar por cima de uma arte velha
    setSets((prev) => omit(prev, p.id))
    setFailed((prev) => omit(prev, p.id))
    try {
      // strict: leitura que falhou não vira modelo padrão (salvar por cima criaria outra arte)
      const { set, designId } = await openArt(asPromo(p), defaultFamilyOf(p), { strict: true })
      if (artSeq.current[p.id] !== mine) return
      designIds.current[p.id] = designId
      setSets((prev) => ({ ...prev, [p.id]: set }))
    } catch {
      if (artSeq.current[p.id] !== mine) return
      setFailed((prev) => ({ ...prev, [p.id]: true }))
    }
  }, [])

  useEffect(() => {
    let alive = true
    void preloadAllFonts()
      .catch(() => undefined)
      .then(() => alive && setFontsReady(true))
    const queue = [...initial]
    const worker = async () => {
      for (let p = queue.shift(); p && alive; p = queue.shift()) await loadArt(p)
    }
    for (let i = 0; i < LOAD_AT_ONCE; i++) void worker()
    return () => {
      alive = false
    }
  }, [initial, loadArt])

  // ---------------------------------------------------------------------------
  // Miniaturas: uma por vez, na ordem da grade; guardadas por promo, formato e arte
  // ---------------------------------------------------------------------------
  const [thumbs, setThumbs] = useState<ThumbCache>(() => new Map())
  const drawing = useRef(false)

  useEffect(() => {
    // Com o editor ou o Publicar todas abertos: não disputa o processador com as artes
    if (!fontsReady || open !== null || bulkOpen || drawing.current) return
    const id = nextThumbJob(ids, format, sets, thumbs)
    if (!id) return
    const promo = list.find((p) => p.id === id)!
    const set = sets[id]
    drawing.current = true
    void renderDoc(set.docs[format], promoVariables(asPromo(promo)), { mime: "image/jpeg", quality: 0.8, maxWidth: 360 })
      .catch(() => null) // foto sem liberação de origem: fica sem prévia
      .then((url) => {
        drawing.current = false
        setThumbs((prev) => new Map(prev).set(thumbKey(id, format), { set, url }))
      })
  }, [fontsReady, open, bulkOpen, ids, list, format, sets, thumbs])

  const thumbOf = (id: string, f: ArtFormat): string | null | undefined => {
    const hit = thumbs.get(thumbKey(id, f))
    return hit && hit.set === sets[id] ? hit.url : undefined
  }

  // ---------------------------------------------------------------------------
  // Template para todas
  // ---------------------------------------------------------------------------
  // Todas lidas (as que falharam ficam de fora); nenhuma relendo
  const ready = ids.every((id) => sets[id] || failed[id])

  const applyAll = async (familyId: string) => {
    if (!ready || applying) return
    const targets = list.filter((p) => sets[p.id])
    if (!targets.length) return
    // Arte do Studio antigo sem a lista de ajustes só conta quando há mesmo uma arte salva
    const edited = editedPromos(
      Object.fromEntries(targets.map((p) => [p.id, designIds.current[p.id] ? sets[p.id] : { ...sets[p.id], editedUnknown: false }])),
    )
    if (edited.length && !window.confirm(`Substituir os ajustes de ${edited.length === 1 ? "1 promoção" : `${edited.length} promoções`}?`)) return
    setApplyErrors([])
    const errors: { destino: string; error: string }[] = []
    for (const [i, p] of targets.entries()) {
      setApplying({ i: i + 1, n: targets.length })
      const next = applyFamily(sets[p.id], familyId)
      bump(p.id)
      try {
        const { designId } = await saveArtSet(asPromo(p), next, designIds.current[p.id], { format })
        designIds.current[p.id] = designId
        setSets((prev) => ({ ...prev, [p.id]: next }))
      } catch (err) {
        errors.push({ destino: p.DESTINO, error: err instanceof Error ? err.message : "Erro ao salvar" })
      }
    }
    setApplying(null)
    setApplyErrors(errors)
  }

  // ---------------------------------------------------------------------------
  // Editor de uma promo com a fila
  // ---------------------------------------------------------------------------
  /** Saindo da promo aberta (o Studio já salvou): relê a arte dela e a situação dos canais */
  const leaving = (index: number) => {
    const p = list[index]
    if (p) void loadArt(p)
    void refresh()
  }

  const mergePromo = useCallback((updated: Record<string, unknown>) => {
    setList((cur) => cur.map((x) => (x.id === updated.id ? ({ ...x, ...updated } as PromoData) : x)))
  }, [])

  const savePromo = async (p: Record<string, unknown>) => {
    const updated = await onSavePromo(p)
    mergePromo(updated)
    return updated
  }

  /** Arte que não deu para ler não abre no editor: na grade ela tem o "Tentar de novo" */
  const canOpen = (index: number) => !!list[index] && !failed[list[index].id]

  const close = () => {
    if (hasUnpublished(ids, publishedThisSession) && !window.confirm("Há promoções que ainda não foram publicadas. Fechar mesmo assim?")) return
    onClose()
  }

  if (open !== null && list[open]) {
    const promo = list[open]
    return (
      <StudioV2
        key={promo.id}
        promo={asPromo(promo)}
        isAdmin={isAdmin}
        onClose={() => {
          leaving(open)
          setOpen(null)
        }}
        onSavePromo={savePromo}
        onPromoChange={mergePromo}
        queue={{
          items: list.map((p) => ({
            id: p.id,
            label: p.DESTINO,
            thumb: thumbOf(p.id, format) || thumbOf(p.id, "story") || p.SITE_IMAGE || null,
            published: published.has(p.id),
          })),
          index: open,
          onGo: (i) => {
            leaving(open)
            setOpen(canOpen(i) ? i : null)
          },
          onBackToGrid: () => {
            leaving(open)
            setOpen(null)
          },
        }}
      />
    )
  }

  const items: GridItem[] = list.map((p) => ({
    id: p.id,
    destino: p.DESTINO,
    hotel: String(p.HOTEL || ""),
    thumb: thumbOf(p.id, format),
    edited: !!sets[p.id]?.edited.length,
    published: published.has(p.id),
    failed: !!failed[p.id],
  }))

  return (
    <>
      <MultiGrid
        items={items}
        format={format}
        onFormat={setFormat}
        onOpen={(i) => canOpen(i) && setOpen(i)}
        onClose={close}
        ready={ready}
        applying={applying}
        applyErrors={applyErrors}
        onApply={(f) => void applyAll(f)}
        onDismissErrors={() => setApplyErrors([])}
        onRetry={(id) => {
          const p = list.find((x) => x.id === id)
          if (p) void loadArt(p)
        }}
        canPublishAll={ready && !applying}
        onPublishAll={() => setBulkOpen(true)}
      />
      {bulkOpen && (
        <BulkPublishSheet
          promos={list}
          sets={sets}
          onClose={() => setBulkOpen(false)}
          onSitePublished={(id, fields) => mergePromo({ ...fields, id })}
          onSent={(ids) => {
            if (ids.size) setSent((prev) => new Set([...prev, ...ids]))
            void refresh()
          }}
        />
      )}
    </>
  )
}
