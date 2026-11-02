"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { usePromo } from "@/hooks/usePromo"
import { useGoogleBusiness } from "@/hooks/useGoogleBusiness"
import { useInstagram } from "@/hooks/useInstagram"
import { usePromoImages } from "@/hooks/usePromoImages"
import { usePublishSummary } from "@/hooks/usePublishSummary"
import { CheckCircle2, AlertCircle, Layers } from "lucide-react"
import { PromoFormModal } from "./PromoFormModal"
import { DashboardHeader } from "./dashboard/DashboardHeader"
import { PromoListPanel } from "./dashboard/PromoListPanel"
import { MetaPanel } from "./dashboard/MetaPanel"
import { useMeta } from "@/hooks/useMeta"
import { StatsPanel } from "./dashboard/StatsPanel"
import { DeleteConfirmModal } from "./dashboard/DeleteConfirmModal"
import { BlackFridayPanel } from "./dashboard/BlackFridayPanel"
import { BulkActionBar } from "./dashboard/BulkActionBar"
import { keepExisting } from "./dashboard/selection"
import type { PromoData, ActivePanel, UserData } from "./dashboard/types"
import type { StudioProps } from "@/components/studio/Studio"

interface NewPromosDashboardProps {
  user: UserData
}

// O editor usa canvas (Konva): carrega só no navegador
// O lote desenha as artes com o mesmo canvas do Studio
const BatchGenerator = dynamic(() => import("./BatchGenerator").then((m) => m.BatchGenerator), { ssr: false })

const Studio = dynamic(() => import("@/components/studio/Studio").then((m) => m.Studio), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-100 text-sm text-gray-500">Abrindo o Studio…</div>,
})

// Studio novo (4 formatos juntos) só com NEXT_PUBLIC_STUDIO_V2=on; o atual continua o padrão
const STUDIO_V2 = process.env.NEXT_PUBLIC_STUDIO_V2 === "on"
const StudioV2 = dynamic(() => import("@/components/studio/v2/StudioV2").then((m) => m.StudioV2), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-100 text-sm text-gray-500">Abrindo o Studio…</div>,
})

export default function NewPromosDashboard({ user }: NewPromosDashboardProps) {
  const { promos, isLoading, error, fetchPromos, deletePromo, stats, fetchStats, savePromo } = usePromo()
  const gbp = useGoogleBusiness({ userRole: user.role, fetchPromos })
  const ig = useInstagram()
  const meta = useMeta()
  const { promoImages, loadingPromoImages, updatePromoImage } = usePromoImages(promos)
  const { summary: channelSummary, refresh: refreshSummary } = usePublishSummary()

  const [activePanel, setActivePanel] = useState<ActivePanel>("list")
  const [selectedPromo, setSelectedPromo] = useState<PromoData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [publishingIds, setPublishingIds] = useState<Record<string, boolean>>({})
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  // Studio aberto a partir do lote: o lote fica escondido (não perde as artes) e volta ao fechar
  const [batchHidden, setBatchHidden] = useState(false)
  const [batchRefresh, setBatchRefresh] = useState<{ promoId: string; n: number } | null>(null)
  const [campaign, setCampaign] = useState<{ name: string; maxDiscount?: number } | null>(null)
  // Studio novo: promos marcadas na lista (ordem em que foram marcadas). Continua ao trocar o filtro;
  // só contam as que ainda existem
  const [selection, setSelection] = useState<string[]>([])
  const [bulkBusy, setBulkBusy] = useState(false)
  const selectedPromos = useMemo(
    () => keepExisting(selection, promos).map((id) => promos.find((p) => p.id === id)!),
    [selection, promos],
  )
  const showBulkBar = STUDIO_V2 && (activePanel === "list" || activePanel === "form") && selectedPromos.length > 0

  // Campanha no ar (ou no esquenta): o lote já abre com o filtro e o modelo dela
  useEffect(() => {
    fetch("/api/black-friday")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && (d.phase === "esquenta" || d.phase === "ao-vivo")) setCampaign({ name: "Black November", maxDiscount: d.settings?.maxDiscount })
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(id)
  }, [notice])

  const searchParams = useSearchParams()

  useEffect(() => {
    fetchPromos()
    fetchStats()
    // Auto-open form when coming from Chrome extension
    if (searchParams.get("autofill")) {
      setActivePanel("form")
      setSelectedPromo(null)
      setShowFormModal(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void gbp.refreshGbp()
    void ig.refreshIg()
  }, [gbp.refreshGbp, ig.refreshIg])

  const handleEdit = (promo: PromoData) => {
    setSelectedPromo(promo)
    setShowFormModal(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePromo(id)
      void refreshSummary()
      setNotice({ type: "success", text: "Promo excluída." })
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Erro ao excluir" })
    } finally {
      setDeleteConfirm(null)
    }
  }

  const setPublishing = (ids: string[], value: boolean) =>
    setPublishingIds((prev) => {
      const next = { ...prev }
      ids.forEach((id) => (value ? (next[id] = true) : delete next[id]))
      return next
    })

  /**
   * Toda promo que entra no site vai para o Google com a arte paisagem (a do Studio ou o modelo padrão).
   * Devolve o erro pronto para a tela, ou null se deu certo. O desenho da arte (Konva) só carrega aqui,
   * fora do pacote da lista.
   */
  const postGoogle = async (promo: PromoData): Promise<string | null> => {
    let failed: string | null
    try {
      const { postGoogleAfterSite, googleError } = await import("@/lib/client/postGoogle")
      failed = googleError(await postGoogleAfterSite(promo, { photo: promoImages[promo.id] }))
    } catch {
      failed = "Não foi possível publicar no Google. Tente de novo em alguns minutos."
    }
    void refreshSummary()
    return failed
  }

  /**
   * Põe ou tira uma promo do site; ao entrar, vai também para o Google. Mesmo caminho do botão do cartão e da barra
   * de ações em lote. Devolve o erro do site (nada mudou) ou o do Google (o site deu certo), prontos para a tela.
   * Publicar sem foto/seção funciona: o servidor completa com foto do destino e seção sugerida.
   */
  const setSitePublished = async (promo: PromoData, publish: boolean): Promise<{ siteError: string | null; googleError: string | null }> => {
    setPublishing([promo.id], true)
    try {
      const updated: PromoData = await savePromo({ ...promo, SITE_PUBLISHED: publish })
      if (updated?.SITE_IMAGE) updatePromoImage(updated.id, updated.SITE_IMAGE)
      if (!publish) {
        void refreshSummary()
        return { siteError: null, googleError: null }
      }
      return { siteError: null, googleError: await postGoogle(updated) }
    } catch (err) {
      return { siteError: err instanceof Error ? err.message : "Erro ao atualizar a promo", googleError: null }
    } finally {
      setPublishing([promo.id], false)
    }
  }

  const handleTogglePublish = async (promo: PromoData) => {
    const publish = !promo.SITE_PUBLISHED
    const { siteError, googleError } = await setSitePublished(promo, publish)
    if (siteError) setNotice({ type: "error", text: siteError })
    else if (!publish) setNotice({ type: "success", text: `${promo.DESTINO} saiu do site.` })
    else
      setNotice(
        googleError
          ? { type: "error", text: `Publicado no site; o Google falhou: ${googleError}` }
          : { type: "success", text: "Publicado no site e no Google." },
      )
  }

  // ---- Ações em lote (Studio novo): uma promo por vez, na ordem da seleção ----

  /** Depois de qualquer ação em lote: limpa a seleção e atualiza a lista e os canais */
  const finishBulk = () => {
    setSelection([])
    setBulkBusy(false)
    void fetchPromos()
    void fetchStats()
    void refreshSummary()
  }

  /** "{ok} feitas; {erro} com erro." com a primeira mensagem do servidor (ex.: sem permissão) */
  const bulkNotice = (ok: number, errors: string[], allDone: string, partial: (ok: number, n: number) => string) =>
    setNotice(
      errors.length
        ? { type: "error", text: `${partial(ok, errors.length)} ${errors[0]}` }
        : { type: "success", text: allDone },
    )

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

  const handleBulkSite = async (publish: boolean) => {
    // Quem já está como pedido fica de fora (não posta de novo no Google)
    const targets = selectedPromos.filter((p) => !!p.SITE_PUBLISHED !== publish)
    if (!targets.length) return
    setBulkBusy(true)
    const errors: string[] = []
    for (const promo of targets) {
      const { siteError, googleError } = await setSitePublished(promo, publish)
      if (siteError) errors.push(siteError)
      else if (googleError) errors.push(`${promo.DESTINO}: entrou no site, mas o Google falhou: ${googleError}`)
    }
    const ok = targets.length - errors.length
    if (publish)
      bulkNotice(ok, errors, `${plural(ok, "publicada", "publicadas")} no site.`, (o, e) => `${plural(o, "publicada", "publicadas")}; ${e} com erro.`)
    else
      bulkNotice(ok, errors, `${plural(ok, "tirada", "tiradas")} do site.`, (o, e) => `${plural(o, "tirada", "tiradas")} do site; ${e} com erro.`)
    finishBulk()
  }

  const handleBulkDelete = async () => {
    const targets = selectedPromos
    if (!window.confirm(`Excluir ${plural(targets.length, "promoção", "promoções")}? Isso não pode ser desfeito.`)) return
    setBulkBusy(true)
    const errors: string[] = []
    for (const promo of targets) {
      try {
        await deletePromo(promo.id)
      } catch (err) {
        errors.push(err instanceof Error ? err.message : "Erro ao excluir")
      }
    }
    const ok = targets.length - errors.length
    bulkNotice(ok, errors, `${plural(ok, "excluída", "excluídas")}.`, (o, e) => `${plural(o, "excluída", "excluídas")}; ${e} com erro.`)
    finishBulk()
  }

  /** Cópia da promo (fora do site, sem artes/posts) e já abre o formulário dela para ajustar */
  const handleDuplicate = async () => {
    const [promo] = selectedPromos
    if (!promo || selectedPromos.length !== 1) return
    setBulkBusy(true)
    try {
      const res = await fetch(`/api/promos/${encodeURIComponent(promo.id)}/duplicate`, { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Erro ao duplicar a promo")
      setNotice({ type: "success", text: "Cópia criada." })
      finishBulk()
      handleEdit(data as PromoData)
    } catch (err) {
      setBulkBusy(false)
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Erro ao duplicar a promo" })
    }
  }

  const handleBulkOpenStudio = () => {
    const [promo] = selectedPromos
    if (!promo) return
    setSelection([])
    handleGenerateImage(promo)
  }

  const handleUnpublishExpired = async (expired: PromoData[]) => {
    const ids = expired.map((p) => p.id)
    setPublishing(ids, true)
    const results = await Promise.allSettled(expired.map((p) => savePromo({ ...p, SITE_PUBLISHED: false })))
    setPublishing(ids, false)
    void refreshSummary()
    const failed = results.filter((r) => r.status === "rejected").length
    setNotice(
      failed
        ? { type: "error", text: `${failed} promo(s) não puderam ser atualizadas. Tente de novo.` }
        : { type: "success", text: `${expired.length} promo(s) vencida(s) retiradas do site.` },
    )
  }

  const handleGenerateImage = (promo: PromoData) => {
    setSelectedPromo(promo)
    setActivePanel("editor")
  }

  const handleFormSuccess = (saved?: Record<string, unknown>, created?: boolean) => {
    // Dados da extensão já usados: tira da URL para "Nova promo" abrir em branco
    if (searchParams.get("autofill")) window.history.replaceState(null, "", "/promos")
    setShowFormModal(false)
    setSelectedPromo(null)
    void fetchPromos()
    void fetchStats()
    void refreshSummary()
    const promo = saved?.id ? (saved as unknown as PromoData) : null
    // Promo no site: vai para o Google se ainda não foi, se deu erro ou se a oferta mudou (o post novo substitui o anterior)
    if (promo?.SITE_PUBLISHED) void syncGoogleAfterSave(promo, !!created)
    // Promo nova: o próximo passo é a arte, então o Studio já abre com ela
    if (created && promo) handleGenerateImage(promo)
  }

  const syncGoogleAfterSave = async (promo: PromoData, created: boolean) => {
    // Sem conseguir carregar a verificação, segue para o post (o post novo substitui o anterior)
    const needsPost = await import("@/lib/client/postGoogle").then(({ googleNeedsPost }) => googleNeedsPost(promo.id)).catch(() => true)
    if (!needsPost) return
    setPublishing([promo.id], true)
    try {
      const failed = await postGoogle(promo)
      setNotice(
        failed
          ? { type: "error", text: `${created ? "Publicado no site" : "Promo salva"}; o Google falhou: ${failed}` }
          : { type: "success", text: created ? "Publicado no site e no Google." : "Promo salva e Google atualizado." },
      )
    } finally {
      setPublishing([promo.id], false)
    }
  }

  const handleNewPromo = () => {
    setSelectedPromo(null)
    setShowFormModal(true)
  }

  const handleOpenStudioDemo = () => {
    const mockPromo: PromoData = {
      id: "demo-tutorial",
      DESTINO: "Cancun",
      HOTEL: "Grand Oasis Cancun",
      DATA_FORMATADA: "15/07 ate 22/07 de 2026",
      VALOR: "8500.00",
      PARCELAS: 10,
      COM_CAFE: false,
      SEM_CAFE: false,
      MEIA_PENSAO: false,
      PENSAO_COMPLETA: false,
      ALL_INCLUSIVE: true,
      NUMERO_DE_NOITES: "7",
      SP: true,
      CG: true,
      AEREO: true,
      SITE_PUBLISHED: false,
      SITE_SECTION: "internacionais",
      SITE_SLUG: "cancun-all-inclusive",
      SITE_IMAGE: null,
      SITE_DESCRIPTION: "Cancun All Inclusive 7 noites",
    }
    handleGenerateImage(mockPromo)
  }

  const handleStudioSavePromo = async (p: Record<string, unknown>) => {
    const wasOnSite = !!selectedPromo?.SITE_PUBLISHED
    const updated = await savePromo(p)
    setSelectedPromo(updated)
    if (updated?.SITE_IMAGE) updatePromoImage(updated.id, updated.SITE_IMAGE)
    // Studio atual: "Publicar no site" passa por aqui, então o Google vai junto (o Studio novo publica o Google sozinho)
    if (!STUDIO_V2 && !wasOnSite && updated?.SITE_PUBLISHED) {
      // Enquanto posta, o botão "Postar oferta no Google" do Studio fica travado (não posta duas vezes)
      setPublishing([updated.id], true)
      void postGoogle(updated)
        .then((failed) => {
          if (failed) setNotice({ type: "error", text: `Publicado no site; o Google falhou: ${failed}` })
        })
        .finally(() => setPublishing([updated.id], false))
    }
    return updated
  }

  const handleCloseEditor = () => {
    if (batchHidden && selectedPromo) {
      setBatchRefresh((r) => ({ promoId: selectedPromo.id, n: (r?.n || 0) + 1 }))
      setBatchHidden(false)
    }
    setActivePanel("list")
    setSelectedPromo(null)
    // O Studio pode ter publicado em canais e mudado a oferta
    void fetchPromos()
    void refreshSummary()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        user={user}
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        onNewPromo={handleNewPromo}
        onOpenModal={handleNewPromo}
        onOpenStudio={handleOpenStudioDemo}
      />

      <main className={`p-3 sm:p-6 ${showBulkBar ? "pb-28 sm:pb-28" : ""}`}>
        {(activePanel === "list" || activePanel === "form") && (
          <>
            <BlackFridayPanel promos={promos} />
            <MetaPanel meta={meta} />
            <div className="max-w-7xl mx-auto mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-[15px] font-black text-gray-900">Artes em lote</p>
                <p className="text-[13px] text-gray-500">Feed, stories, Facebook e Canal do WhatsApp de várias ofertas de uma vez, com legenda.</p>
              </div>
              <button
                type="button"
                onClick={() => setBatchOpen(true)}
                className="inline-flex items-center gap-2 rounded-[14px] bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800"
              >
                <Layers className="h-4 w-4" />
                Gerar em lote
              </button>
            </div>
            <PromoListPanel
              promos={promos}
              isLoading={isLoading}
              error={error}
              promoImages={promoImages}
              loadingPromoImages={loadingPromoImages}
              publishingIds={publishingIds}
              channelSummary={channelSummary}
              onEdit={handleEdit}
              onGenerateImage={handleGenerateImage}
              onDelete={(id) => setDeleteConfirm(id)}
              onNewPromo={handleNewPromo}
              onTogglePublish={(promo) => void handleTogglePublish(promo)}
              onUnpublishExpired={(list) => void handleUnpublishExpired(list)}
              {...(STUDIO_V2 ? { selectedIds: selectedPromos.map((p) => p.id), onSelectionChange: setSelection } : {})}
            />
          </>
        )}

        {activePanel === "editor" && selectedPromo && (STUDIO_V2 ? (
          <StudioV2
            key={selectedPromo.id}
            promo={selectedPromo as unknown as StudioProps["promo"]}
            isAdmin={user.role === "admin"}
            onClose={handleCloseEditor}
            onSavePromo={handleStudioSavePromo}
          />
        ) : (
          <Studio
            key={selectedPromo.id}
            promo={selectedPromo as unknown as StudioProps["promo"]}
            isAdmin={user.role === "admin"}
            onClose={handleCloseEditor}
            onSavePromo={handleStudioSavePromo}
            ig={ig}
            gbp={gbp}
            googlePosting={!!publishingIds[selectedPromo.id]}
          />
        ))}

        {activePanel === "stats" && <StatsPanel stats={stats} />}
      </main>

      {notice && (
        <div
          role="status"
          className={`fixed ${showBulkBar ? "bottom-24" : "bottom-4"} left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-[14px] px-4 py-3 text-sm font-semibold shadow-xl max-w-[calc(100vw-2rem)] ${
            notice.type === "success" ? "bg-gray-900 text-white" : "bg-red-600 text-white"
          }`}
        >
          {notice.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {notice.text}
        </div>
      )}

      {batchOpen && (
        <div hidden={batchHidden}>
          <BatchGenerator
            promos={promos}
            promoImages={promoImages}
            campaign={campaign}
            meta={meta}
            refresh={batchRefresh}
            onEditInStudio={(p) => {
              setBatchHidden(true)
              handleGenerateImage(p)
            }}
            onClose={() => setBatchOpen(false)}
          />
        </div>
      )}

      {showBulkBar && (
        <BulkActionBar
          count={selectedPromos.length}
          selectedIds={selectedPromos.map((p) => p.id)}
          busy={bulkBusy}
          canPublish={selectedPromos.some((p) => !p.SITE_PUBLISHED)}
          canUnpublish={selectedPromos.some((p) => p.SITE_PUBLISHED)}
          onOpenStudio={handleBulkOpenStudio}
          onPublishSite={() => void handleBulkSite(true)}
          onUnpublishSite={() => void handleBulkSite(false)}
          onDuplicate={() => void handleDuplicate()}
          onDelete={() => void handleBulkDelete()}
          onClear={() => setSelection([])}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <PromoFormModal
        promo={showFormModal ? (selectedPromo as unknown as Record<string, unknown> | null) : null}
        autofill={selectedPromo ? null : searchParams.get("autofill")}
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); setSelectedPromo(null) }}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
