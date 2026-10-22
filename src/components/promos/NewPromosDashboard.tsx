"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { usePromo } from "@/hooks/usePromo"
import { useGoogleBusiness } from "@/hooks/useGoogleBusiness"
import { useInstagram } from "@/hooks/useInstagram"
import { usePromoImages } from "@/hooks/usePromoImages"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { PromoFormModal } from "./PromoFormModal"
import { DashboardHeader } from "./dashboard/DashboardHeader"
import { PromoListPanel } from "./dashboard/PromoListPanel"
import { DonatiStudio } from "./DonatiStudio"
import { StatsPanel } from "./dashboard/StatsPanel"
import { DeleteConfirmModal } from "./dashboard/DeleteConfirmModal"
import { BlackFridayPanel } from "./dashboard/BlackFridayPanel"
import type { PromoData, ActivePanel, UserData } from "./dashboard/types"
import { slugify } from "./dashboard/types"
import { suggestSiteSection } from "@/lib/destinations"

interface NewPromosDashboardProps {
  user: UserData
}

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

  // Image gallery state
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<Array<{ id: string; urls: { regular: string; small: string } }>>([])
  const [loadingImages, setLoadingImages] = useState(false)

  // Site card state
  const [sitePublished, setSitePublished] = useState(false)
  const [siteSection, setSiteSection] = useState("")
  const [siteSlug, setSiteSlug] = useState("")
  const [siteDescription, setSiteDescription] = useState("")
  const [savingSiteCard, setSavingSiteCard] = useState(false)
  const [siteCardMessage, setSiteCardMessage] = useState<string | null>(null)
  const [siteCardError, setSiteCardError] = useState<string | null>(null)

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

  // Sync site card state when promo changes
  useEffect(() => {
    if (!selectedPromo) return
    setSitePublished(!!selectedPromo.SITE_PUBLISHED)
    setSiteSection(selectedPromo.SITE_SECTION || suggestSiteSection(selectedPromo.DESTINO || "") || "nacionais")
    setSiteSlug(selectedPromo.SITE_SLUG || slugify(selectedPromo.DESTINO || ""))
    setSiteDescription(selectedPromo.SITE_DESCRIPTION || selectedPromo.HOTEL || "")
    setSiteCardMessage(null)
    setSiteCardError(null)
    if (selectedPromo.SITE_IMAGE && !backgroundImage) {
      setBackgroundImage(selectedPromo.SITE_IMAGE)
    }
  }, [selectedPromo?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveSiteCard = useCallback(async () => {
    if (!selectedPromo?.id) return

    const imageToSave = backgroundImage || selectedPromo.SITE_IMAGE || ""
    if (!imageToSave) {
      setSiteCardError("Selecione uma imagem de fundo para salvar no card.")
      return
    }

    const nextSection = (siteSection || "").trim()
    if (sitePublished && !nextSection) {
      setSiteCardError("Escolha a seção antes de publicar.")
      return
    }

    const nextSlug = (siteSlug || slugify(selectedPromo.DESTINO || "")).trim()
    if (sitePublished && !nextSlug) {
      setSiteCardError("Defina o slug antes de publicar.")
      return
    }

    setSavingSiteCard(true)
    setSiteCardError(null)
    setSiteCardMessage(null)
    try {
      const updated = await savePromo({
        ...selectedPromo,
        SITE_PUBLISHED: sitePublished,
        SITE_SECTION: nextSection,
        SITE_SLUG: nextSlug,
        SITE_IMAGE: imageToSave,
        SITE_DESCRIPTION: (siteDescription || selectedPromo.HOTEL || "").trim(),
      })
      setSelectedPromo(updated)
      updatePromoImage(updated.id, updated.SITE_IMAGE || imageToSave)
      setSiteCardMessage(sitePublished ? "Publicado no site com a imagem selecionada." : "Imagem do card salva (nao publicado).")
      await fetchPromos()
    } catch (err) {
      setSiteCardError(err instanceof Error ? err.message : "Erro ao salvar card do site")
    } finally {
      setSavingSiteCard(false)
    }
  }, [backgroundImage, fetchPromos, savePromo, selectedPromo, siteDescription, sitePublished, siteSection, siteSlug, updatePromoImage])

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

  const handleGenerateImage = async (promo: PromoData) => {
    setSelectedPromo(promo)
    setSitePublished(!!promo.SITE_PUBLISHED)
    setSiteSection(promo.SITE_SECTION || suggestSiteSection(promo.DESTINO || "") || "nacionais")
    setSiteSlug(promo.SITE_SLUG || slugify(promo.DESTINO || ""))
    setSiteDescription(promo.SITE_DESCRIPTION || promo.HOTEL || "")
    setSiteCardMessage(null)
    setSiteCardError(null)
    setLoadingImages(true)
    setBackgroundImage(promo.SITE_IMAGE || null)

    try {
      const response = await fetch(`/api/image-search?query=${encodeURIComponent(promo.DESTINO)}&limit=20`)
      const data = await response.json()
      if (data.results?.length > 0) {
        setGalleryImages(data.results)
        if (!promo.SITE_IMAGE) {
          setBackgroundImage(data.results[0].urls.regular)
        }
      }
    } catch (err) {
      console.error("Error fetching images:", err)
    } finally {
      setLoadingImages(false)
    }

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
    setBackgroundImage(null)
    setGalleryImages([])
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
          <DonatiStudio
            promo={selectedPromo}
            user={user}
            backgroundImage={backgroundImage}
            setBackgroundImage={setBackgroundImage}
            galleryImages={galleryImages}
            setGalleryImages={setGalleryImages}
            loadingImages={loadingImages}
            setLoadingImages={setLoadingImages}
            sitePublished={sitePublished}
            setSitePublished={setSitePublished}
            siteSection={siteSection}
            setSiteSection={setSiteSection}
            siteSlug={siteSlug}
            setSiteSlug={setSiteSlug}
            siteDescription={siteDescription}
            setSiteDescription={setSiteDescription}
            savingSiteCard={savingSiteCard}
            siteCardError={siteCardError}
            siteCardMessage={siteCardMessage}
            onSaveSiteCard={() => void saveSiteCard()}
            gbp={gbp}
            ig={ig}
            onClose={handleCloseEditor}
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
