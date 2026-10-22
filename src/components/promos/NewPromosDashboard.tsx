"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { usePromo } from "@/hooks/usePromo"
import { useGoogleBusiness } from "@/hooks/useGoogleBusiness"
import { useInstagram } from "@/hooks/useInstagram"
import { usePromoImages } from "@/hooks/usePromoImages"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { PromoFormModal } from "./PromoFormModal"
import { DashboardHeader } from "./dashboard/DashboardHeader"
import { PromoListPanel } from "./dashboard/PromoListPanel"
import { StatsPanel } from "./dashboard/StatsPanel"
import { DeleteConfirmModal } from "./dashboard/DeleteConfirmModal"
import { BlackFridayPanel } from "./dashboard/BlackFridayPanel"
import type { PromoData, ActivePanel, UserData } from "./dashboard/types"
import type { StudioProps } from "@/components/studio/Studio"

interface NewPromosDashboardProps {
  user: UserData
}

// O editor usa canvas (Konva): carrega só no navegador
const Studio = dynamic(() => import("@/components/studio/Studio").then((m) => m.Studio), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-100 text-sm text-gray-500">Abrindo o Studio…</div>,
})

export default function NewPromosDashboard({ user }: NewPromosDashboardProps) {
  const { promos, isLoading, error, fetchPromos, deletePromo, stats, fetchStats, savePromo } = usePromo()
  const gbp = useGoogleBusiness({ userRole: user.role, fetchPromos })
  const ig = useInstagram()
  const { promoImages, loadingPromoImages, updatePromoImage } = usePromoImages(promos)

  const [activePanel, setActivePanel] = useState<ActivePanel>("list")
  const [selectedPromo, setSelectedPromo] = useState<PromoData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [publishingIds, setPublishingIds] = useState<Record<string, boolean>>({})
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null)

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

  // Publicar sem foto/seção funciona: o servidor completa com foto do destino e seção sugerida
  const handleTogglePublish = async (promo: PromoData) => {
    const publish = !promo.SITE_PUBLISHED
    setPublishing([promo.id], true)
    try {
      const updated = await savePromo({ ...promo, SITE_PUBLISHED: publish })
      if (updated?.SITE_IMAGE) updatePromoImage(updated.id, updated.SITE_IMAGE)
      setNotice({
        type: "success",
        text: publish ? `${promo.DESTINO} publicado no site.` : `${promo.DESTINO} saiu do site.`,
      })
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Erro ao atualizar a promo" })
    } finally {
      setPublishing([promo.id], false)
    }
  }

  const handleUnpublishExpired = async (expired: PromoData[]) => {
    const ids = expired.map((p) => p.id)
    setPublishing(ids, true)
    const results = await Promise.allSettled(expired.map((p) => savePromo({ ...p, SITE_PUBLISHED: false })))
    setPublishing(ids, false)
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

  const handleFormSuccess = () => {
    // Dados da extensão já usados: tira da URL para "Nova promo" abrir em branco
    if (searchParams.get("autofill")) window.history.replaceState(null, "", "/promos")
    setShowFormModal(false)
    setSelectedPromo(null)
    void fetchPromos()
    void fetchStats()
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

  const handleCloseEditor = () => {
    setActivePanel("list")
    setSelectedPromo(null)
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

      <main className="p-3 sm:p-6">
        {(activePanel === "list" || activePanel === "form") && (
          <>
            <BlackFridayPanel promos={promos} />
            <PromoListPanel
              promos={promos}
              isLoading={isLoading}
              error={error}
              promoImages={promoImages}
              loadingPromoImages={loadingPromoImages}
              publishingIds={publishingIds}
              onEdit={handleEdit}
              onGenerateImage={handleGenerateImage}
              onDelete={(id) => setDeleteConfirm(id)}
              onNewPromo={handleNewPromo}
              onTogglePublish={(promo) => void handleTogglePublish(promo)}
              onUnpublishExpired={(list) => void handleUnpublishExpired(list)}
            />
          </>
        )}

        {activePanel === "editor" && selectedPromo && (
          <Studio
            key={selectedPromo.id}
            promo={selectedPromo as unknown as StudioProps["promo"]}
            isAdmin={user.role === "admin"}
            onClose={handleCloseEditor}
            onSavePromo={async (p) => {
              const updated = await savePromo(p)
              setSelectedPromo(updated)
              if (updated?.SITE_IMAGE) updatePromoImage(updated.id, updated.SITE_IMAGE)
              return updated
            }}
            ig={ig}
            gbp={gbp}
          />
        )}

        {activePanel === "stats" && <StatsPanel stats={stats} />}
      </main>

      {notice && (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-[14px] px-4 py-3 text-sm font-semibold shadow-xl max-w-[calc(100vw-2rem)] ${
            notice.type === "success" ? "bg-gray-900 text-white" : "bg-red-600 text-white"
          }`}
        >
          {notice.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {notice.text}
        </div>
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
